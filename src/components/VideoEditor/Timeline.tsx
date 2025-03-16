
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Scissors, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineItem } from './VideoEditor';
import { Slider } from '@/components/ui/slider';

interface TimelineProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  items: TimelineItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItem?: (item: TimelineItem) => void;
}

const SCALE = 80; // pixels per second

const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  items,
  onRemoveItem,
  onUpdateItem
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [tracks] = useState(['Video 1', 'Video 2', 'Audio 1', 'Audio 2', 'Voiceover']);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TimelineItem | null>(null);
  const [showVolumeControl, setShowVolumeControl] = useState<string | null>(null);
  
  // Calculate timeline width based on duration
  const timelineWidth = Math.max(duration * SCALE, 1000);
  
  // Generate time markers
  const timeMarkers = [];
  const markerInterval = 1; // Seconds
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
    const clickedTime = (offsetX / SCALE);
    
    onSeek(Math.max(0, Math.min(clickedTime, duration)));
  };
  
  // Handle item drag start
  const handleItemDragStart = (e: React.DragEvent, item: TimelineItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    setDraggedItem(item);
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
      const dropTime = offsetX / SCALE;
      
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
  };
  
  // Handle volume change for individual audio clip
  const handleVolumeChange = (id: string, newVolume: number) => {
    const item = items.find(i => i.id === id);
    if (item && onUpdateItem) {
      onUpdateItem({
        ...item,
        volume: newVolume
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
      playheadRef.current.style.transform = `translateX(${currentTime * SCALE}px)`;
    }
  }, [currentTime]);
  
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
    <div className="flex flex-col h-full">
      {/* Timeline controls */}
      <div className="flex items-center h-12 px-4 border-b border-white/10 bg-editor-panel/70">
        <div className="flex items-center space-x-2">
          <button 
            className="button-icon"
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="text-white/80 text-sm font-medium">
            {`${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${Math.floor(currentTime % 60).toString().padStart(2, '0')} / ${Math.floor(duration / 60).toString().padStart(2, '0')}:${Math.floor(duration % 60).toString().padStart(2, '0')}`}
          </div>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center space-x-2">
          <button className="button-icon">
            <Scissors size={16} />
          </button>
          <button className="button-icon">
            <Trash2 size={16} />
          </button>
          <button className="button-icon">
            <Volume2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Timeline ruler */}
      <div className="flex h-8 border-b border-white/10 bg-editor-panel/80 relative overflow-hidden">
        <div className="w-16 bg-editor-panel border-r border-white/10 shrink-0" />
        <div 
          className="flex select-none"
          style={{ width: timelineWidth }}
        >
          {timeMarkers.map(time => (
            <div 
              key={time} 
              className="time-marker" 
              style={{ width: `${markerInterval * SCALE}px` }}
            >
              {`${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`}
            </div>
          ))}
        </div>
      </div>
      
      {/* Timeline tracks */}
      <div className="flex-1 flex flex-row overflow-auto">
        {/* Track labels */}
        <div className="w-16 shrink-0 bg-editor-panel border-r border-white/10">
          {tracks.map((track, index) => (
            <div 
              key={index} 
              className="timeline-track flex items-center justify-center text-white/60 text-xs"
            >
              {track}
            </div>
          ))}
        </div>
        
        {/* Timeline */}
        <div 
          ref={timelineRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden"
          onClick={handleTimelineClick}
        >
          <div style={{ width: timelineWidth }} className="relative">
            {/* Playhead */}
            <div ref={playheadRef} className="playhead">
              <div className="absolute -top-1 -left-[5px] w-[10px] h-[10px] bg-editor-accent rounded-full" />
            </div>
            
            {/* Track backgrounds */}
            {tracks.map((_, index) => (
              <div 
                key={`track-${index}`}
                className="timeline-track"
                onDragOver={(e) => handleTrackDragOver(e, getTrackId(index))}
                onDragLeave={handleTrackDragLeave}
                onDrop={(e) => handleTrackDrop(e, getTrackId(index))}
              />
            ))}
            
            {/* Timeline items */}
            {items.map(item => {
              const trackIndex = parseInt(item.trackId.replace('track', '')) - 1;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute timeline-item h-12 flex flex-col justify-center px-2 text-white z-10",
                    item.color,
                    draggedItem?.id === item.id && "opacity-50"
                  )}
                  style={{
                    top: `${trackIndex * 64}px`,
                    left: `${item.start * SCALE}px`,
                    width: `${item.duration * SCALE}px`,
                  }}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, item)}
                >
                  <div className="flex justify-between items-center w-full">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-1">
                      {item.type === 'audio' && (
                        <button 
                          onClick={() => toggleVolumeControl(item.id)}
                          className="text-white/70 hover:text-white mr-1"
                        >
                          <Volume2 size={12} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleItemDelete(item.id)}
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
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Add track button (disabled since we have a fixed track structure) */}
      <div className="h-12 bg-editor-panel border-t border-white/10 flex items-center px-4">
        <div className="ml-16 text-xs text-white/50">5 tracks available</div>
      </div>
    </div>
  );
};

export default Timeline;
