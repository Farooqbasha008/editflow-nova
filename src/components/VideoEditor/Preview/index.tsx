
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { TimelineItem } from '../VideoEditor';
import PreviewControls from './PreviewControls';
import VideoPlayer from './VideoPlayer';
import ActiveMediaDisplay from './ActiveMediaDisplay';
import AudioManager from './AudioManager';

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
      <PreviewControls 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleFullscreen={toggleFullscreen}
        onToggleMute={onToggleMute}
        volume={volume}
        muted={muted}
        onVolumeChange={handleVolumeChange}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
      />
      
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
