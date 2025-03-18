import React, { useState, useEffect } from 'react';
import Header from './Header';
import MediaLibrary from './MediaLibrary';
import Timeline from './Timeline';
import Preview from './Preview';
import { toast } from 'sonner';
import { Image, Film, Music, Mic, FolderOpen, TextIcon, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // Total timeline duration in seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("visuals");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timelineScale, setTimelineScale] = useState(80); // scale for timeline (pixels per second)
  
  useEffect(() => {
    let playbackInterval: number;
    
    if (isPlaying) {
      playbackInterval = window.setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime >= duration) {
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
  }, [isPlaying, duration]);
  
  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleSave = () => {
    toast.success('Project saved', {
      description: `${projectName} has been saved.`,
    });
  };

  const handleExport = () => {
    toast.success('Export started', {
      description: 'Your video is being prepared for download.',
    });
    // In a real implementation, this would trigger the export process
    setTimeout(() => {
      toast.success('Export complete', {
        description: 'Your video is ready to download.',
      });
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
  
  useEffect(() => {
    const handleAddItem = (e: CustomEvent<TimelineItem>) => {
      handleAddTimelineItem(e.detail);
    };
    
    window.addEventListener('add-timeline-item', handleAddItem as EventListener);
    
    return () => {
      window.removeEventListener('add-timeline-item', handleAddItem as EventListener);
    };
  }, []);
  
  return (
    <div className="flex flex-col h-full bg-editor-bg text-white">
      <Header 
        projectName={projectName}
        onRename={handleRename}
        onSave={handleSave}
        onExport={handleExport}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Collapsible 
          open={!sidebarCollapsed} 
          onOpenChange={(open) => setSidebarCollapsed(!open)}
          className="h-full"
        >
          <div className={`${sidebarCollapsed ? 'w-8' : 'w-56'} h-full transition-all duration-300 flex flex-col`}>
            {sidebarCollapsed ? (
              <div className="flex flex-col h-full bg-editor-panel border-r border-white/10">
                <CollapsibleTrigger asChild>
                  <button className="p-2 hover:bg-editor-hover rounded-r-none flex justify-center">
                    <ChevronRight size={16} />
                  </button>
                </CollapsibleTrigger>
                
                <div className="flex-1 flex flex-col items-center py-4 space-y-6">
                  <button className="p-2 hover:bg-editor-hover rounded-full" title="Media">
                    <Film size={16} />
                  </button>
                  <button className="p-2 hover:bg-editor-hover rounded-full" title="Audio">
                    <Music size={16} />
                  </button>
                  <button className="p-2 hover:bg-editor-hover rounded-full" title="Text">
                    <TextIcon size={16} />
                  </button>
                  <button className="p-2 hover:bg-editor-hover rounded-full" title="Voice">
                    <Mic size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <CollapsibleContent className="h-full">
                <div className="flex items-center justify-between p-2 bg-editor-panel/70 border-b border-white/10">
                  <span className="text-xs font-semibold">Media Library</span>
                  <CollapsibleTrigger asChild>
                    <button className="p-1 hover:bg-editor-hover rounded">
                      <ChevronLeft size={14} />
                    </button>
                  </CollapsibleTrigger>
                </div>
                <div className="min-w-56 bg-editor-panel border-r border-white/10 flex-1 flex flex-col">
                  <Tabs defaultValue="visuals" value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                    <TabsList className="flex justify-between w-full bg-editor-bg/50 rounded-none border-b border-white/10 px-1 py-0 h-auto">
                      <TabsTrigger value="visuals" className="flex gap-1 items-center py-2 px-2 rounded-full data-[state=active]:bg-editor-accent">
                        <Film size={16} />
                        <span className="text-xs">Visuals</span>
                      </TabsTrigger>
                      <TabsTrigger value="audio" className="flex gap-1 items-center py-2 px-2 rounded-full data-[state=active]:bg-editor-accent">
                        <Music size={16} />
                        <span className="text-xs">Audio</span>
                      </TabsTrigger>
                      <TabsTrigger value="text" className="flex gap-1 items-center py-2 px-2 rounded-full data-[state=active]:bg-editor-accent">
                        <TextIcon size={16} />
                        <span className="text-xs">Text</span>
                      </TabsTrigger>
                      <TabsTrigger value="voiceover" className="flex gap-1 items-center py-2 px-2 rounded-full data-[state=active]:bg-editor-accent">
                        <Mic size={16} />
                        <span className="text-xs">Voice</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="visuals" className="p-0 flex-1 overflow-hidden">
                      <MediaLibrary onAddToTimeline={handleAddTimelineItem} mediaType="video" />
                    </TabsContent>
                    
                    <TabsContent value="audio" className="p-0 flex-1 overflow-hidden">
                      <MediaLibrary onAddToTimeline={handleAddTimelineItem} mediaType="audio" />
                    </TabsContent>
                    
                    <TabsContent value="text" className="p-0 flex-1 overflow-hidden">
                      <div className="flex flex-col items-center justify-center h-full p-4 text-white/70">
                        <TextIcon size={32} className="mb-2" />
                        <p className="text-sm">Text elements coming soon</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="voiceover" className="p-0 flex-1 overflow-hidden">
                      <div className="flex flex-col items-center justify-center h-full p-4 text-white/70">
                        <Mic size={32} className="mb-2" />
                        <p className="text-sm">Record voiceover coming soon</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CollapsibleContent>
            )}
          </div>
        </Collapsible>
      
        <div className="flex-1 flex flex-col overflow-hidden">
          <ResizablePanelGroup direction="vertical" className="h-full">
            <ResizablePanel defaultSize={50} minSize={20}>
              <Preview 
                currentTime={currentTime} 
                isPlaying={isPlaying} 
                timelineItems={timelineItems}
                volume={volume}
                muted={muted}
                duration={duration}
                onToggleMute={handleToggleMute}
                onVolumeChange={handleVolumeChange}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={25}>
              <div className="flex items-center justify-end p-1 bg-editor-panel/50 border-b border-white/10">
                <span className="text-xs font-semibold text-white/80 mr-2">Timeline Zoom:</span>
                <button 
                  className="p-1 text-white/80 hover:text-white transition-colors"
                  onClick={handleTimelineZoomOut}
                >
                  <ZoomOut size={14} />
                </button>
                <button 
                  className="p-1 text-white/80 hover:text-white transition-colors ml-1"
                  onClick={handleTimelineZoomIn}
                >
                  <ZoomIn size={14} />
                </button>
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
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
