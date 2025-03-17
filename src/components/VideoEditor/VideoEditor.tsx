
import React, { useState, useEffect } from 'react';
import Header from './Header';
import MediaLibrary from './MediaLibrary';
import Timeline from './Timeline';
import Preview from './Preview';
import { toast } from 'sonner';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Film, Music, Mic, FolderOpen } from 'lucide-react';

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
  
  // Simulated playback
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
  
  // Listen for timeline item add events
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
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Media Library */}
        <div className="w-72 bg-editor-panel border-r border-white/10 flex flex-col">
          <Tabs defaultValue="visuals" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex justify-between bg-editor-bg/50 rounded-none border-b border-white/10">
              <TabsTrigger value="visuals" className="flex-1 py-2 px-3 data-[state=active]:bg-editor-hover">
                <Film size={16} className="mr-2" />
                <span className="text-xs">Visuals</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex-1 py-2 px-3 data-[state=active]:bg-editor-hover">
                <Music size={16} className="mr-2" />
                <span className="text-xs">Audio</span>
              </TabsTrigger>
              <TabsTrigger value="voiceover" className="flex-1 py-2 px-3 data-[state=active]:bg-editor-hover">
                <Mic size={16} className="mr-2" />
                <span className="text-xs">Voice</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="visuals" className="p-0 flex-1">
              <MediaLibrary onAddToTimeline={handleAddTimelineItem} mediaType="video" />
            </TabsContent>
            
            <TabsContent value="audio" className="p-0 flex-1">
              <MediaLibrary onAddToTimeline={handleAddTimelineItem} mediaType="audio" />
            </TabsContent>
            
            <TabsContent value="voiceover" className="p-0 flex-1">
              <div className="flex flex-col items-center justify-center h-full p-4 text-white/70">
                <Mic size={32} className="mb-2" />
                <p className="text-sm">Record voiceover coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={40}>
              <Preview 
                currentTime={currentTime} 
                isPlaying={isPlaying} 
                timelineItems={timelineItems}
                volume={volume}
                muted={muted}
                onToggleMute={handleToggleMute}
                onVolumeChange={handleVolumeChange}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={30} minSize={20}>
              <Timeline 
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                items={timelineItems}
                onRemoveItem={handleRemoveTimelineItem}
                onUpdateItem={handleUpdateTimelineItem}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
