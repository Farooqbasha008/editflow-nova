<<<<<<< HEAD
import React, { useState } from 'react';
import { Mic, Play, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
=======

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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df

interface VoiceoverGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

<<<<<<< HEAD
const GROQ_VOICES = [
  { id: 'Aaliyah', name: 'Aaliyah' },
  { id: 'Adelaide', name: 'Adelaide' },
  { id: 'Angelo', name: 'Angelo' },
  { id: 'Arista', name: 'Arista' },
  { id: 'Atlas', name: 'Atlas' },
  { id: 'Basil', name: 'Basil' },
  { id: 'Briggs', name: 'Briggs' },
  { id: 'Calum', name: 'Calum' },
  { id: 'Celeste', name: 'Celeste' },
  { id: 'Cheyenne', name: 'Cheyenne' },
  { id: 'Chip', name: 'Chip' },
  { id: 'Cillian', name: 'Cillian' },
  { id: 'Deedee', name: 'Deedee' },
  { id: 'Eleanor', name: 'Eleanor' },
  { id: 'Fritz', name: 'Fritz' },
  { id: 'Gail', name: 'Gail' },
  { id: 'Indigo', name: 'Indigo' },
  { id: 'Jennifer', name: 'Jennifer' },
  { id: 'Judy', name: 'Judy' },
  { id: 'Mamaw', name: 'Mamaw' },
  { id: 'Mason', name: 'Mason' },
  { id: 'Mikail', name: 'Mikail' },
  { id: 'Mitch', name: 'Mitch' },
  { id: 'Nia', name: 'Nia' },
  { id: 'Quinn', name: 'Quinn' },
  { id: 'Ruby', name: 'Ruby' },
  { id: 'Thunder', name: 'Thunder' },
];

const VoiceoverGenerator: React.FC<VoiceoverGeneratorProps> = ({ onAddToTimeline }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Fritz');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [trimSilence, setTrimSilence] = useState<boolean>(true); // Default to true for better user experience
  
  // Load API key from localStorage
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('groq_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter text for the voiceover');
      return;
    }
    
    if (!apiKey) {
      toast.error('Groq API key is required', {
        description: 'Please enter your Groq API key in the settings',
      });
=======
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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
      return;
    }

    setIsGenerating(true);
    toast.info('Generating voiceover...', {
      description: 'This might take a few moments'
    });

    try {
<<<<<<< HEAD
      // Import the generateSpeech function from the groq.ts file
      const { generateSpeech } = await import('@/lib/groq');
      
      // Call the Groq API to generate speech
      const audioUrl = await generateSpeech(
        text,
        apiKey,
        { 
          voiceId: voice,
          trimSilence: trimSilence // Pass the trim silence option
        }
      );
      
      setGeneratedAudio(audioUrl);
=======
      const audioUrl = await generateSpeech(text, voice);
      setGeneratedAudioUrl(audioUrl);
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
      toast.success('Voiceover generated successfully!');
    } catch (error) {
      console.error('Error generating voiceover:', error);
      toast.error('Failed to generate voiceover', {
<<<<<<< HEAD
        description: error instanceof Error ? error.message : 'An error occurred while generating the voiceover.',
=======
        description: error instanceof Error ? error.message : 'An error occurred while communicating with the AI model.',
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
      });
    } finally {
      setIsGenerating(false);
    }
  };

<<<<<<< HEAD
  const handleAddToTimeline = () => {
    if (!generatedAudio) return;
    
    const newAudioItem: TimelineItem = {
      id: `voiceover-${Date.now()}`,
      trackId: 'track3', // Audio track
      start: 0,
      duration: 5, // Default 5 seconds duration
      type: 'audio',
      name: `Voiceover: ${text.substring(0, 15)}${text.length > 15 ? '...' : ''}`,
      color: 'bg-purple-400/70',
      src: generatedAudio,
      volume: 1,
=======
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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
    };
    
    onAddToTimeline(newAudioItem);
    toast.success('Voiceover added to timeline', {
<<<<<<< HEAD
      description: `Added to Audio Track`
=======
      description: `Added to Audio Track 1`
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
    });
  };

  const downloadAudio = () => {
<<<<<<< HEAD
    if (!generatedAudio) return;
    
    const a = document.createElement('a');
    a.href = generatedAudio;
=======
    if (!generatedAudioUrl) return;
    
    const a = document.createElement('a');
    a.href = generatedAudioUrl;
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
    a.download = `voiceover_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
<<<<<<< HEAD
    toast.success('Voiceover download started');
  };

  const saveApiKey = (key: string) => {
    if (key.trim()) {
      localStorage.setItem('groq_api_key', key);
      setApiKey(key);
      toast.success('API key saved');
    }
  };

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-2">
        <Label htmlFor="voice-text" className="text-xs text-[#F7F8F6]">Text</Label>
        <Textarea
          id="voice-text"
          placeholder="Enter text for voiceover..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-32 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
=======
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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
        />
      </div>
      
      <div className="space-y-2">
<<<<<<< HEAD
        <Label htmlFor="voice-select" className="text-xs text-[#F7F8F6]">Voice</Label>
        <Select value={voice} onValueChange={setVoice}>
          <SelectTrigger id="voice-select" className="bg-transparent border-white/20 text-white focus:ring-[#D7F266]">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
            {GROQ_VOICES.map((v) => (
              <SelectItem key={v.id} value={v.id} className="focus:bg-[#D7F266]/20 focus:text-white">
                {v.name}
              </SelectItem>
            ))}
=======
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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
          </SelectContent>
        </Select>
      </div>
      
<<<<<<< HEAD
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="trim-silence"
          checked={trimSilence}
          onChange={(e) => setTrimSilence(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 text-[#D7F266] focus:ring-[#D7F266]"
        />
        <Label htmlFor="trim-silence" className="text-xs text-[#F7F8F6] cursor-pointer">
          Trim silence from beginning and end
        </Label>
      </div>
      
      {!apiKey && (
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs text-[#F7F8F6]">Groq API Key</Label>
          <div className="flex space-x-2">
            <input
              id="api-key"
              type="password"
              placeholder="Enter your Groq API key"
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
          disabled={isGenerating || !text.trim()}
          className="flex-1 bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
        >
          {isGenerating ? (
            <>
              <span className="animate-pulse mr-2">Generating...</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Generate Voiceover
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
=======
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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
        </div>
      )}
    </div>
  );
};

<<<<<<< HEAD
export default VoiceoverGenerator;
=======
export default VoiceoverGenerator;
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
