import React, { useRef, useEffect, useState } from 'react';
import { Maximize, MinusCircle, PlusCircle, Volume2, VolumeX, Undo, Redo, Scissors, Square, RotateCcw, RotateCw, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

const DEFAULT_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [zoom, setZoom] = useState(1);
  const [loaded, setLoaded] = useState(false);
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
    activeAudios.forEach(audio => {
      let audioElement = audioRefs.current.get(audio.id);
      
      if (!audioElement) {
        audioElement = new Audio(audio.src);
        audioRefs.current.set(audio.id, audioElement);
      }
      
      const relativePosition = currentTime - audio.start;
      if (Math.abs(audioElement.currentTime - relativePosition) > 0.5) {
        audioElement.currentTime = Math.max(0, relativePosition);
      }
      
      const clipVolume = (audio.volume || 1) * (muted ? 0 : volume);
      audioElement.volume = clipVolume;
      
      if (isPlaying && audioElement.paused) {
        audioElement.play().catch(err => {
          console.error('Failed to play audio:', err);
        });
      } else if (!isPlaying && !audioElement.paused) {
        audioElement.pause();
      }
    });
    
    audioRefs.current.forEach((audioElement, id) => {
      if (!activeAudios.some(audio => audio.id === id)) {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  }, [activeAudios, currentTime, isPlaying, volume, muted]);
  
  useEffect(() => {
    if (videoRef.current && activeVideo?.src) {
      if (videoRef.current.src !== activeVideo.src) {
        videoRef.current.src = activeVideo.src;
        videoRef.current.load();
        videoRef.current.onloadeddata = () => setLoaded(true);
      }
    }
  }, [activeVideo]);
  
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, []);
  
  return (
    <div ref={containerRef} className="flex-1 bg-editor-bg flex flex-col overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between p-2 bg-editor-panel/70 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <button className="button-icon">
            <Undo size={16} />
          </button>
          <button className="button-icon">
            <Redo size={16} />
          </button>
          <div className="h-4 w-px bg-white/20 mx-1"></div>
          <button className="button-icon">
            <Scissors size={16} />
          </button>
          <button className="button-icon">
            <RotateCcw size={16} />
          </button>
          <button className="button-icon">
            <RotateCw size={16} />
          </button>
        </div>
        
        <div className="text-sm font-medium text-white/70">
          {isPlaying ? "Playing" : "Paused"}
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="button-icon"
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
      
      <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center p-4 relative">
        <div className={cn(
          "relative aspect-video bg-black rounded-md overflow-hidden shadow-2xl border border-white/5 transition-all",
          fullscreen ? "w-full h-full" : "max-w-4xl w-full"
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
          
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
            <div className="flex justify-end">
              <div className="flex space-x-2 bg-black/50 backdrop-blur-sm p-1 rounded-md">
                <button 
                  className="p-1 text-white/80 hover:text-white transition-colors"
                  onClick={handleZoomOut}
                >
                  <MinusCircle size={18} />
                </button>
                <button 
                  className="p-1 text-white/80 hover:text-white transition-colors"
                  onClick={handleZoomIn}
                >
                  <PlusCircle size={18} />
                </button>
                <button 
                  className="p-1 text-white/80 hover:text-white transition-colors"
                  onClick={toggleFullscreen}
                >
                  <Maximize size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <button className="p-4 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </div>
            
            <div className="w-full bg-black/50 backdrop-blur-sm p-2 rounded-md">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-editor-accent transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-2 bg-editor-panel/70 border-t border-white/10 h-12 overflow-hidden">
        <div className="flex items-center space-x-4">
          <div className="text-xs font-medium text-white/70">Active Media:</div>
          <div className="flex flex-wrap gap-2">
            {activeVideos.map(video => (
              <div key={video.id} className="text-xs bg-yellow-400/20 px-2 py-1 rounded text-white/90">
                📹 {video.name}
              </div>
            ))}
            {activeAudios.map(audio => (
              <div key={audio.id} className="text-xs bg-blue-400/20 px-2 py-1 rounded text-white/90">
                🔊 {audio.name} ({Math.round(audio.volume! * 100)}%)
              </div>
            ))}
            {activeVideos.length === 0 && activeAudios.length === 0 && (
              <div className="text-xs text-white/50">No active media at current position</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
