
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { TimelineItem } from '../VideoEditor';
import VideoPlayer from './VideoPlayer';
import ActiveMediaDisplay from './ActiveMediaDisplay';
import AudioManager from './AudioManager';
import { Maximize, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface PreviewProps {
  currentTime: number;
  isPlaying: boolean;
  timelineItems: TimelineItem[];
  volume: number;
  muted: boolean;
  duration: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  onPlayPause: () => void;
}

const Preview: React.FC<PreviewProps> = ({ 
  currentTime, 
  isPlaying, 
  timelineItems,
  volume,
  muted,
  duration,
  onToggleMute,
  onVolumeChange,
  onPlayPause
}) => {
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
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div ref={containerRef} className="flex-1 bg-[#151514] flex flex-col overflow-hidden animate-fade-in">
      <VideoPlayer 
        activeVideo={activeVideo}
        currentTime={currentTime}
        isPlaying={isPlaying}
        muted={muted}
        volume={volume}
        fullscreen={fullscreen}
        containerRef={containerRef}
        duration={duration}
      />
      
      <div className="p-3 flex items-center justify-between border-b border-white/10 bg-[#151514]">
        <div className="flex items-center gap-3">
          <button 
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={onPlayPause}
          >
            {isPlaying ? 
              <Pause size={18} className="text-[#F7F8F6]" /> : 
              <Play size={18} className="text-[#F7F8F6] ml-1" />
            }
          </button>
          
          <button 
            className="w-8 h-8 flex items-center justify-center text-[#F7F8F6]/80 hover:text-[#F7F8F6] transition-colors"
            onClick={onToggleMute}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#D7F266] [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        
        <div className="text-[#F7F8F6]/80 text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            className="w-8 h-8 flex items-center justify-center text-[#F7F8F6]/80 hover:text-[#F7F8F6] transition-colors"
            onClick={toggleFullscreen}
          >
            <Maximize size={18} />
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
