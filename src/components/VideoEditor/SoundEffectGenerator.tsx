import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateSoundEffect } from '@/lib/elevenlabs';
import { TimelineItem } from './types';

interface SoundEffectGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const SoundEffectGenerator: React.FC<SoundEffectGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  
  // Get the API key from environment variables
  React.useEffect(() => {
    const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (elevenLabsApiKey) {
      setApiKey(elevenLabsApiKey);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    if (!apiKey) {
      toast.error('API key is missing', {
        description: 'Please add your ElevenLabs API key to the .env file (VITE_ELEVENLABS_API_KEY)',
      });
      return;
    }

    setIsGenerating(true);
    toast.info('Generating sound effect...', {
      description: 'This might take a few moments'
    });

    try {
      // Use the ElevenLabs API to generate a sound effect
      const audioUrl = await generateSoundEffect(prompt, apiKey);
      setGeneratedAudio(audioUrl);
      toast.success('Sound effect generated successfully!');
    } catch (error) {
      console.error('Error generating sound effect:', error);
      toast.error('Failed to generate sound effect', {
        description: error instanceof Error ? error.message : 'An error occurred while communicating with the AI model.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToTimeline = () => {
    if (!generatedAudio) return;
    
    const newAudioItem: TimelineItem = {
      id: `audio-${Date.now()}`,
      trackId: 'track3', // First audio track
      start: 0,
      duration: 5, // Default 5 seconds duration for audio
      type: 'audio',
      name: `SFX: ${prompt.substring(0, 15)}${prompt.length > 15 ? '...' : ''}`,
      color: 'bg-blue-400/70',
      src: generatedAudio,
      thumbnail: '',
      volume: 1.0,
    };
    
    onAddToTimeline(newAudioItem);
    toast.success('Sound effect added to timeline', {
      description: `Added to Audio Track 1`
    });
  };

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-xs text-[#F7F8F6]">Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Describe the sound effect you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-20 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>
      
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300 text-sm h-8"
      >
        {isGenerating ? 'Generating...' : 'Generate Sound Effect'}
      </Button>
      
      {!apiKey && (
        <div className="text-xs text-amber-400 mt-1">
          ⚠️ Please add your ElevenLabs API key to the .env file (VITE_ELEVENLABS_API_KEY)
        </div>
      )}
      
      {generatedAudio && (
        <div className="mt-3 space-y-2">
          <audio src={generatedAudio} controls className="w-full"></audio>
          
          <Button
            size="sm"
            onClick={handleAddToTimeline}
            className="w-full h-8 text-xs bg-editor-panel border border-white/20 hover:bg-editor-hover text-[#F7F8F6]"
            variant="outline"
          >
            Add to Timeline
          </Button>
        </div>
      )}
    </div>
  );
};

export default SoundEffectGenerator;
