import React, { useState } from 'react';
import { Music, Play, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';

interface SoundEffectsGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const SOUND_TYPES = [
  { id: 'ambience', name: 'Ambience' },
  { id: 'effect', name: 'Sound Effect' },
  { id: 'transition', name: 'Transition' },
  { id: 'impact', name: 'Impact' },
  { id: 'foley', name: 'Foley' },
];

const SoundEffectsGenerator: React.FC<SoundEffectsGeneratorProps> = ({ onAddToTimeline }) => {
  const [description, setDescription] = useState('');
  const [soundType, setSoundType] = useState('effect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  
  // Load API key from localStorage
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
      // In a real implementation, this would call the ElevenLabs API
      // For now, we'll simulate the API call with a placeholder
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate a generated audio URL
      const audioUrl = `data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADwAD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAc0AAAAAAAAAABSAJAJAQgAAgAAAA8DcWTzYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZB8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZDYP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`;
      
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

  const handleAddToTimeline = () => {
    if (!generatedAudio) return;
    
    const newAudioItem: TimelineItem = {
      id: `sfx-${Date.now()}`,
      trackId: 'track4', // Sound effects track
      start: 0,
      duration: 3, // Default 3 seconds duration for sound effects
      type: 'audio',
      name: `SFX: ${description.substring(0, 15)}${description.length > 15 ? '...' : ''}`,
      color: 'bg-yellow-400/70',
      src: generatedAudio,
      volume: 1,
    };
    
    onAddToTimeline(newAudioItem);
    toast.success('Sound effect added to timeline', {
      description: `Added to Sound Effects Track`
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
    <div className="space-y-4 p-3">
      <div className="space-y-2">
        <Label htmlFor="sound-description" className="text-xs text-[#F7F8F6]">Sound Description</Label>
        <Textarea
          id="sound-description"
          placeholder="Describe the sound effect you want to generate..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-32 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sound-type" className="text-xs text-[#F7F8F6]">Sound Type</Label>
        <Select value={soundType} onValueChange={setSoundType}>
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
      
      <div className="flex space-x-2">
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="flex-1 bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
        >
          {isGenerating ? (
            <>
              <span className="animate-pulse mr-2">Generating...</span>
            </>
          ) : (
            <>
              <Music className="h-4 w-4 mr-2" />
              Generate Sound
            </>
          )}
        </Button>
      </div>
      
      {generatedAudio && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Preview</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadAudio}
                className="h-8 border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddToTimeline}
                className="h-8 border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
              >
                <Save className="h-4 w-4 mr-2" />
                Add to Timeline
              </Button>
            </div>
          </div>
          
          <audio 
            controls 
            src={generatedAudio} 
            className="w-full h-10 rounded-md"
          />
        </div>
      )}
    </div>
  );
};

export default SoundEffectsGenerator;