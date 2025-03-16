
import React, { useRef, useEffect, useState } from 'react';
import { Maximize, MinusCircle, PlusCircle, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [zoom, setZoom] = useState(1);
  const [loaded, setLoaded] = useState(false);
  
  // Get active media based on current time
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
  
  // Use the last added video as the active one (highest z-index)
  const activeVideo = activeVideos.length > 0 ? activeVideos[activeVideos.length - 1] : null;
  
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
    if (videoRef.current && loaded && activeVideo) {
      if (Math.abs(videoRef.current.currentTime - (currentTime - activeVideo.start)) > 0.5) {
        videoRef.current.currentTime = Math.max(0, currentTime - activeVideo.start);
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
    } else if (videoRef.current && !activeVideo) {
      // No active video, pause if playing
      if (!videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [activeVideo, currentTime, isPlaying, loaded, volume, muted]);
  
  // Sync audio with timeline
  useEffect(() => {
    // Process active audio items
    activeAudios.forEach(audio => {
      let audioElement = audioRefs.current.get(audio.id);
      
      if (!audioElement) {
        // Create a new audio element if it doesn't exist
        audioElement = new Audio(audio.src);
        audioRefs.current.set(audio.id, audioElement);
      }
      
      // Calculate relative position in the audio clip
      const relativePosition = currentTime - audio.start;
      if (Math.abs(audioElement.currentTime - relativePosition) > 0.5) {
        audioElement.currentTime = Math.max(0, relativePosition);
      }
      
      // Set individual volume for this audio track (multiply by master volume)
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
    
    // Pause any audio elements that are no longer active
    audioRefs.current.forEach((audioElement, id) => {
      if (!activeAudios.some(audio => audio.id === id)) {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  }, [activeAudios, currentTime, isPlaying, volume, muted]);
  
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
  
  // Cleanup audio elements when component unmounts
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
      
      {/* Current media info */}
      <div className="p-2 bg-editor-panel/70 border-t border-white/10">
        <ScrollArea className="h-16">
          <div className="space-y-2 p-2">
            <h3 className="text-xs font-medium text-white/70">Active Media:</h3>
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
        </ScrollArea>
      </div>
    </div>
  );
};

export default Preview;
