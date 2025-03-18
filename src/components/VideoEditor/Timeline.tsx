
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Scissors, Plus, Trash2, ZoomIn, ZoomOut, Clock, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineItem } from './VideoEditor';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollAreaHorizontal } from '@/components/ui/scroll-area-horizontal';
import { toast } from 'sonner';

interface TimelineProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  items: TimelineItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItem?: (item: TimelineItem) => void;
  scale?: number; // Pixels per second
  onSelectItem?: (item: TimelineItem | null) => void;
  selectedItem?: TimelineItem | null;
}

const INITIAL_SCALE = 80; // pixels per second

const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  items,
  onRemoveItem,
  onUpdateItem,
  scale = INITIAL_SCALE,
  onSelectItem,
  selectedItem
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [tracks] = useState(['Video 1', 'Video 2', 'Audio 1', 'Audio 2', 'Voiceover']);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TimelineItem | null>(null);
  const [showVolumeControl, setShowVolumeControl] = useState<string | null>(null);
  
  // Calculate timeline width based on duration
  const timelineWidth = Math.max(duration * scale, 1000);
  
  // Generate time markers
  const timeMarkers = [];
  const markerInterval = scale <= 40 ? 5 : scale <= 80 ? 2 : 1; // Seconds
  const markerCount = Math.ceil(duration / markerInterval);
  
  for (let i = 0; i <= markerCount; i++) {
    const time = i * markerInterval;
    timeMarkers.push(time);
  }
  
  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const clickedTime = (offsetX / scale);
    
    onSeek(Math.max(0, Math.min(clickedTime, duration)));
  };
  
  // Handle item click for selection
  const handleItemClick = (e: React.MouseEvent, item: TimelineItem) => {
    e.stopPropagation();
    if (onSelectItem) {
      onSelectItem(item);
    }
  };
  
  // Handle item drag start
  const handleItemDragStart = (e: React.DragEvent, item: TimelineItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    setDraggedItem(item);
    if (onSelectItem) {
      onSelectItem(item);
    }
  };
  
  // Handle drag over for tracks
  const handleTrackDragOver = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-editor-hover/30');
  };
  
  // Handle drag leave for tracks
  const handleTrackDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-editor-hover/30');
  };
  
  // Handle drop on timeline track
  const handleTrackDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-editor-hover/30');
    
    try {
      // Get drop position
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const dropTime = offsetX / scale;
      
      const itemData = e.dataTransfer.getData('application/json');
      
      if (itemData) {
        const droppedItem = JSON.parse(itemData);
        
        // If the item is from the media library (has src property)
        if (droppedItem.src) {
          // Choose color based on track type and media type
          let color = 'bg-yellow-400/70'; // default for video
          let type = droppedItem.type;
          
          // Assign colors and confirm types based on track
          if (trackId === 'track1' || trackId === 'track2') {
            // Force type to video for video tracks
            type = 'video';
            color = 'bg-yellow-400/70';
          } else if (trackId === 'track3' || trackId === 'track4') {
            // Force type to audio for audio tracks
            type = 'audio';
            color = 'bg-blue-400/70';
          } else if (trackId === 'track5') {
            // Force type to audio for voiceover track
            type = 'audio';
            color = 'bg-green-400/70';
          }
          
          const durationInSeconds = parseInt(droppedItem.duration.split(':')[1]) || 5;
          
          const newItem: TimelineItem = {
            id: `timeline-${Date.now()}`,
            trackId,
            start: Math.max(0, dropTime),
            duration: durationInSeconds,
            type,
            name: droppedItem.name,
            color,
            src: droppedItem.src,
            thumbnail: droppedItem.thumbnail,
            volume: 1.0, // Default volume
          };
          
          // This will trigger the parent component to add the item
          const customEvent = new CustomEvent('timeline-item-add', { 
            detail: newItem 
          });
          document.dispatchEvent(customEvent);
          
          toast.success('Media added to timeline', {
            description: `${droppedItem.name} added to ${trackId.replace('track', 'Track ')}`
          });
        } 
        // If it's an existing timeline item being moved
        else if (draggedItem) {
          const updatedItem = { 
            ...draggedItem,
            trackId, 
            start: Math.max(0, dropTime) 
          };
          
          // Remove the old item and add the updated one
          onRemoveItem(draggedItem.id);
          const customEvent = new CustomEvent('timeline-item-add', { 
            detail: updatedItem 
          });
          document.dispatchEvent(customEvent);
        }
      }
    } catch (err) {
      console.error('Error dropping item:', err);
    }
    
    setDraggedItem(null);
  };
  
  // Handle item delete
  const handleItemDelete = (id: string) => {
    onRemoveItem(id);
    toast.success('Item removed from timeline');
    if (onSelectItem && selectedItem?.id === id) {
      onSelectItem(null);
    }
  };
  
  // Handle volume change for individual audio clip
  const handleVolumeChange = (id: string, newVolume: number) => {
    const item = items.find(i => i.id === id);
    if (item && onUpdateItem) {
      onUpdateItem({
        ...item,
        volume: newVolume
      });
      
      toast.success('Audio volume updated', {
        description: `Volume set to ${Math.round(newVolume * 100)}%`
      });
    }
  };
  
  // Toggle volume control for an item
  const toggleVolumeControl = (id: string) => {
    setShowVolumeControl(prev => prev === id ? null : id);
  };
  
  // Update playhead position when currentTime changes
  useEffect(() => {
    if (playheadRef.current) {
      playheadRef.current.style.transform = `translateX(${currentTime * scale}px)`;
    }
  }, [currentTime, scale]);
  
  // Listen for timeline-item-add events
  useEffect(() => {
    const handleTimelineItemAdd = (e: CustomEvent<TimelineItem>) => {
      const customEvent = new CustomEvent('add-timeline-item', { 
        detail: e.detail
      });
      window.dispatchEvent(customEvent);
    };
    
    document.addEventListener('timeline-item-add', handleTimelineItemAdd as EventListener);
    
    return () => {
      document.removeEventListener('timeline-item-add', handleTimelineItemAdd as EventListener);
    };
  }, []);
  
  // Get track identifier
  const getTrackId = (index: number) => `track${index + 1}`;
  
  return (
    <div className="flex flex-col h-full overflow-hidden bg-editor-timeline">
      {/* Timeline controls */}
      <div className="flex items-center h-8 px-4 border-b border-white/10 bg-editor-panel/70">
        <div className="flex items-center space-x-2">
          <button 
            className="button-icon w-7 h-7"
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          
          <div className="text-white/80 text-xs font-medium">
            {`${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${Math.floor(currentTime % 60).toString().padStart(2, '0')} / ${Math.floor(duration / 60).toString().padStart(2, '0')}:${Math.floor(duration % 60).toString().padStart(2, '0')}`}
          </div>
        </div>
        
        <div className="flex-1" />
      </div>
      
      {/* Timeline ruler */}
      <div className="flex h-6 border-b border-white/10 bg-editor-panel/80 relative overflow-hidden">
        <div className="w-16 bg-editor-panel border-r border-white/10 shrink-0 flex items-center justify-center">
          <Clock size={12} className="mr-1 text-white/50" />
          <span className="text-xs text-white/70">Time</span>
        </div>
        <div 
          className="flex select-none overflow-hidden"
          style={{ width: timelineWidth }}
        >
          <ScrollAreaHorizontal orientation="horizontal">
            <div style={{ width: timelineWidth, height: '100%' }} className="flex">
              {timeMarkers.map(time => (
                <div 
                  key={time} 
                  className="time-marker text-xs" 
                  style={{ width: `${markerInterval * scale}px` }}
                >
                  {`${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`}
                </div>
              ))}
            </div>
          </ScrollAreaHorizontal>
        </div>
      </div>
      
      {/* Timeline tracks */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Track labels */}
        <div className="w-16 shrink-0 bg-editor-panel border-r border-white/10">
          {tracks.map((track, index) => (
            <div 
              key={index} 
              className={cn(
                "timeline-track flex items-center justify-start px-2 text-white/70 text-xs h-12",
                index < 2 ? "bg-yellow-950/30" : // Video tracks
                index < 4 ? "bg-blue-950/30" : // Audio tracks
                "bg-green-950/30" // Voiceover track
              )}
            >
              {track}
            </div>
          ))}
        </div>
        
        {/* Timeline */}
        <ScrollAreaHorizontal orientation="horizontal" className="flex-1">
          <div 
            ref={timelineRef}
            className="relative overflow-y-hidden"
            style={{ width: timelineWidth, minHeight: '100%' }}
            onClick={handleTimelineClick}
          >
            {/* Playhead */}
            <div ref={playheadRef} className="playhead">
              <div className="absolute -top-1 -left-[5px] w-[10px] h-[10px] bg-editor-accent rounded-full" />
            </div>
            
            {/* Track backgrounds */}
            {tracks.map((_, index) => (
              <div 
                key={`track-${index}`}
                className={cn(
                  "timeline-track h-12",
                  index < 2 ? "bg-yellow-950/10" : // Video tracks
                  index < 4 ? "bg-blue-950/10" : // Audio tracks
                  "bg-green-950/10" // Voiceover track
                )}
                onDragOver={(e) => handleTrackDragOver(e, getTrackId(index))}
                onDragLeave={handleTrackDragLeave}
                onDrop={(e) => handleTrackDrop(e, getTrackId(index))}
              />
            ))}
            
            {/* 1-second interval vertical grid lines */}
            {timeMarkers.map(time => (
              <div 
                key={`grid-${time}`}
                className="absolute top-0 bottom-0 w-px bg-white/5"
                style={{ left: `${time * scale}px` }}
              />
            ))}
            
            {/* Timeline items */}
            {items.map(item => {
              const trackIndex = parseInt(item.trackId.replace('track', '')) - 1;
              const isSelected = selectedItem?.id === item.id;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute timeline-item h-10 flex flex-col justify-center px-2 text-white z-10",
                    item.color,
                    draggedItem?.id === item.id && "opacity-50",
                    isSelected && "ring-2 ring-[#D7F266] ring-offset-0"
                  )}
                  style={{
                    top: `${trackIndex * 48 + 1}px`,
                    left: `${item.start * scale}px`,
                    width: `${item.duration * scale}px`,
                  }}
                  draggable
                  onClick={(e) => handleItemClick(e, item)}
                  onDragStart={(e) => handleItemDragStart(e, item)}
                >
                  <div className="flex justify-between items-center w-full">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-1">
                      {item.type === 'audio' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVolumeControl(item.id);
                          }}
                          className="text-white/70 hover:text-white"
                        >
                          <Volume2 size={12} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemDelete(item.id);
                        }}
                        className="text-white/70 hover:text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Individual volume control */}
                  {item.type === 'audio' && showVolumeControl === item.id && (
                    <div className="mt-1 px-1">
                      <Slider
                        value={[item.volume || 1]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={(value) => handleVolumeChange(item.id, value[0])}
                        className="h-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="text-[10px] text-white/80 text-center mt-0.5">
                        {Math.round((item.volume || 1) * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollAreaHorizontal>
      </div>
    </div>
  );
};

export default Timeline;
