import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import MediaLibrary from './MediaLibrary';
import Timeline from './Timeline';
import Preview from './Preview';
import { toast } from 'sonner';
import { Film, Music, TextIcon, Mic, FolderOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MediaSidebar from './MediaSidebar';
import { saveProject, saveUserPreferences } from '@/lib/projectService';
import { useQuery } from '@tanstack/react-query';
import { getUserPreferences } from '@/lib/projectService';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface HTMLVideoElement {
    captureStream(): MediaStream;
  }
}

export interface TimelineItem {
  id: string;
  trackId: string;
  start: number;
  duration: number;
  type: 'video' | 'audio' | 'image';
  name: string;
  color: string;
  src?: string;
  thumbnail?: string;
  volume?: number;
  muted?: boolean;
  trimStart?: number; // Trim from start in seconds
  trimEnd?: number; // Trim from end in seconds
}

const VideoEditor: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(600); // Total timeline duration in seconds (10 minutes)
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("visuals");
  const [timelineScale, setTimelineScale] = useState(80); // scale for timeline (pixels per second)
  const [history, setHistory] = useState<TimelineItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch user preferences from Supabase
  const { data: userPrefsData } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: getUserPreferences,
    enabled: !!user, // Only run this query if user is authenticated
  });
  
  // Load user preferences when available
  useEffect(() => {
    if (userPrefsData?.success && userPrefsData.preferences) {
      const prefs = userPrefsData.preferences;
      if (prefs.defaultVolume !== undefined) setVolume(prefs.defaultVolume);
      if (prefs.timelineScale !== undefined) setTimelineScale(prefs.timelineScale);
    }
  }, [userPrefsData]);
  
  // Check authentication status on load
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    
    checkUser();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (JSON.stringify(timelineItems) !== JSON.stringify(history[historyIndex])) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...timelineItems]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [timelineItems]);
  
  useEffect(() => {
    const calculateTimelineDuration = () => {
      if (timelineItems.length === 0) return 600; // Default duration if no items (10 minutes)
      
      const lastItemEndTime = Math.max(
        ...timelineItems.map(item => item.start + item.duration)
      );
      
      return Math.max(lastItemEndTime + 2, 600);
    };
    
    setDuration(calculateTimelineDuration());
  }, [timelineItems]);
  
  useEffect(() => {
    let playbackInterval: number;
    
    if (isPlaying) {
      playbackInterval = window.setInterval(() => {
        setCurrentTime(prevTime => {
          const lastMediaEndTime = timelineItems.length > 0 ?
            Math.max(...timelineItems.map(item => item.start + item.duration)) : 0;
          
          if (prevTime >= lastMediaEndTime) {
            setIsPlaying(false);
            return 0;
          }
          return prevTime + 0.1;
        });
      }, 100);
    }
    
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [isPlaying, timelineItems]);
  
  // Save user preferences when they change
  useEffect(() => {
    const savePreferences = async () => {
      if (!user) return;
      
      await saveUserPreferences({
        defaultVolume: volume, 
        timelineScale
      });
    };
    
    const debounce = setTimeout(() => {
      savePreferences();
    }, 1000);
    
    return () => clearTimeout(debounce);
  }, [volume, timelineScale, user]);
  
  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const result = await saveProject(projectName, timelineItems, duration);
      
      if (result.success) {
        toast.success('Project saved', {
          description: `${projectName} has been saved to your projects.`,
        });
      } else if (result.error) {
        if (result.error.includes('not authenticated')) {
          toast.info('Project saved locally', {
            description: 'Sign in to save projects to your account.',
          });
        } else {
          toast.error('Failed to save project', {
            description: result.error,
          });
        }
      }
    } catch (error) {
      toast.error('Error saving project', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add this helper function at the top of the component, before handleExport
  const downloadFile = async (url: string, filename: string) => {
    try {
      // First try to fetch the file as a blob
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create a blob URL from the fetched content
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a hidden anchor element for downloading
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      
      // Append to document, click and remove
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  };

  const handleExport = async () => {
    toast.success('Export started', {
      description: 'Your video is being prepared for download.',
    });
    
    try {
      // Get the video element from the DOM
      const videoElement = document.querySelector('video');
      
      if (!videoElement) {
        throw new Error('Video element not found');
      }
      
      // Basic validation that we have content to export
      if (timelineItems.length === 0) {
        toast.error('Nothing to export', {
          description: 'Please add some media to the timeline first.',
        });
        return;
      }
      
      // First, try to find the direct source of the active video
      const activeVideos = timelineItems.filter(item => 
        item.type === 'video' && 
        currentTime >= item.start && 
        currentTime < (item.start + item.duration)
      );
      
      const activeVideo = activeVideos.length > 0 ? activeVideos[activeVideos.length - 1] : null;
      
      // FALLBACK: Direct file download if stream capture isn't supported
      if (activeVideo && activeVideo.src) {
        console.log('Using direct download fallback');
        
        const filename = `${projectName.replace(/\s+/g, '_')}_export.mp4`;
        const success = await downloadFile(activeVideo.src, filename);
        
        if (success) {
          toast.success('Export complete', {
            description: 'Your video has been downloaded.',
          });
          return;
        } else {
          console.log('Direct download failed, trying alternative methods');
        }
      }
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        toast.error('Your browser does not support MediaRecorder API', {
          description: 'Please try using Chrome, Edge, or Firefox.',
        });
        return;
      }
      
      console.log('Video element found:', videoElement);
      
      // Check which codecs are supported
      const getSupportedMimeType = () => {
        const types = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4',
        ];
        
        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
            console.log('Supported MIME type:', type);
            return type;
          }
        }
        return null;
      };
      
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported video format found for recording');
      }
      
      // File extension based on mime type
      const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      
      // Create a MediaRecorder from the video stream
      let stream;
      try {
        // First try the standard method
        stream = videoElement.captureStream();
        console.log('Stream created successfully using captureStream()');
      } catch (e) {
        console.error('Error using captureStream():', e);
        
        try {
          // Try with mozCaptureStream for Firefox
          // @ts-ignore
          if (typeof videoElement.mozCaptureStream === 'function') {
            // @ts-ignore
            stream = videoElement.mozCaptureStream();
            console.log('Stream created successfully using mozCaptureStream()');
          } else {
            throw new Error('No captureStream method available');
          }
        } catch (mozError) {
          console.error('Error using mozCaptureStream():', mozError);
          
          // FALLBACK: Try canvas-based capture as last resort
          try {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth || 640;
            canvas.height = videoElement.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Could not get canvas context');
            }
            
            // Draw the current frame
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            
            // Try to get a stream from the canvas
            stream = canvas.captureStream(30); // 30 FPS
            console.log('Using canvas fallback for stream capture');
          } catch (canvasError) {
            console.error('Canvas capture failed:', canvasError);
            
            // If all stream capture methods fail, just download the current source if available
            if (activeVideo && activeVideo.src) {
              const filename = `${projectName.replace(/\s+/g, '_')}_export.mp4`;
              const success = await downloadFile(activeVideo.src, filename);
              
              if (success) {
                toast.success('Export complete', {
                  description: 'Your video has been downloaded directly.',
                });
                return;
              } else {
                throw new Error('Unable to capture video stream');
              }
            } else {
              throw new Error('Unable to capture video stream');
            }
          }
        }
      }
      
      if (!stream) {
        throw new Error('Failed to create media stream');
      }
      
      console.log('Setting up MediaRecorder with mimeType:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000 // 5 Mbps
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        console.log('Data available, chunk size:', e.data.size);
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      // Handle recording errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording error', {
          description: 'An error occurred during video recording.',
        });
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', chunks.length);
        
        if (chunks.length === 0) {
          toast.error('No video data captured', {
            description: 'Try playing the video before exporting.',
          });
          return;
        }
        
        // Create a blob from the recorded chunks
        const blob = new Blob(chunks, { type: mimeType });
        console.log('Blob created, size:', blob.size);
        
        if (blob.size === 0) {
          toast.error('Generated file is empty', {
            description: 'Please try again or use a different browser.',
          });
          return;
        }
        
        // Create object URL
        const url = URL.createObjectURL(blob);
        
        // Create a download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_')}_export.${fileExtension}`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        toast.success('Export complete', {
          description: 'Your video has been downloaded.',
        });
      };
      
      // Save current playback state and position
      const wasPlaying = isPlaying;
      const currentPosition = currentTime;
      
      // Set up a way to track when the video has reached the end of the timeline
      const handleVideoEnd = () => {
        console.log('Video ended event triggered');
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          videoElement.removeEventListener('ended', handleVideoEnd);
          
          // Restore original playback state and position
          if (!wasPlaying) {
            setTimeout(() => {
              videoElement.pause();
              setCurrentTime(currentPosition);
              handleSeek(currentPosition);
            }, 100);
          }
        }
      };
      
      // Set video to beginning
      setCurrentTime(0);
      handleSeek(0);
      videoElement.currentTime = 0;
      
      // Listen for video completion
      videoElement.addEventListener('ended', handleVideoEnd, { once: true });
      
      // Also listen for timeupdate to ensure we catch the end
      const handleTimeUpdate = () => {
        if (videoElement.currentTime >= duration - 0.5) {
          console.log('Reached end of timeline via timeupdate');
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
          }
        }
      };
      
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      
      console.log('Starting MediaRecorder...');
      
      // Start recording
      mediaRecorder.start(1000); // Collect data in 1-second chunks
      
      // Request data chunk immediately
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.requestData();
        }
      }, 500);
      
      // Ensure we're recording
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Play the video
      console.log('Playing video...');
      setIsPlaying(true);
      
      try {
        await videoElement.play();
      } catch (playError) {
        console.error('Error playing video:', playError);
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        throw new Error('Could not play the video for recording');
      }
      
      // Set a max recording time as a fallback
      const maxRecordingTime = Math.min(duration * 1000, 30 * 60 * 1000);
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log('Export timeout reached, stopping recorder');
          mediaRecorder.stop();
          videoElement.removeEventListener('ended', handleVideoEnd);
          videoElement.removeEventListener('timeupdate', handleTimeUpdate);
          
          // Restore original playback state
          if (!wasPlaying) {
            videoElement.pause();
            setIsPlaying(false);
            setCurrentTime(currentPosition);
            handleSeek(currentPosition);
          }
        }
      }, maxRecordingTime + 1000); // Add 1 second buffer
      
    } catch (error) {
      console.error('Export error:', error);
      
      // Provide a more specific error message
      let errorMessage = 'An error occurred while exporting your video.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check if there's any video item we can directly download
      const videoItems = timelineItems.filter(item => item.type === 'video' && item.src);
      
      if (videoItems.length > 0) {
        const firstVideo = videoItems[0];
        toast.info('Trying direct download instead', {
          description: 'Downloading the original video file.',
        });
        
        const filename = `${projectName.replace(/\s+/g, '_')}_export.mp4`;
        const success = await downloadFile(firstVideo.src!, filename);
        
        if (success) {
          toast.success('Export complete', {
            description: 'Your video has been downloaded.',
          });
          return;
        } else {
          toast.error('Download failed', {
            description: 'Could not download the video file directly.',
          });
        }
      }
      
      // Fallback to screenshots if recording fails
      if (errorMessage.includes('captureStream') || errorMessage.includes('MediaRecorder')) {
        toast.error('Export failed', {
          description: 'Your browser may not support video recording. Try using Chrome or Firefox.',
        });
      } else {
        toast.error('Export failed', {
          description: errorMessage,
        });
      }
    }
  };

  const handleRename = (name: string) => {
    setProjectName(name);
    toast.success('Project renamed', {
      description: `Project is now named "${name}".`,
    });
  };

  const handleAddTimelineItem = (item: TimelineItem) => {
    setTimelineItems(prev => [...prev, item]);
    toast.success('Media added', {
      description: `Added ${item.name} to the timeline.`,
    });
  };

  const handleRemoveTimelineItem = (id: string) => {
    setTimelineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateTimelineItem = (updatedItem: TimelineItem) => {
    setTimelineItems(prev => 
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const handleToggleMute = () => {
    setMuted(prev => !prev);
  };

  const handleTimelineZoomIn = () => {
    setTimelineScale(prev => Math.min(prev * 1.2, 200));
  };

  const handleTimelineZoomOut = () => {
    setTimelineScale(prev => Math.max(prev / 1.2, 20));
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTimelineItems([...history[historyIndex - 1]]);
      toast.info('Undo successful');
    } else {
      toast.info('Nothing to undo');
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTimelineItems([...history[historyIndex + 1]]);
      toast.info('Redo successful');
    } else {
      toast.info('Nothing to redo');
    }
  };
  
  const handleTrimItem = () => {
    if (!selectedItem) {
      toast.info('Please select an item to trim');
      return;
    }
    
    if (selectedItem.duration > 1) {
      const updatedItem = {
        ...selectedItem,
        duration: selectedItem.duration - 1
      };
      
      handleUpdateTimelineItem(updatedItem);
      toast.success('Item trimmed by 1 second');
    } else {
      toast.info('Item is too short to trim further');
    }
  };
  
  useEffect(() => {
    const handleAddItem = (e: CustomEvent<TimelineItem>) => {
      handleAddTimelineItem(e.detail);
    };
    
    const handleGetTimelineItems = (e: CustomEvent<{callback: (items: TimelineItem[]) => void}>) => {
      if (e.detail && e.detail.callback) {
        e.detail.callback([...timelineItems]);
      }
    };
    
    window.addEventListener('add-timeline-item', handleAddItem as EventListener);
    document.addEventListener('get-timeline-items', handleGetTimelineItems as EventListener);
    
    return () => {
      window.removeEventListener('add-timeline-item', handleAddItem as EventListener);
      document.removeEventListener('get-timeline-items', handleGetTimelineItems as EventListener);
    };
  }, [timelineItems]);
  
  useEffect(() => {
    const handleVideoVolumeChange = (e: CustomEvent<{id: string, volume: number}>) => {
      if (e.detail && e.detail.id) {
        handleUpdateTimelineItem({
          ...timelineItems.find(item => item.id === e.detail.id)!,
          volume: e.detail.volume
        });
      }
    };
    
    window.addEventListener('video-volume-change', handleVideoVolumeChange as EventListener);
    
    return () => {
      window.removeEventListener('video-volume-change', handleVideoVolumeChange as EventListener);
    };
  }, [timelineItems]);
  
  const selectedVideo = selectedItem?.type === 'video' ? selectedItem : 
    timelineItems.find(item => item.type === 'video' && item.id === selectedItem?.id) || null;
  
  return (
    <div className="flex flex-col h-full bg-[#000000] text-[#EEEEEE] overflow-hidden">
      <Header 
        projectName={projectName}
        onRename={handleRename}
        onSave={handleSave}
        onExport={handleExport}
        isSaving={isSaving}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[30%] max-w-[300px] min-w-[200px] h-full flex flex-col border-r border-white/10">
          <MediaSidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onAddToTimeline={handleAddTimelineItem}
            selectedVideo={selectedVideo}
          />
        </div>
        
        <div className="w-[70%] min-w-[500px] h-full flex flex-col overflow-hidden">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={60} minSize={30} maxSize={70}>
              <Preview 
                currentTime={currentTime} 
                isPlaying={isPlaying} 
                timelineItems={timelineItems}
                volume={volume}
                muted={muted}
                duration={duration}
                onToggleMute={handleToggleMute}
                onVolumeChange={handleVolumeChange}
                onPlayPause={handlePlayPause}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="flex items-center justify-between p-1 bg-[#000000]/70 border-b border-white/10 h-8">
                <div className="flex items-center">
                  <button 
                    className="p-1 text-[#EEEEEE]/80 hover:text-[#C9FF00] transition-colors mx-1"
                    onClick={handleUndo}
                    title="Undo"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    className="p-1 text-[#EEEEEE]/80 hover:text-[#C9FF00] transition-colors mr-1"
                    onClick={handleRedo}
                    title="Redo"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <div className="h-4 w-px bg-white/20 mx-1"></div>
                  <button 
                    className="p-1 text-[#EEEEEE]/80 hover:text-[#C9FF00] transition-colors mx-1"
                    onClick={handleTrimItem}
                    title="Trim selected item"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
                
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-[#EEEEEE]/80 mr-2">Timeline Zoom:</span>
                  <button 
                    className="p-1 text-[#EEEEEE]/80 hover:text-[#C9FF00] transition-colors"
                    onClick={handleTimelineZoomOut}
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button 
                    className="p-1 text-[#EEEEEE]/80 hover:text-[#C9FF00] transition-colors ml-1"
                    onClick={handleTimelineZoomIn}
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>
              <Timeline 
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                items={timelineItems}
                onRemoveItem={handleRemoveTimelineItem}
                onUpdateItem={handleUpdateTimelineItem}
                scale={timelineScale}
                onSelectItem={setSelectedItem}
                selectedItem={selectedItem}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
