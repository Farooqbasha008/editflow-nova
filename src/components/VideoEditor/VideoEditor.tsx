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

  const handleSave = () => {
    const projectData = {
      name: projectName,
      timeline: timelineItems,
      duration: duration
    };
    
    localStorage.setItem('editflow_project', JSON.stringify(projectData));
    
    toast.success('Project saved', {
      description: `${projectName} has been saved.`,
    });
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
    <div className="flex flex-col h-full bg-[#151514] text-[#F7F8F6] overflow-hidden">
      <Header 
        projectName={projectName}
        onRename={handleRename}
        onSave={handleSave}
        onExport={handleExport}
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
