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
import JSZip from 'jszip';

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

  // Export function that produces a single video file with all audio combined
  const handleExport = async () => {
    // If there are no items, show an error
    if (timelineItems.length === 0) {
      toast.error('Nothing to export', {
        description: 'Please add some media to the timeline first.',
      });
      return;
    }

    // Create a loading toast
    const loadingId = 'export-loading';
    toast.loading('Preparing export...', { id: loadingId });

    // Track progress for user feedback
    const updateStatus = (message: string) => {
      console.log(`Export status: ${message}`);
      toast.loading(message, { id: loadingId });
    };

    try {
      // Verify we have video content
      const hasVideoContent = timelineItems.some(item => item.type === 'video');
      if (!hasVideoContent) {
        throw new Error('No video content found in timeline');
      }
      
      // Get the main video container element
      const previewContainer = document.querySelector('.preview-container') || 
                               document.querySelector('[data-preview-container]');
      
      if (!previewContainer) {
        throw new Error('Video preview container not found');
      }
      
      // Find all video elements
      const videoElements = Array.from(document.querySelectorAll('video'));
      const audioElements = Array.from(document.querySelectorAll('audio'));
      
      if (videoElements.length === 0) {
        throw new Error('No video elements found in the player');
      }
      
      // Save current state
      const wasPlaying = isPlaying;
      const currentPosition = currentTime;
      
      // Reset to beginning
      updateStatus('Positioning timeline at start...');
      setCurrentTime(0);
      handleSeek(0);
      
      // Pause playback momentarily while we set up
      if (isPlaying) {
        setIsPlaying(false);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Setup MediaRecorder directly on the video element
      updateStatus('Setting up recording...');
      
      let recorder: MediaRecorder | null = null;
      let recordedChunks: Blob[] = [];
      const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      // The main video element
      const mainVideo = videoElements[0];
      
      try {
        // Set up audio context for mixing
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioDestination = audioCtx.createMediaStreamDestination();
        
        // Connect all audio sources
        let connectedAudioSources = 0;
        
        // Try to connect video audio
        if (mainVideo && !mainVideo.muted) {
          try {
            const videoSource = audioCtx.createMediaElementSource(mainVideo);
            videoSource.connect(audioDestination);
            videoSource.connect(audioCtx.destination); // Keep playing through speakers
            connectedAudioSources++;
          } catch (e) {
            console.warn('Could not connect video audio:', e);
          }
        }
        
        // Try to connect all audio elements
        audioElements.forEach(audio => {
          if (!audio.muted) {
            try {
              const source = audioCtx.createMediaElementSource(audio);
              source.connect(audioDestination);
              source.connect(audioCtx.destination); // Keep playing through speakers
              connectedAudioSources++;
            } catch (e) {
              console.warn('Could not connect audio element:', e);
            }
          }
        });
        
        updateStatus(`Connected ${connectedAudioSources} audio sources`);
        
        // Create canvas for video
        const canvas = document.createElement('canvas');
        const videoWidth = mainVideo.videoWidth || 1280;
        const videoHeight = mainVideo.videoHeight || 720;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d', { alpha: false });
        
        if (!ctx) {
          throw new Error('Could not create canvas context');
        }
        
        // Create video stream from canvas
        const canvasStream = canvas.captureStream(30); // 30fps
        
        // Add audio tracks to the stream
        audioDestination.stream.getAudioTracks().forEach(track => {
          canvasStream.addTrack(track);
        });
        
        // Choose best codec
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        
        // Create recorder with high quality settings
        recorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: 5000000
        });
        
        // Collect recorded data
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };
        
        // When recording stops
        recorder.onstop = () => {
          updateStatus('Finalizing video file...');
          
          if (recordedChunks.length === 0) {
            throw new Error('No data was recorded');
          }
          
          // Create final file and download it
          const blob = new Blob(recordedChunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${safeProjectName}_export.webm`;
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Restore state
            setCurrentTime(currentPosition);
            handleSeek(currentPosition);
            if (wasPlaying) {
              setIsPlaying(true);
            }
            
            toast.success('Export complete', {
              id: loadingId,
              description: 'Your video has been exported successfully.',
            });
          }, 100);
        };
        
        // Animation function to draw video frames to canvas
        let animationId: number | null = null;
        const drawFrame = () => {
          if (mainVideo.readyState >= 2) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(mainVideo, 0, 0, canvas.width, canvas.height);
          }
          animationId = requestAnimationFrame(drawFrame);
        };
        
        // Start recording process
        updateStatus('Starting recording...');
        recorder.start(1000); // Collect in 1 second chunks
        
        // Start drawing frames
        animationId = requestAnimationFrame(drawFrame);
        
        // Start playback
        updateStatus('Beginning playback...');
        setIsPlaying(true);
        mainVideo.currentTime = 0;
        
        try {
          await mainVideo.play();
          
          // Show progress indicator with stop button
          toast.loading('Recording in progress...', {
            id: 'recording-progress',
            description: 'Recording your video with all audio tracks combined.',
            action: {
              label: 'Stop',
              onClick: () => {
                if (recorder && recorder.state === 'recording') {
                  recorder.stop();
                  if (animationId) cancelAnimationFrame(animationId);
                  setIsPlaying(false);
                  toast.dismiss('recording-progress');
                }
              }
            },
            duration: 300000, // 5 minute timeout
          });
          
          // Stop recording when video ends
          mainVideo.addEventListener('ended', () => {
            if (recorder && recorder.state === 'recording') {
              updateStatus('Finalizing recording...');
              recorder.stop();
              if (animationId) cancelAnimationFrame(animationId);
              toast.dismiss('recording-progress');
            }
          }, { once: true });
          
          // Add safety timeout (based on timeline duration)
          const maxDuration = Math.max(
            ...timelineItems.map(item => item.start + item.duration),
            60 // minimum 1 minute
          );
          
          setTimeout(() => {
            if (recorder && recorder.state === 'recording') {
              updateStatus('Maximum duration reached');
              recorder.stop();
              if (animationId) cancelAnimationFrame(animationId);
              setIsPlaying(false);
              toast.dismiss('recording-progress');
            }
          }, (maxDuration + 5) * 1000); // Add 5 second buffer
          
        } catch (playbackError) {
          console.error('Playback error:', playbackError);
          if (recorder && recorder.state === 'recording') {
            recorder.stop();
          }
          if (animationId) cancelAnimationFrame(animationId);
          throw new Error('Could not start video playback');
        }
        
      } catch (setupError) {
        console.error('Recording setup error:', setupError);
        
        // Try a direct download approach for source media
        updateStatus('Trying direct download of source video...');
        
        const mainVideoItem = timelineItems.find(item => item.type === 'video' && item.src);
        if (mainVideoItem && mainVideoItem.src) {
          try {
            const response = await fetch(mainVideoItem.src);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${mainVideoItem.src}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeProjectName}_video.${mainVideoItem.src.endsWith('.webm') ? 'webm' : 'mp4'}`;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              toast.success('Video exported', {
                id: loadingId,
                description: 'Source video downloaded successfully.',
              });
              
              // Download any audio files separately
              const audioItems = timelineItems.filter(item => 
                item.type === 'audio' && item.src
              );
              
              if (audioItems.length > 0) {
                toast.info('Audio files', {
                  description: `${audioItems.length} audio files will be downloaded separately.`,
                  duration: 3000,
                });
                
                // Download audio files with a delay
                audioItems.forEach((item, index) => {
                  if (item.src) {
                    setTimeout(() => {
                      const audioLink = document.createElement('a');
                      audioLink.href = item.src!;
                      audioLink.download = `${safeProjectName}_audio_${index + 1}.${item.src!.endsWith('.wav') ? 'wav' : 'mp3'}`;
                      document.body.appendChild(audioLink);
                      audioLink.click();
                      setTimeout(() => document.body.removeChild(audioLink), 100);
                    }, index * 500); // Stagger downloads
                  }
                });
              }
            }, 100);
            
            return;
          } catch (downloadError) {
            console.error('Direct download error:', downloadError);
            throw new Error('Could not download source media');
          }
        } else {
          throw new Error('No source video found to download');
        }
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        id: loadingId,
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
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
