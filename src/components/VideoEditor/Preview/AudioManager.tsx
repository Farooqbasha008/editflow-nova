
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
      
      // Calculate position with trim adjustments
      const trimStart = audio.trimStart || 0;
      const relativePosition = currentTime - audio.start;
      
      // Apply trim start - only play audio after the trim start point
      if (relativePosition < trimStart) {
        if (!audioElement.paused) {
          audioElement.pause();
        }
        return;
      }
      
      // Apply trim end - stop playing when we reach the trim end point
      const trimEnd = audio.trimEnd || 0;
      const effectiveDuration = audio.duration - trimStart - trimEnd;
      if (relativePosition > trimStart + effectiveDuration) {
        if (!audioElement.paused) {
          audioElement.pause();
        }
        return;
      }
      
      // Set the correct position in the audio file (accounting for trim)
      const audioPosition = relativePosition - trimStart;
      if (Math.abs(audioElement.currentTime - audioPosition) > 0.5) {
        audioElement.currentTime = Math.max(0, audioPosition);
      }
      
      // Apply volume and mute settings
      // Check both global mute and individual audio mute
      const isAudioMuted = muted || audio.muted;
      const clipVolume = (audio.volume || 1) * (isAudioMuted ? 0 : volume);
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
