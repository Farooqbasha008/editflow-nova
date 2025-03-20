
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import Timeline from './Timeline';
import Preview from './Preview';
import MediaSidebar from './MediaSidebar';
import { toast } from 'sonner';

export interface TimelineItem {
  id: string;
  trackId: string;
  start: number;
  duration: number;
  type: 'video' | 'audio' | 'image' | 'text';
  name: string;
  color?: string;
  src: string;
  thumbnail?: string;
  volume?: number;
}

const VideoEditor: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60); // Default project duration: 60 seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [activeTab, setActiveTab] = useState('visuals');
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [promptText, setPromptText] = useState('');
  const [history, setHistory] = useState<TimelineItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Handle timeline item updates (position, duration, etc.)
  const handleUpdateTimelineItem = (updatedItem: TimelineItem) => {
    setTimelineItems(items => 
      items.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    
    // Save to history for undo/redo
    addToHistory();
  };

  // Handle adding a new item to the timeline
  const handleAddTimelineItem = (newItem: TimelineItem) => {
    setTimelineItems(prev => [...prev, newItem]);
    
    // Save to history for undo/redo
    addToHistory();
    
    toast.success('Item added to timeline', {
      description: `Added ${newItem.name} to your project`
    });
  };

  // Handle removing an item from the timeline
  const handleRemoveTimelineItem = (id: string) => {
    setTimelineItems(items => items.filter(item => item.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    
    // Save to history for undo/redo
    addToHistory();
  };

  // Handle project play/pause
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle seeking to a specific time in the project
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // Toggle fullscreen mode for preview
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // Handle volume changes
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    setMuted(!muted);
  };

  // Add current state to history for undo/redo
  const addToHistory = () => {
    // If we're not at the end of history, trim it
    if (historyIndex >= 0 && historyIndex < history.length - 1) {
      setHistory(prev => prev.slice(0, historyIndex + 1));
    }
    
    setHistory(prev => [...prev, [...timelineItems]]);
    setHistoryIndex(prev => prev + 1);
  };

  // Handle undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTimelineItems(history[newIndex]);
      toast.info('Undo successful');
    } else {
      toast.info('Nothing to undo');
    }
  };

  // Handle redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTimelineItems(history[newIndex]);
      toast.info('Redo successful');
    } else {
      toast.info('Nothing to redo');
    }
  };

  // Generate project using AI
  const handleGenerate = () => {
    if (!promptText.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }
    
    toast.info('Generating content based on your prompt...', {
      description: 'This feature is not fully implemented yet.'
    });
    
    // In a real implementation, this would call an API
    // For now, we'll just add a toast to acknowledge the action
    
    setTimeout(() => {
      toast.success('Project generated!', {
        description: 'Your content has been generated and added to the timeline'
      });
      
      // Clear the prompt
      setPromptText('');
    }, 2000);
  };

  // Event listener for video volume change
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

  // Add timeline item event listener
  useEffect(() => {
    const handleAddTimelineItemEvent = (e: CustomEvent<TimelineItem>) => {
      handleAddTimelineItem(e.detail);
    };
    
    window.addEventListener('add-timeline-item', handleAddTimelineItemEvent as EventListener);
    
    return () => {
      window.removeEventListener('add-timeline-item', handleAddTimelineItemEvent as EventListener);
    };
  }, []);

  // Get timeline items event listener for drag and drop operations
  useEffect(() => {
    const handleGetTimelineItems = (e: CustomEvent<{callback: (items: TimelineItem[]) => void}>) => {
      if (e.detail && e.detail.callback) {
        e.detail.callback(timelineItems);
      }
    };
    
    document.addEventListener('get-timeline-items', handleGetTimelineItems as EventListener);
    
    return () => {
      document.removeEventListener('get-timeline-items', handleGetTimelineItems as EventListener);
    };
  }, [timelineItems]);

  // Calculate active videos and audios based on current time
  const activeVideos = timelineItems.filter(
    item => item.type === 'video' && currentTime >= item.start && currentTime < item.start + item.duration
  );
  
  const activeAudios = timelineItems.filter(
    item => item.type === 'audio' && currentTime >= item.start && currentTime < item.start + item.duration
  );
  
  // Determine which video to show in the preview (last one in activeVideos array)
  const activeVideo = activeVideos.length > 0 ? activeVideos[activeVideos.length - 1] : null;

  return (
    <div className="flex flex-col h-screen bg-editor-bg overflow-hidden" ref={containerRef}>
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 shrink-0 bg-editor-panel border-r border-white/10 overflow-hidden flex flex-col">
          <MediaSidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onAddToTimeline={handleAddTimelineItem}
            promptText={promptText}
            setPromptText={setPromptText}
            onGenerate={handleGenerate}
            selectedVideo={selectedItem?.type === 'video' ? selectedItem : null}
          />
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Preview */}
          <div className={cn(
            "flex-1 overflow-hidden",
            fullscreen ? "absolute inset-0 z-50 bg-black" : ""
          )}>
            <Preview 
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              activeVideo={activeVideo}
              activeAudios={activeAudios}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              muted={muted}
              onMuteToggle={handleMuteToggle}
              fullscreen={fullscreen}
              onToggleFullscreen={toggleFullscreen}
              containerRef={containerRef}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>
          
          {/* Timeline */}
          <div className="h-56 shrink-0 border-t border-white/10">
            <Timeline 
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              items={timelineItems}
              onRemoveItem={handleRemoveTimelineItem}
              onUpdateItem={handleUpdateTimelineItem}
              onSelectItem={setSelectedItem}
              selectedItem={selectedItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
