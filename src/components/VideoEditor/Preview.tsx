
import React, { useRef, useEffect } from 'react';
import { Maximize, MinusCircle, PlusCircle } from 'lucide-react';

interface PreviewProps {
  currentTime: number;
  isPlaying: boolean;
}

const Preview: React.FC<PreviewProps> = ({ currentTime, isPlaying }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Sync video with timeline
  useEffect(() => {
    if (videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
        videoRef.current.currentTime = currentTime;
      }
      
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(err => console.error('Failed to play video:', err));
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [currentTime, isPlaying]);
  
  return (
    <div className="flex-1 bg-editor-bg flex flex-col overflow-hidden animate-fade-in">
      <div className="flex-1 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-3xl aspect-video bg-black/70 rounded-lg overflow-hidden shadow-2xl border border-white/10">
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain"
            src="https://assets.mixkit.co/videos/preview/mixkit-driving-through-a-city-at-night-1731-large.mp4"
            muted
          />
          
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <button className="button-icon bg-black/50 backdrop-blur-md">
              <MinusCircle size={16} />
            </button>
            <button className="button-icon bg-black/50 backdrop-blur-md">
              <PlusCircle size={16} />
            </button>
            <button className="button-icon bg-black/50 backdrop-blur-md">
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
