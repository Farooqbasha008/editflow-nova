
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TimelineItem } from '../VideoEditor';
import { toast } from 'sonner';

const DEFAULT_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface VideoPlayerProps {
  activeVideo: TimelineItem | null;
  currentTime: number;
  isPlaying: boolean;
  muted: boolean;
  volume: number;
  fullscreen: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  duration: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  activeVideo,
  currentTime,
  isPlaying,
  muted,
  volume,
  fullscreen,
  containerRef,
  duration
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
    <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center relative">
      <div className={cn(
        "relative aspect-video bg-black rounded overflow-hidden shadow-lg",
        fullscreen ? "w-full h-full" : "w-full max-w-full max-h-full"
      )}>
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain"
          src={activeVideo?.src || DEFAULT_VIDEO_URL}
          playsInline
          onLoadedData={() => setLoaded(true)}
          onError={() => {
            toast.error('Error loading video', {
              description: 'Could not load the video. Please try a different file.',
            });
          }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
