
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Scissors, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  trackId: string;
  start: number;
  duration: number;
  type: 'video' | 'audio' | 'image';
  name: string;
  color: string;
}

interface TimelineProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

const MOCK_TIMELINE_ITEMS: TimelineItem[] = [
  { id: 't1', trackId: 'track1', start: 0, duration: 5, type: 'video', name: 'Cars accelerating', color: 'bg-yellow-400/70' },
  { id: 't2', trackId: 'track1', start: 5, duration: 4, type: 'video', name: 'Cars drifting', color: 'bg-yellow-400/70' },
  { id: 't3', trackId: 'track2', start: 1, duration: 7, type: 'audio', name: 'Engine sound', color: 'bg-blue-400/70' },
  { id: 't4', trackId: 'track3', start: 2, duration: 6, type: 'audio', name: 'Crowd cheering', color: 'bg-orange-400/70' },
];

const SCALE = 80; // pixels per second

const Timeline: React.FC<TimelineProps> = ({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [tracks] = useState(['Video', 'Audio 1', 'Audio 2']);
  const [items, setItems] = useState<TimelineItem[]>(MOCK_TIMELINE_ITEMS);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TimelineItem | null>(null);
  
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
        
        // If the item is from the media library
        if (droppedItem.thumbnail) {
          const newItem: TimelineItem = {
            id: `timeline-${Date.now()}`,
            trackId,
            start: Math.max(0, dropTime),
            duration: parseFloat(droppedItem.duration.split(':')[1]) || 5,
            type: droppedItem.type,
            name: droppedItem.name,
            color: droppedItem.type === 'video' ? 'bg-yellow-400/70' : 'bg-blue-400/70'
          };
          
          setItems(prev => [...prev, newItem]);
        } 
        // If it's an existing timeline item being moved
        else if (draggedItem) {
          setItems(prev => prev.map(item => 
            item.id === draggedItem.id 
              ? { ...item, trackId, start: Math.max(0, dropTime) }
              : item
          ));
        }
      }
    } catch (err) {
      console.error('Error dropping item:', err);
    }
    
    setDraggedItem(null);
  };
  
  // Update playhead position when currentTime changes
  useEffect(() => {
    if (playheadRef.current) {
      playheadRef.current.style.transform = `translateX(${currentTime * SCALE}px)`;
    }
  }, [currentTime]);
  
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
                onDragOver={(e) => handleTrackDragOver(e, `track${index + 1}`)}
                onDragLeave={handleTrackDragLeave}
                onDrop={(e) => handleTrackDrop(e, `track${index + 1}`)}
              />
            ))}
            
            {/* Timeline items */}
            {items.map(item => {
              const trackIndex = parseInt(item.trackId.replace('track', '')) - 1;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute timeline-item h-12 flex items-center px-2 text-white z-10",
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
                  <p className="text-xs font-medium truncate">{item.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Add track button */}
      <div className="h-12 bg-editor-panel border-t border-white/10 flex items-center px-4">
        <button className="button-icon ml-16 flex items-center gap-1 px-3">
          <Plus size={14} />
          <span className="text-xs">Add Track</span>
        </button>
      </div>
    </div>
  );
};

export default Timeline;
