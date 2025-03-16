
import React, { useRef, useEffect, useState } from 'react';
import { Maximize, MinusCircle, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PreviewProps {
  currentTime: number;
  isPlaying: boolean;
}

const DEFAULT_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const Preview: React.FC<PreviewProps> = ({ currentTime, isPlaying }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zoom, setZoom] = useState(1);
  const [loaded, setLoaded] = useState(false);
  
  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Sync video with timeline
  useEffect(() => {
    if (videoRef.current && loaded) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
        videoRef.current.currentTime = currentTime;
      }
      
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(err => {
          console.error('Failed to play video:', err);
          toast.error('Failed to play video', {
            description: 'Please check your internet connection.',
          });
        });
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [currentTime, isPlaying, loaded]);
  
  return (
    <div className="flex-1 bg-editor-bg flex flex-col overflow-hidden animate-fade-in">
      <div className="flex-1 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-3xl aspect-video bg-black/70 rounded-lg overflow-hidden shadow-2xl border border-white/10">
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain transition-transform duration-300"
            style={{ transform: `scale(${zoom})` }}
            src={DEFAULT_VIDEO_URL}
            muted
            playsInline
            onLoadedData={() => setLoaded(true)}
            onError={() => {
              toast.error('Error loading video', {
                description: 'Could not load the video. Please try a different file.',
              });
            }}
          />
          
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <button 
              className="button-icon bg-black/50 backdrop-blur-md"
              onClick={handleZoomOut}
            >
              <MinusCircle size={16} />
            </button>
            <button 
              className="button-icon bg-black/50 backdrop-blur-md"
              onClick={handleZoomIn}
            >
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
