import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Maximize, MinusCircle, PlusCircle, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { TimelineItem } from '../VideoEditor';

const DEFAULT_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface VideoPlayerProps {
  activeVideo: TimelineItem | null;
  currentTime: number;
  isPlaying: boolean;
  muted: boolean;
  volume: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  fullscreen: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  duration: number;
  minimized?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  activeVideo,
  currentTime,
  isPlaying,
  muted,
  volume,
  zoom,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  fullscreen,
  containerRef,
  duration,
  minimized = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current && loaded && activeVideo) {
      if (Math.abs(videoRef.current.currentTime - (currentTime - activeVideo.start)) > 0.5) {
        videoRef.current.currentTime = Math.max(0, currentTime - activeVideo.start);
      }
      
      videoRef.current.volume = muted ? 0 : volume;
      
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(err => {
          console.error('Failed to play video:', err);
        });
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    } else if (videoRef.current && !activeVideo) {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [activeVideo, currentTime, isPlaying, loaded, volume, muted]);

  useEffect(() => {
    if (videoRef.current && activeVideo?.src) {
      if (videoRef.current.src !== activeVideo.src) {
        videoRef.current.src = activeVideo.src;
        videoRef.current.load();
        videoRef.current.onloadeddata = () => setLoaded(true);
      }
    }
  }, [activeVideo]);

  return (
    <div className={cn(
      "flex-1 bg-[#1a1a1a] flex items-center justify-center p-2 relative",
      minimized && "h-full"
    )}>
      <div className={cn(
        "relative aspect-video bg-black rounded-sm overflow-hidden shadow-lg border border-white/5 transition-all",
        fullscreen ? "w-full h-full" : "w-full h-full",
        minimized && "max-h-full"
      )}>
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
          src={activeVideo?.src || DEFAULT_VIDEO_URL}
          playsInline
          onLoadedData={() => setLoaded(true)}
          onError={() => {
            toast.error('Error loading video', {
              description: 'Could not load the video. Please try a different file.',
            });
          }}
        />
        
        {!minimized && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
            <div className="flex justify-end">
              <div className="flex space-x-1 bg-black/50 backdrop-blur-sm p-1 rounded-md">
                <button 
                  className="p-1 text-white/80 hover:text-white transition-colors"
                  onClick={onZoomOut}
                >
                  <MinusCircle size={16} />
                </button>
                <button 
                  className="p-1 text-white/80 hover:text-white transition-colors"
                  onClick={onZoomIn}
                >
                  <PlusCircle size={16} />
                </button>
                <button 
                  className="p-1 text-white/80 hover:text-white transition-colors"
                  onClick={onToggleFullscreen}
                >
                  <Maximize size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <button className="p-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>
            
            <div className="w-full bg-black/50 backdrop-blur-sm p-1 rounded-md">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-editor-accent transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
