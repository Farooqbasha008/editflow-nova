import React, { useState } from 'react';
import { Music, Play, Pause, Download, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { generateSound } from '@/lib/elevenlabs';

interface SoundEffectsGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

// Track constants for better organization
const TRACK_IDS = {
  VIDEO: 'video-track',
  MUSIC: 'music-track',
  VOICEOVER: 'voiceover-track',
  SOUND_EFFECTS: 'sfx-track'
} as const;

const SOUND_TYPES = [
  { id: 'cinematic', name: 'Cinematic', example: 'Dramatic orchestral hit with deep brass and rising tension' },
  { id: 'effect', name: 'Sound Effect', example: 'Metallic impact with reverb tail' },
  { id: 'transition', name: 'Transition', example: 'Smooth whoosh with tonal elements' },
  { id: 'impact', name: 'Impact', example: 'Deep bass drop with distortion' },
  { id: 'ambient', name: 'Ambient', example: 'Atmospheric pad with gentle movement' },
];

const SoundEffectsGenerator: React.FC<SoundEffectsGeneratorProps> = ({ onAddToTimeline }) => {
  const [description, setDescription] = useState('');
  const [soundType, setSoundType] = useState('effect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description for the sound effect');
      return;
    }

    if (!apiKey) {
      toast.error('ElevenLabs API key is required', {
        description: 'Please enter your ElevenLabs API key in the settings',
      });
      return;
    }

    setIsGenerating(true);
    toast.info('Generating sound effect...', {
      description: 'This might take a few moments'
    });

    try {
      const audioUrl = await generateSound(
        description,
        apiKey,
        { type: 'sfx', duration: 5 }
      );

      setGeneratedAudio(audioUrl);
      toast.success('Sound effect generated successfully!');
    } catch (error) {
      console.error('Error generating sound effect:', error);
      toast.error('Failed to generate sound effect', {
        description: error instanceof Error ? error.message : 'An error occurred while generating the sound effect.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !generatedAudio) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
        toast.error('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleAddToTimeline = () => {
    if (!generatedAudio) return;

    const newAudioItem: TimelineItem = {
      id: `sfx-${Date.now()}`,
      // Use sound effects track for sfx and ambient sounds, music track for musical elements
      trackId: soundType === 'ambient' ? TRACK_IDS.MUSIC : TRACK_IDS.SOUND_EFFECTS,
      start: 0,
      duration: 3,
      type: 'audio',
      name: `${soundType === 'ambient' ? 'Music' : 'SFX'}: ${description.substring(0, 15)}${description.length > 15 ? '...' : ''}`,
      color: soundType === 'ambient' ? 'bg-blue-400/70' : 'bg-yellow-400/70',
      src: generatedAudio,
      volume: 1,
    };

    onAddToTimeline(newAudioItem);
    toast.success(`${soundType === 'ambient' ? 'Music' : 'Sound effect'} added to timeline`, {
      description: `Added to ${soundType === 'ambient' ? 'Music' : 'Sound Effects'} Track`
    });
  };

  const downloadAudio = () => {
    if (!generatedAudio) return;

    const a = document.createElement('a');
    a.href = generatedAudio;
    a.download = `sound_effect_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success('Sound effect download started');
  };

  const saveApiKey = (key: string) => {
    if (key.trim()) {
      localStorage.setItem('elevenlabs_api_key', key);
      setApiKey(key);
      toast.success('API key saved');
    }
  };

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <Label htmlFor="sound-description" className="text-xs text-[#F7F8F6]">Sound Description</Label>
        <Select value={soundType} onValueChange={(type) => {
          setSoundType(type);
          const selectedType = SOUND_TYPES.find(t => t.id === type);
          if (selectedType) {
            setDescription(selectedType.example);
          }
        }}>
          <SelectTrigger id="sound-type" className="bg-transparent border-white/20 text-white focus:ring-[#D7F266]">
            <SelectValue placeholder="Select a sound type" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
            {SOUND_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id} className="focus:bg-[#D7F266]/20 focus:text-white">
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          id="sound-description"
          placeholder="Describe the sound effect you want to generate..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-24 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>

      {!apiKey && (
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs text-[#F7F8F6]">ElevenLabs API Key</Label>
          <div className="flex space-x-2">
            <input
              id="api-key"
              type="password"
              placeholder="Enter your ElevenLabs API key"
              className="flex-1 h-9 px-3 py-2 text-xs rounded-md bg-transparent border border-white/20 text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D7F266]"
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button 
              onClick={() => saveApiKey(apiKey)}
              className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] h-9 px-3 py-2 text-xs"
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-[#F7F8F6]/60">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !description.trim()}
        className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300 text-sm h-8"
      >
        {isGenerating ? (
          <span className="animate-pulse">Generating...</span>
        ) : (
          <>
            <Music className="h-4 w-4 mr-2" />
            Generate Sound
          </>
        )}
      </Button>

      {generatedAudio && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 bg-editor-panel/50 p-2 rounded">
            <button
              className="p-1 bg-editor-hover rounded-full"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <div className="text-xs text-[#F7F8F6]/90 truncate flex-1">
              {description.substring(0, 20)}{description.length > 20 ? '...' : ''}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[0.6rem] flex items-center gap-1 bg-editor-panel border-white/20 hover:bg-editor-hover"
              onClick={downloadAudio}
            >
              <Download size={12} />
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleAddToTimeline}
            className="w-full h-8 text-xs bg-editor-panel border border-white/20 hover:bg-editor-hover text-[#F7F8F6]"
            variant="outline"
          >
            <Plus size={14} className="mr-1" /> Add to Timeline
          </Button>

          <audio ref={audioRef} src={generatedAudio} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default SoundEffectsGenerator;