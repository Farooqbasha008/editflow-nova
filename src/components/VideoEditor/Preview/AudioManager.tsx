
import React, { useRef, useEffect } from 'react';
import { TimelineItem } from '../VideoEditor';

interface AudioManagerProps {
  activeAudios: TimelineItem[];
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
}

const AudioManager: React.FC<AudioManagerProps> = ({
  activeAudios,
  currentTime,
  isPlaying,
  volume,
  muted
}) => {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

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
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default AudioManager;
