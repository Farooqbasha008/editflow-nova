
import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TimelineItem } from '../VideoEditor';
import { toast } from 'sonner';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

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
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  useEffect(() => {
    if (videoRef.current && loaded && activeVideo) {
      if (Math.abs(videoRef.current.currentTime - (currentTime - activeVideo.start)) > 0.5) {
        videoRef.current.currentTime = Math.max(0, currentTime - activeVideo.start);
      }
      
      const clipVolume = (activeVideo.volume || 1) * (muted ? 0 : volume);
      videoRef.current.volume = clipVolume;
      
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

  const toggleVideoVolume = () => {
    setShowVolumeControl(prev => !prev);
  };

  return (
    <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center relative p-4">
      <div className={cn(
        "relative aspect-video bg-black rounded overflow-hidden shadow-lg",
        fullscreen ? "w-full h-full" : "w-[90%] mx-auto"
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
        
        {activeVideo && (
          <div className="absolute bottom-0 right-0 p-2 flex items-center space-x-2 bg-black/40 rounded-tl-md">
            <button 
              className="w-7 h-7 flex items-center justify-center text-[#F7F8F6] hover:text-[#D7F266] transition-colors"
              onClick={toggleVideoVolume}
              title="Adjust video volume"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            
            {showVolumeControl && (
              <div className="w-24 px-2 py-1 bg-black/80 rounded-full">
                <Slider
                  value={[activeVideo.volume || 1]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => {
                    if (videoRef.current) {
                      videoRef.current.volume = value[0] * (muted ? 0 : volume);
                      const event = new CustomEvent('video-volume-change', {
                        detail: {
                          id: activeVideo.id,
                          volume: value[0]
                        }
                      });
                      window.dispatchEvent(event);
                    }
                  }}
                  className="h-1"
                />
                <div className="text-[10px] text-center text-[#F7F8F6] mt-1">
                  {Math.round((activeVideo.volume || 1) * 100)}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
