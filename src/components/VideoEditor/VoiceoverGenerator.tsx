
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mic, Loader2 } from 'lucide-react';
import { generateSpeech } from '@/lib/groq';
import { TimelineItem } from './VideoEditor';

interface VoiceoverGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const AVAILABLE_VOICES = [
  'Aaliyah', 'Adelaide', 'Angelo', 'Arista', 'Atlas', 'Basil', 'Briggs', 
  'Calum', 'Celeste', 'Cheyenne', 'Chip', 'Cillian', 'Deedee', 'Eleanor', 
  'Fritz', 'Gail', 'Indigo', 'Jennifer', 'Judy', 'Mamaw', 'Mason', 
  'Mikail', 'Mitch', 'Nia', 'Quinn', 'Ruby', 'Thunder'
];

const VoiceoverGenerator: React.FC<VoiceoverGeneratorProps> = ({ onAddToTimeline }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [voice, setVoice] = useState<string>('Fritz');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVoiceovers, setGeneratedVoiceovers] = useState<Array<{ id: string; src: string; text: string; voice: string }>>([]);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please enter your Groq API key');
      return;
    }

    if (!text) {
      setError('Please enter text for the voiceover');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const audioUrl = await generateSpeech(text, apiKey, {
        voiceId: voice,
        model: "playai-tts"
      });

      const newVoiceover = {
        id: `voiceover-${Date.now()}`,
        src: audioUrl,
        text: text,
        voice: voice
      };

      setGeneratedVoiceovers(prev => [newVoiceover, ...prev]);
      setText('');
    } catch (err) {
      setError(`Error generating voiceover: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToTimeline = (voiceover: { id: string; src: string; text: string; voice: string }) => {
    onAddToTimeline({
      id: voiceover.id,
      type: 'audio',
      name: `Voiceover: ${voiceover.text.substring(0, 20)}${voiceover.text.length > 20 ? '...' : ''}`,
      src: voiceover.src,
      start: 0,
      duration: 5, // Default duration, could be calculated based on text length
      trackId: 'audio-1', // Default track ID
      color: '#4CAF50', // Green color for voiceovers
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api-key">Groq API Key</Label>
        <Input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Groq API key"
          className="bg-[#1E1E1E]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="voice">Voice</Label>
        <Select value={voice} onValueChange={setVoice}>
          <SelectTrigger className="bg-[#1E1E1E]">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_VOICES.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Text for Voiceover</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text for the voiceover..."
          className="h-24 bg-[#1E1E1E]"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !apiKey || !text}
        className="w-full bg-[#D7F266] hover:bg-[#c5e150] text-black"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Generate Voiceover
          </>
        )}
      </Button>

      <div className="space-y-2 mt-4">
        <Label>Generated Voiceovers</Label>
        {generatedVoiceovers.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            No voiceovers generated yet
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {generatedVoiceovers.map((voiceover) => (
              <div key={voiceover.id} className="flex items-center justify-between bg-[#252525] p-2 rounded">
                <div className="truncate flex-1 mr-2">
                  <div className="font-medium">{voiceover.voice}</div>
                  <div className="text-sm text-gray-400 truncate">{voiceover.text}</div>
                </div>
                <div className="flex space-x-2">
                  <audio controls src={voiceover.src} className="h-8 w-32" />
                  <Button size="sm" variant="outline" onClick={() => handleAddToTimeline(voiceover)}>
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

export default VoiceoverGenerator;
