
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Loader2, Play, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimelineItem } from './VideoEditor';
import { generateSpeech } from '@/lib/groq';

interface VoiceoverGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

// Updated voice list with Fritz and new voices
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
  const [generatedVoiceovers, setGeneratedVoiceovers] = useState<Array<{ id: string; src: string; text: string; voiceName: string; duration?: number }>>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioDurationRef = useRef<Record<string, number>>({});
  
  // Function to calculate audio duration
  const getAudioDuration = async (audioUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      
      // Fallback if metadata doesn't load
      audio.addEventListener('error', () => {
        // Estimate duration based on text length (as fallback)
        // Roughly 0.5 seconds per word
        const wordCount = text.trim().split(/\s+/).length;
        resolve(Math.max(wordCount * 0.5, 1.5));
      });
    });
  };

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
      
      // Get actual audio duration
      const audioDuration = await getAudioDuration(audioUrl);
      audioDurationRef.current[`voice-${Date.now()}`] = audioDuration;
      
      const newVoiceover = {
        id: `voice-${Date.now()}`,
        src: audioUrl,
        text: text,
        voiceName: voiceName,
        duration: audioDuration
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

  const handleAddToTimeline = (voiceover: { id: string; src: string; text: string; voiceName: string; duration?: number }) => {
    // Use actual duration if available, otherwise estimate
    const duration = voiceover.duration || 5;
    
    onAddToTimeline({
      id: voiceover.id,
      type: 'audio',
      name: `Voiceover: ${voiceover.text.substring(0, 20)}${voiceover.text.length > 20 ? '...' : ''}`,
      src: voiceover.src,
      start: 0,
      duration: duration, // Use actual audio duration
      trackId: `audio-${Date.now()}`,
      color: '#D7F266' // Green color for voiceovers
    });
  };
  
  // Make voiceover items draggable
  const handleDragStart = (e: React.DragEvent, voiceover: { id: string; src: string; text: string; voiceName: string; duration?: number }) => {
    // Use actual duration if available, otherwise estimate
    const duration = voiceover.duration || 5;
    
    const timelineItem = {
      id: voiceover.id,
      type: 'audio',
      name: `Voiceover: ${voiceover.text.substring(0, 20)}${voiceover.text.length > 20 ? '...' : ''}`,
      src: voiceover.src,
      duration: duration,
      color: '#D7F266' // Green color
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(timelineItem));
    e.dataTransfer.effectAllowed = 'copy';
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
          <SelectContent>
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
                draggable="true"
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
                  {voiceover.duration && (
                    <div className="text-xs text-gray-400">
                      Duration: {Math.floor(voiceover.duration / 60)}:{Math.floor(voiceover.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 bg-[#D7F266] rounded-sm flex items-center justify-center cursor-pointer"
                    title="Drag to timeline"
                  >
                    <div className="w-4 h-4 bg-[#F2FCE2] rounded-sm" />
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceoverGenerator;
