import React, { useRef, useEffect, useState } from 'react';
import { TimelineItem } from '../VideoEditor';
import { toast } from 'sonner';

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
  const [loadedAudios, setLoadedAudios] = useState<Set<string>>(new Set());

  // Create, update or remove audio elements as needed
  useEffect(() => {
    console.log('Active audios changed:', activeAudios.length);
    
    // Track which audio IDs we're handling in this effect run
    const currentAudioIds = new Set<string>();
    
    // Process each active audio
    activeAudios.forEach(audio => {
      currentAudioIds.add(audio.id);
      
      // Create new audio element if it doesn't exist
      if (!audioRefs.current.has(audio.id)) {
        console.log('Creating new audio element for:', audio.id, audio.src);
        const audioElement = new Audio();
        
        // Add event listeners
        audioElement.addEventListener('loadeddata', () => {
          console.log('Audio loaded:', audio.id);
          setLoadedAudios(prev => new Set(prev).add(audio.id));
        });
        
        audioElement.addEventListener('error', (e) => {
          console.error('Audio loading error:', audio.id, e);
          toast.error('Error loading audio', {
            description: `Could not load audio: ${audio.name}`,
          });
        });
        
        // Set the source and load
        audioElement.src = audio.src || '';
        audioElement.load();
        audioRefs.current.set(audio.id, audioElement);
      }
    });
    
    // Clean up audio elements that are no longer active
    audioRefs.current.forEach((_, id) => {
      if (!currentAudioIds.has(id)) {
        console.log('Removing unused audio element:', id);
        const audioToRemove = audioRefs.current.get(id);
        if (audioToRemove) {
          audioToRemove.pause();
          audioToRemove.src = '';
          audioRefs.current.delete(id);
          setLoadedAudios(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      }
    });
    
    // Clean up function
    return () => {
      // No need to do anything here since we handle cleanup when audios change
    };
  }, [activeAudios]);

  // Handle playback status, position, and volume for each audio
  useEffect(() => {
    activeAudios.forEach(audio => {
      const audioElement = audioRefs.current.get(audio.id);
      if (!audioElement || !loadedAudios.has(audio.id)) return;
      
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
      
      // Handle play/pause
      if (isPlaying) {
        if (audioElement.paused) {
          console.log('Playing audio:', audio.id);
          audioElement.play().catch(err => {
            console.error('Failed to play audio:', audio.id, err);
          });
        }
      } else {
        if (!audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  }, [activeAudios, currentTime, isPlaying, volume, muted, loadedAudios]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('AudioManager unmounting, cleaning up');
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
      setLoadedAudios(new Set());
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default AudioManager;
