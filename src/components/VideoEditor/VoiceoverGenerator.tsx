
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Mic, Loader2, Play, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimelineItem } from './VideoEditor';
import { generateSpeech } from '@/lib/groq';

interface VoiceoverGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

// Updated voices list based on requirements
const VOICES = [
  { id: 'Fritz-PlayAI', name: 'Fritz' },
  { id: 'Aaliyah-PlayAI', name: 'Aaliyah' },
  { id: 'Adelaide-PlayAI', name: 'Adelaide' },
  { id: 'Angelo-PlayAI', name: 'Angelo' },
  { id: 'Arista-PlayAI', name: 'Arista' },
  { id: 'Atlas-PlayAI', name: 'Atlas' },
  { id: 'Basil-PlayAI', name: 'Basil' },
  { id: 'Briggs-PlayAI', name: 'Briggs' },
  { id: 'Calum-PlayAI', name: 'Calum' },
  { id: 'Celeste-PlayAI', name: 'Celeste' },
  { id: 'Cheyenne-PlayAI', name: 'Cheyenne' },
  { id: 'Chip-PlayAI', name: 'Chip' },
  { id: 'Cillian-PlayAI', name: 'Cillian' },
  { id: 'Deedee-PlayAI', name: 'Deedee' },
  { id: 'Eleanor-PlayAI', name: 'Eleanor' },
  { id: 'Gail-PlayAI', name: 'Gail' },
  { id: 'Indigo-PlayAI', name: 'Indigo' },
  { id: 'Jennifer-PlayAI', name: 'Jennifer' },
  { id: 'Judy-PlayAI', name: 'Judy' },
  { id: 'Mamaw-PlayAI', name: 'Mamaw' },
  { id: 'Mason-PlayAI', name: 'Mason' },
  { id: 'Mikail-PlayAI', name: 'Mikail' },
  { id: 'Mitch-PlayAI', name: 'Mitch' },
  { id: 'Nia-PlayAI', name: 'Nia' },
  { id: 'Quinn-PlayAI', name: 'Quinn' },
  { id: 'Ruby-PlayAI', name: 'Ruby' },
  { id: 'Thunder-PlayAI', name: 'Thunder' }
];

const VoiceoverGenerator: React.FC<VoiceoverGeneratorProps> = ({ onAddToTimeline }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [voice, setVoice] = useState<string>('Fritz-PlayAI');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVoiceovers, setGeneratedVoiceovers] = useState<Array<{ id: string; src: string; text: string; voiceName: string }>>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please enter your Groq API key');
      return;
    }

    if (!text) {
      setError('Please enter some text for the voiceover');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const audioUrl = await generateSpeech(text, apiKey, {
        voiceId: voice,
        model: 'playai-tts'
      });

      const selectedVoice = VOICES.find(v => v.id === voice);
      const voiceName = selectedVoice ? selectedVoice.name : 'Unknown';
      
      const newVoiceover = {
        id: `voice-${Date.now()}`,
        src: audioUrl,
        text: text,
        voiceName: voiceName
      };

      setGeneratedVoiceovers(prev => [newVoiceover, ...prev]);
    } catch (err) {
      setError(`Error generating voiceover: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = (id: string, src: string) => {
    if (currentlyPlaying === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(src);
      audioRef.current.play();
      audioRef.current.onended = () => setCurrentlyPlaying(null);
      setCurrentlyPlaying(id);
    }
  };

  const handleAddToTimeline = (voiceover: { id: string; src: string; text: string; voiceName: string }) => {
    onAddToTimeline({
      id: voiceover.id,
      type: 'audio',
      name: `Voiceover: ${voiceover.text.substring(0, 20)}${voiceover.text.length > 20 ? '...' : ''}`,
      src: voiceover.src,
      start: 0,
      duration: 5, // Estimated duration - in a real app would calculate from audio file
      trackId: `audio-${Date.now()}`,
      color: '#9B51E0' // Purple color for voiceovers
    });
  };

  // Make voiceover items draggable
  const handleDragStart = (e: React.DragEvent, voiceover: { id: string; src: string; text: string; voiceName: string }) => {
    const timelineItem = {
      id: voiceover.id,
      type: 'audio',
      name: `Voiceover: ${voiceover.text.substring(0, 20)}${voiceover.text.length > 20 ? '...' : ''}`,
      src: voiceover.src,
      start: 0,
      duration: 5, // Estimated duration
      trackId: '',
      color: '#9B51E0' // Purple color for voiceovers
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(timelineItem));
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
          <SelectTrigger className="w-full bg-[#1E1E1E]">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent className="max-h-[15rem] overflow-y-auto">
            {VOICES.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Text</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text for your voiceover..."
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
              <div 
                key={voiceover.id} 
                className="flex items-center bg-[#252525] p-2 rounded"
                draggable
                onDragStart={(e) => handleDragStart(e, voiceover)}
              >
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handlePlayPause(voiceover.id, voiceover.src)}
                  className="mr-2 h-8 w-8 text-gray-300"
                >
                  <Play size={16} className={currentlyPlaying === voiceover.id ? "text-[#D7F266]" : ""} />
                </Button>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-sm">{voiceover.text}</div>
                  <div className="text-xs text-gray-400">Voice: {voiceover.voiceName}</div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleAddToTimeline(voiceover)}
                  className="ml-2"
                >
                  <Plus size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceoverGenerator;
