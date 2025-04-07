
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, Download, Plus } from 'lucide-react';
import { generateSpeech } from '@/lib/groq';
import { TimelineItem } from './types';

interface VoiceoverGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const VoiceoverGenerator: React.FC<VoiceoverGeneratorProps> = ({ onAddToTimeline }) => {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("nova");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to generate voiceover');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating voiceover...', {
      description: 'This might take a few moments'
    });

    try {
      const audioUrl = await generateSpeech(text, voice);
      setGeneratedAudioUrl(audioUrl);
      toast.success('Voiceover generated successfully!');
    } catch (error) {
      console.error('Error generating voiceover:', error);
      toast.error('Failed to generate voiceover', {
        description: error instanceof Error ? error.message : 'An error occurred while communicating with the AI model.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !generatedAudioUrl) return;
    
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
    if (!generatedAudioUrl) return;
    
    const newAudioItem: TimelineItem = {
      id: `audio-${Date.now()}`,
      trackId: 'track3', // First audio track
      start: 0,
      duration: 5, // Default 5 seconds duration for audio
      type: 'audio',
      name: `Voiceover: ${text.substring(0, 15)}${text.length > 15 ? '...' : ''}`,
      color: 'bg-blue-400/70',
      src: generatedAudioUrl,
      thumbnail: '',
      volume: 1.0,
    };
    
    onAddToTimeline(newAudioItem);
    toast.success('Voiceover added to timeline', {
      description: `Added to Audio Track 1`
    });
  };

  const downloadAudio = () => {
    if (!generatedAudioUrl) return;
    
    const a = document.createElement('a');
    a.href = generatedAudioUrl;
    a.download = `voiceover_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Audio download started');
  };

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <Label htmlFor="text" className="text-xs text-[#F7F8F6]">Text</Label>
        <Textarea
          id="text"
          placeholder="Enter the text for the voiceover..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-24 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="voice" className="text-xs text-[#F7F8F6]">Voice</Label>
        <Select value={voice} onValueChange={setVoice}>
          <SelectTrigger className="text-xs bg-transparent border-white/20 focus-visible:ring-[#D7F266]">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nova">Nova (Realistic Female)</SelectItem>
            <SelectItem value="quinn">Quinn (Energetic Female)</SelectItem>
            <SelectItem value="atlas">Atlas (Deep Male)</SelectItem>
            <SelectItem value="echo">Echo (Calm Male)</SelectItem>
            <SelectItem value="onyx">Onyx (Smooth Male)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !text.trim()}
        className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300 text-sm h-8"
      >
        {isGenerating ? 'Generating...' : 'Generate Voiceover'}
      </Button>
      
      {generatedAudioUrl && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 bg-editor-panel/50 p-2 rounded">
            <button
              className="p-1 bg-editor-hover rounded-full"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <div className="text-xs text-[#F7F8F6]/90 truncate flex-1">
              {text.substring(0, 20)}{text.length > 20 ? '...' : ''}
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
          
          <audio ref={audioRef} src={generatedAudioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default VoiceoverGenerator;
