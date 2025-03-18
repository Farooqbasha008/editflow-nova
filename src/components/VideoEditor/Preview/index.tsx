
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { TimelineItem } from '../VideoEditor';
import PreviewControls from './PreviewControls';
import VideoPlayer from './VideoPlayer';
import ActiveMediaDisplay from './ActiveMediaDisplay';
import AudioManager from './AudioManager';
import { ArrowLeft, ArrowRight, Trash, Scissors, Undo, Redo, VolumeX, Volume2 } from 'lucide-react';

interface PreviewProps {
  currentTime: number;
  isPlaying: boolean;
  timelineItems: TimelineItem[];
  volume: number;
  muted: boolean;
  duration: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
}

const Preview: React.FC<PreviewProps> = ({ 
  currentTime, 
  isPlaying, 
  timelineItems,
  volume,
  muted,
  duration,
  onToggleMute,
  onVolumeChange
}) => {
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeVideos = timelineItems.filter(item => 
    item.type === 'video' && 
    currentTime >= item.start && 
    currentTime < (item.start + item.duration)
  );
  
  const activeAudios = timelineItems.filter(item => 
    item.type === 'audio' && 
    currentTime >= item.start && 
    currentTime < (item.start + item.duration)
  );
  
  const activeVideo = activeVideos.length > 0 ? activeVideos[activeVideos.length - 1] : null;
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        toast.error('Error attempting to enable fullscreen', {
          description: err.message
        });
      });
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };
  
  return (
    <div ref={containerRef} className="flex-1 bg-editor-bg flex flex-col overflow-hidden animate-fade-in">
      {/* Top controls - similar to the AI Edit bar in the image */}
      <div className="flex items-center justify-between px-4 py-2 bg-editor-panel/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button className="px-3 py-1 rounded-full bg-pink-500/90 text-white text-xs font-medium">
            AI Edit
          </button>
          <div className="text-white/70 text-sm">
            {isPlaying ? "Playing" : "Paused"} | {`${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')} / ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-full hover:bg-editor-hover text-white/80"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
          />
          
          <button className="ml-2 px-4 py-1.5 rounded-full bg-pink-500 text-white text-sm font-medium">
            Download
          </button>
        </div>
      </div>
      
      <VideoPlayer 
        activeVideo={activeVideo}
        currentTime={currentTime}
        isPlaying={isPlaying}
        muted={muted}
        volume={volume}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleFullscreen={toggleFullscreen}
        fullscreen={fullscreen}
        containerRef={containerRef}
        duration={duration} // Explicitly passing the duration prop to VideoPlayer
      />
      
      {/* Bottom timeline controls - modified to match the image */}
      <div className="flex items-center bg-editor-panel/70 border-t border-white/10 p-2 gap-3">
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-full hover:bg-editor-hover text-white/80">
            <Undo size={16} />
          </button>
          <button className="p-1.5 rounded-full hover:bg-editor-hover text-white/80">
            <Redo size={16} />
          </button>
          <button className="p-1.5 rounded-full hover:bg-editor-hover text-white/80">
            <Trash size={16} />
          </button>
          <button className="p-1.5 rounded-full hover:bg-editor-hover text-white/80">
            <Scissors size={16} />
          </button>
        </div>
        
        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-editor-accent transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
          
          {/* Time markers */}
          <div className="absolute top-3 left-0 right-0 flex justify-between text-[10px] text-white/60">
            <span>0:00</span>
            <span>0:05</span>
            <span>0:10</span>
            <span>0:15</span>
            <span>0:20</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 rounded bg-editor-hover/50 text-white/80 text-xs">
            Landscape
          </button>
        </div>
      </div>
      
      <AudioManager 
        activeAudios={activeAudios}
        currentTime={currentTime}
        isPlaying={isPlaying}
        volume={volume}
        muted={muted}
      />
      
      <ActiveMediaDisplay 
        activeVideos={activeVideos}
        activeAudios={activeAudios}
      />
    </div>
  );
};

export default Preview;
