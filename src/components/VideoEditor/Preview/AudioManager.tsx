import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const [audioStates, setAudioStates] = useState<Map<string, 'loading' | 'error' | 'ready'>>(new Map());

  // Helper function to create new audio element
  const createAudioElement = useCallback((audio: TimelineItem) => {
    console.log('Creating new audio element for:', audio.id, audio.src);
    
    if (!audio.src) {
      console.error('Audio source is missing:', audio.id);
      setAudioStates(prev => new Map(prev).set(audio.id, 'error'));
      toast.error('Audio source missing', {
        description: `Could not load audio: ${audio.name} (no source)`,
      });
      return null;
    }
    
    const audioElement = new Audio();
    
    // Set loading state
    setAudioStates(prev => new Map(prev).set(audio.id, 'loading'));
    
    // Add event listeners
    audioElement.addEventListener('loadeddata', () => {
      console.log('Audio loaded successfully:', audio.id);
      setLoadedAudios(prev => new Set(prev).add(audio.id));
      setAudioStates(prev => new Map(prev).set(audio.id, 'ready'));
    });
    
    audioElement.addEventListener('canplaythrough', () => {
      setAudioStates(prev => {
        // Only update if not already set to ready
        if (prev.get(audio.id) !== 'ready') {
          return new Map(prev).set(audio.id, 'ready');
        }
        return prev;
      });
    });
    
    audioElement.addEventListener('error', (e) => {
      console.error('Audio loading error:', audio.id, e);
      setAudioStates(prev => new Map(prev).set(audio.id, 'error'));
      toast.error('Error loading audio', {
        description: `Could not load audio: ${audio.name}`,
      });
    });
    
    // Set preload and source
    audioElement.preload = 'auto';
    
    try {
      audioElement.src = audio.src;
      audioElement.load();
      return audioElement;
    } catch (error) {
      console.error('Error setting audio source:', error);
      setAudioStates(prev => new Map(prev).set(audio.id, 'error'));
      toast.error('Invalid audio source', {
        description: `Could not load audio: ${audio.name}`,
      });
      return null;
    }
  }, []);

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
        const newAudio = createAudioElement(audio);
        if (newAudio) {
          audioRefs.current.set(audio.id, newAudio);
        }
      } else {
        // Check if the source has changed
        const existingAudio = audioRefs.current.get(audio.id);
        if (existingAudio && existingAudio.src !== audio.src && audio.src) {
          console.log('Audio source changed, recreating element:', audio.id);
          existingAudio.pause();
          existingAudio.src = '';
          
          const newAudio = createAudioElement(audio);
          if (newAudio) {
            audioRefs.current.set(audio.id, newAudio);
          }
        }
      }
    });
    
    // Clean up audio elements that are no longer active
    audioRefs.current.forEach((audio, id) => {
      if (!currentAudioIds.has(id)) {
        console.log('Removing unused audio element:', id);
        audio.pause();
        audio.src = '';
        audioRefs.current.delete(id);
        
        // Clean up state
        setLoadedAudios(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        
        setAudioStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }
    });
  }, [activeAudios, createAudioElement]);

  // Handle playback status, position, and volume for each audio
  useEffect(() => {
    activeAudios.forEach(audio => {
      const audioElement = audioRefs.current.get(audio.id);
      if (!audioElement || audioStates.get(audio.id) !== 'ready') return;
      
      try {
        // Calculate position with trim adjustments
        const trimStart = audio.trimStart || 0;
        const relativePosition = Math.max(0, currentTime - audio.start);
        
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
          console.log(`Seeking audio ${audio.id} to ${audioPosition}`);
          audioElement.currentTime = Math.max(0, audioPosition);
        }
        
        // Apply volume and mute settings
        // Check both global mute and individual audio mute
        const isAudioMuted = muted || audio.muted;
        const clipVolume = (audio.volume || 1) * (isAudioMuted ? 0 : volume);
        audioElement.volume = Math.max(0, Math.min(1, clipVolume)); // Ensure volume is between 0 and 1
        
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
      } catch (error) {
        console.error('Error controlling audio playback:', audio.id, error);
      }
    });
  }, [activeAudios, currentTime, isPlaying, volume, muted, audioStates]);

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
      setAudioStates(new Map());
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default AudioManager;
