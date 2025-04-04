import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import MediaLibrary from './MediaLibrary';
import Timeline from './Timeline';
import Preview from './Preview';
import { toast } from 'sonner';
import { Film, Music, TextIcon, Mic, FolderOpen, Sparkles, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MediaSidebar from './MediaSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
}

const VideoEditor: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(600); // Total timeline duration in seconds (10 minutes)
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("visuals");
  const [timelineScale, setTimelineScale] = useState(80); // scale for timeline (pixels per second)
  const [promptText, setPromptText] = useState("");
  const [history, setHistory] = useState<TimelineItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
  // Initialize or load user preferences
  useEffect(() => {
    if (user) {
      const loadUserPreferences = async () => {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          toast.error('Failed to load preferences');
          console.error('Error loading user preferences:', error);
          return;
        }
        
        if (data) {
          if (data.default_volume !== null) setVolume(data.default_volume);
          if (data.timeline_scale !== null) setTimelineScale(data.timeline_scale);
        } else {
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              default_volume: volume,
              timeline_scale: timelineScale,
              theme: 'dark'
            });
            
          if (insertError) {
            console.error('Error creating user preferences:', insertError);
          }
        }
      };
      
      loadUserPreferences();
    }
  }, [user]);
  
  // Save user preferences when they change
  useEffect(() => {
    if (user) {
      const saveUserPreferences = async () => {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            default_volume: volume,
            timeline_scale: timelineScale,
            theme: 'dark'
          });
          
        if (error) {
          console.error('Error saving user preferences:', error);
        }
      };
      
      const debounceTimer = setTimeout(() => {
        saveUserPreferences();
      }, 1000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [user, volume, timelineScale]);

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
  
  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('You need to be logged in to save projects');
      return;
    }
    
    try {
      let projectId = currentProjectId;
      
      if (!projectId) {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectName,
            duration: duration
          })
          .select()
          .single();
          
        if (error) throw error;
        projectId = data.id;
        setCurrentProjectId(projectId);
      } else {
        const { error } = await supabase
          .from('projects')
          .update({
            name: projectName,
            duration: duration,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
          
        if (error) throw error;
      }
      
      if (projectId) {
        const { error: deleteError } = await supabase
          .from('timeline_items')
          .delete()
          .eq('project_id', projectId);
          
        if (deleteError) throw deleteError;
        
        if (timelineItems.length > 0) {
          const itemsToInsert = timelineItems.map(item => ({
            project_id: projectId,
            track_id: item.trackId,
            item_type: item.type,
            name: item.name,
            start: item.start,
            duration: item.duration,
            color: item.color,
            src: item.src,
            thumbnail: item.thumbnail,
            volume: item.volume
          }));
          
          const { error: insertError } = await supabase
            .from('timeline_items')
            .insert(itemsToInsert);
            
          if (insertError) throw insertError;
        }
      }
      
      toast.success('Project saved', {
        description: `${projectName} has been saved.`,
      });
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project', {
        description: error.message,
      });
    }
  };

  const handleExport = () => {
    toast.success('Export started', {
      description: 'Your video is being prepared for download.',
    });
    
    setTimeout(() => {
      toast.success('Export complete', {
        description: 'Your video is ready to download.',
      });
      
      const a = document.createElement('a');
      a.href = '#';
      a.download = `${projectName.replace(/\s+/g, '_')}_export.mp4`;
      a.textContent = 'Download';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        toast.info('This is a simulated download in the demo');
      });
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 2000);
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

  const handleGenerate = () => {
    if (!promptText.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    toast.success('Generating content', {
      description: `Creating content based on: "${promptText}"`,
    });
    
    setTimeout(() => {
      toast.info('AI generated insight', {
        description: 'Based on your prompt, we recommend adding more transition effects between clips.',
      });
    }, 2000);
    
    setPromptText("");
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
        const item = timelineItems.find(item => item.id === e.detail.id);
        if (item) {
          handleUpdateTimelineItem({
            ...item,
            volume: e.detail.volume
          });
        }
      }
    };
    
    window.addEventListener('video-volume-change', handleVideoVolumeChange as EventListener);
    
    return () => {
      window.removeEventListener('video-volume-change', handleVideoVolumeChange as EventListener);
    };
  }, [timelineItems]);
  
  const loadProject = async (projectId: string) => {
    try {
      setIsLoadingProject(true);
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      setProjectName(projectData.name);
      setDuration(projectData.duration);
      setCurrentProjectId(projectId);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('timeline_items')
        .select('*')
        .eq('project_id', projectId);
        
      if (itemsError) throw itemsError;
      
      const items: TimelineItem[] = itemsData.map(item => ({
        id: item.id,
        trackId: item.track_id,
        type: item.item_type as 'video' | 'audio' | 'image',
        name: item.name,
        start: Number(item.start),
        duration: Number(item.duration),
        color: item.color || '#FFFFFF',
        src: item.src,
        thumbnail: item.thumbnail,
        volume: item.volume || 1
      }));
      
      setTimelineItems(items);
      
      setHistory([[...items]]);
      setHistoryIndex(0);
      
      toast.success('Project loaded', {
        description: `Opened project: ${projectData.name}`,
      });
    } catch (error: any) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project', {
        description: error.message,
      });
    } finally {
      setIsLoadingProject(false);
    }
  };
  
  const selectedVideo = selectedItem?.type === 'video' ? selectedItem : 
    timelineItems.find(item => item.type === 'video' && item.id === selectedItem?.id) || null;
  
  return (
    <div className="flex flex-col h-full bg-[#151514] text-[#F7F8F6] overflow-hidden">
      <Header 
        projectName={projectName}
        onRename={handleRename}
        onSave={handleSave}
        onExport={handleExport}
        currentProjectId={currentProjectId}
        onLoadProject={loadProject}
        isLoadingProject={isLoadingProject}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[30%] max-w-[300px] min-w-[200px] h-full flex flex-col border-r border-white/10">
          <MediaSidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onAddToTimeline={handleAddTimelineItem}
            promptText={promptText}
            setPromptText={setPromptText}
            onGenerate={handleGenerate}
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
              <div className="flex items-center justify-between p-1 bg-[#151514]/70 border-b border-white/10 h-8">
                <div className="flex items-center">
                  <button 
                    className="p-1 text-[#F7F8F6]/80 hover:text-[#D7F266] transition-colors mx-1"
                    onClick={handleUndo}
                    title="Undo"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    className="p-1 text-[#F7F8F6]/80 hover:text-[#D7F266] transition-colors mr-1"
                    onClick={handleRedo}
                    title="Redo"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <div className="h-4 w-px bg-white/20 mx-1"></div>
                  <button 
                    className="p-1 text-[#F7F8F6]/80 hover:text-[#D7F266] transition-colors mx-1"
                    onClick={handleTrimItem}
                    title="Trim selected item"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
                
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-[#F7F8F6]/80 mr-2">Timeline Zoom:</span>
                  <button 
                    className="p-1 text-[#F7F8F6]/80 hover:text-[#D7F266] transition-colors"
                    onClick={handleTimelineZoomOut}
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button 
                    className="p-1 text-[#F7F8F6]/80 hover:text-[#D7F266] transition-colors ml-1"
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
