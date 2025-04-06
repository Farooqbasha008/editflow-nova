
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Music, Loader2 } from 'lucide-react';
import { generateSound } from '@/lib/elevenlabs';
import { TimelineItem } from './VideoEditor';

interface SoundEffectGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const SoundEffectGenerator: React.FC<SoundEffectGeneratorProps> = ({ onAddToTimeline }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [duration, setDuration] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSounds, setGeneratedSounds] = useState<Array<{ id: string; url: string; description: string }>>([]);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please enter your ElevenLabs API key');
      return;
    }

    if (!description) {
      setError('Please enter a description for the sound effect');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const soundUrl = await generateSound(description, apiKey, {
        type: 'sfx',
        duration: duration
      });

      const newSound = {
        id: `sfx-${Date.now()}`,
        url: soundUrl,
        description: description
      };

      setGeneratedSounds(prev => [newSound, ...prev]);
      setDescription('');
    } catch (err) {
      setError(`Error generating sound effect: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToTimeline = (sound: { id: string; url: string; description: string }) => {
    onAddToTimeline({
      id: sound.id,
      type: 'audio',
      name: `Sound Effect: ${sound.description.substring(0, 20)}${sound.description.length > 20 ? '...' : ''}`,
      src: sound.url, // Changed from 'url' to 'src' to match TimelineItem interface
      start: 0,
      duration: duration,
      trackId: `audio-${Date.now()}`, // Adding required trackId property
      color: '#4AAEE8' // Adding a default color for audio items
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api-key">ElevenLabs API Key</Label>
        <Input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your ElevenLabs API key"
          className="bg-[#1E1E1E]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Sound Effect Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the sound effect you want to generate..."
          className="h-24 bg-[#1E1E1E]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="duration">Duration (seconds)</Label>
          <span className="text-sm text-gray-400">{duration}s</span>
        </div>
        <Slider
          id="duration"
          value={[duration]}
          min={1}
          max={15}
          step={1}
          onValueChange={(vals) => setDuration(vals[0])}
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !apiKey || !description}
        className="w-full bg-[#D7F266] hover:bg-[#c5e150] text-black"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Music className="mr-2 h-4 w-4" />
            Generate Sound Effect
          </>
        )}
      </Button>

      <div className="space-y-2 mt-4">
        <Label>Generated Sound Effects</Label>
        {generatedSounds.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            No sound effects generated yet
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {generatedSounds.map((sound) => (
              <div key={sound.id} className="flex items-center justify-between bg-[#252525] p-2 rounded">
                <div className="truncate flex-1 mr-2">
                  {sound.description}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleAddToTimeline(sound)}>
                    Add to Timeline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundEffectGenerator;
