
import React, { useRef, useEffect, useState } from 'react';
import { Maximize, MinusCircle, PlusCircle, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';

interface PreviewProps {
  currentTime: number;
  isPlaying: boolean;
  timelineItems: TimelineItem[];
  volume: number;
  muted: boolean;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
}

const DEFAULT_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const Preview: React.FC<PreviewProps> = ({ 
  currentTime, 
  isPlaying, 
  timelineItems,
  volume,
  muted,
  onToggleMute,
  onVolumeChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [zoom, setZoom] = useState(1);
  const [loaded, setLoaded] = useState(false);
  
  // Get active media based on current time
  const activeVideo = timelineItems.find(item => 
    item.type === 'video' && 
    currentTime >= item.start && 
    currentTime < (item.start + item.duration)
  );
  
  const activeAudio = timelineItems.find(item => 
    item.type === 'audio' && 
    currentTime >= item.start && 
    currentTime < (item.start + item.duration)
  );
  
  // Handle zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Handle volume slider
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };
  
  // Sync video with timeline
  useEffect(() => {
    if (videoRef.current && loaded) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
        videoRef.current.currentTime = currentTime;
      }
      
      // Set volume
      videoRef.current.volume = muted ? 0 : volume;
      
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(err => {
          console.error('Failed to play video:', err);
        });
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [currentTime, isPlaying, loaded, volume, muted]);
  
  // Sync audio with timeline
  useEffect(() => {
    if (audioRef.current) {
      if (activeAudio) {
        // Set audio source if needed
        if (audioRef.current.src !== activeAudio.src) {
          audioRef.current.src = activeAudio.src || '';
          audioRef.current.load();
        }
        
        // Calculate relative position in the audio clip
        const relativePosition = currentTime - activeAudio.start;
        if (Math.abs(audioRef.current.currentTime - relativePosition) > 0.5) {
          audioRef.current.currentTime = relativePosition;
        }
        
        // Set volume
        audioRef.current.volume = muted ? 0 : volume;
        
        if (isPlaying && audioRef.current.paused) {
          audioRef.current.play().catch(err => {
            console.error('Failed to play audio:', err);
          });
        } else if (!isPlaying && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      } else {
        // No active audio, pause if playing
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
      }
    }
  }, [activeAudio, currentTime, isPlaying, volume, muted]);
  
  // Set video source based on active item
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
    <div className="flex-1 bg-editor-bg flex flex-col overflow-hidden animate-fade-in">
      <div className="flex-1 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-3xl aspect-video bg-black/70 rounded-lg overflow-hidden shadow-2xl border border-white/10">
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
          
          {/* Hidden audio element for audio tracks */}
          <audio 
            ref={audioRef} 
            src={activeAudio?.src}
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
          
          {/* Volume control */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-2">
            <button 
              className="button-icon bg-black/50 backdrop-blur-md"
              onClick={onToggleMute}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
