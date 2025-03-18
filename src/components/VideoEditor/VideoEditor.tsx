import React, { useState, useEffect } from 'react';
import Header from './Header';
import MediaLibrary from './MediaLibrary';
import Timeline from './Timeline';
import Preview from './Preview';
import { toast } from 'sonner';
import { Image, Film, Music, Mic, FolderOpen, TextIcon, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [projectName, setProjectName] = useState("Another example project");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("visuals");
  const [showAIPrompt, setShowAIPrompt] = useState(true);
  
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
  
  const handleGenerateAIVideo = () => {
    toast.success('AI Generation started', {
      description: 'Your AI video is being generated...',
    });
    
    setTimeout(() => {
      const newItem: TimelineItem = {
        id: `timeline-${Date.now()}`,
        trackId: 'track1',
        start: 0,
        duration: 15,
        type: 'video',
        name: 'AI Generated Video',
        color: 'bg-pink-400/70',
        src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop',
      };
      
      handleAddTimelineItem(newItem);
      setShowAIPrompt(false);
      
      toast.success('AI Video generated', {
        description: 'Your AI video has been added to the timeline.',
      });
    }, 3000);
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
      <div className="flex items-center h-12 px-3 bg-editor-panel border-b border-white/10 gap-2">
        <button className="flex items-center gap-1.5 text-white/80 hover:text-white">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 className="text-lg font-medium ml-2">
          {projectName}
        </h1>
        <div className="flex items-center ml-auto gap-2">
          <div className="px-2 py-0.5 bg-pink-200 text-pink-800 rounded text-xs font-medium">
            Beta
          </div>
          <button className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-1.5">
            <span>AI Edit</span>
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium"
          >
            Download
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 min-w-56 bg-editor-panel border-r border-white/10 flex flex-col">
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
              {showAIPrompt ? (
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center mb-3">
                    <button className="px-3 py-1 bg-editor-bg rounded-full text-white text-xs flex items-center">
                      <Image size={12} className="mr-1" />
                      Image
                    </button>
                  </div>
                  
                  <div className="flex-1 border border-white/10 rounded-md flex flex-col">
                    <div className="grid grid-cols-3 gap-2 p-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div 
                          key={i} 
                          className="aspect-square bg-editor-hover/50 rounded overflow-hidden"
                        >
                          <img 
                            src={`https://images.unsplash.com/photo-157${i}605117036-5fe5e7bab0b7?w=200&auto=format&fit=crop`} 
                            alt="AI Suggestion" 
                            className="w-full h-full object-cover"
                          />
                          {i <= 3 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="px-1 py-0.5 bg-black/50 text-white/90 text-[10px] rounded">
                                AI Image
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-auto p-3 border-t border-white/10">
                      <div>
                        <textarea 
                          placeholder="Describe your image idea... (e.g., 'Sunlight filtering through trees and a gentle stream flowing')"
                          className="w-full h-20 bg-editor-bg border border-white/20 rounded p-2 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-editor-accent"
                        />
                      </div>
                      
                      <button 
                        onClick={handleGenerateAIVideo}
                        className="w-full mt-3 py-2 bg-pink-500 hover:bg-pink-600 rounded-md text-white font-medium"
                      >
                        Generate
                      </button>
                      
                      <div className="mt-2 flex items-center justify-between text-xs text-white/60">
                        <span>Cost: 4 credits</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <MediaLibrary onAddToTimeline={handleAddTimelineItem} mediaType="video" />
              )}
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
      
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-[55%] min-h-[300px] overflow-hidden">
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
          </div>
          
          <div className="h-[45%] border-t border-white/10 overflow-hidden">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
