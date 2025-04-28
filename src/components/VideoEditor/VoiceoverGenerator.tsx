import React, { useState } from 'react';
import { Mic, Play, Pause, Download, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { generateSpeech } from '@/lib/groq';
import { GripVertical } from 'lucide-react';
import { generatedMediaDB } from '@/lib/db';

interface VoiceoverGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

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

// Track constants for better organization
const TRACK_IDS = {
  VIDEO: 'video-track',
  MUSIC: 'music-track',
  VOICEOVER: 'voiceover-track',
  SOUND_EFFECTS: 'sfx-track'
} as const;

const VoiceoverGenerator: React.FC<VoiceoverGeneratorProps> = ({ onAddToTimeline }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Fritz');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [trimSilence, setTrimSilence] = useState<boolean>(true);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
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
      return;
    }

    setIsGenerating(true);
    toast.info('Generating voiceover...', {
      description: 'This might take a few moments'
    });

    try {
      const audioUrl = await generateSpeech(
        text,
        apiKey,
        { 
          voiceId: voice,
          trimSilence: trimSilence
        }
      );
      
      setGeneratedAudio(audioUrl);
      
      // Save to IndexedDB
      await generatedMediaDB.addMedia({
        name: `Voiceover: ${text.substring(0, 15)}${text.length > 15 ? '...' : ''}`,
        type: 'audio',
        src: audioUrl,
        dateCreated: new Date(),
        prompt: text,
        metadata: {
          voice,
          trimSilence,
        }
      });
      
      toast.success('Voiceover generated and saved successfully!');
    } catch (error) {
      console.error('Error generating voiceover:', error);
      toast.error('Failed to generate voiceover', {
        description: error instanceof Error ? error.message : 'An error occurred while generating the voiceover.',
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
      id: `voiceover-${Date.now()}`,
      trackId: TRACK_IDS.VOICEOVER,
      start: 0,
      duration: 5,
      type: 'audio',
      name: `Voiceover: ${text.substring(0, 15)}${text.length > 15 ? '...' : ''}`,
      color: 'bg-purple-400/70',
      src: generatedAudio,
      volume: 1,
    };
    
    onAddToTimeline(newAudioItem);
    toast.success('Voiceover added to timeline', {
      description: 'Added to Voiceover Track'
    });
  };

  const downloadAudio = () => {
    if (!generatedAudio) return;
    
    const a = document.createElement('a');
    a.href = generatedAudio;
    a.download = `voiceover_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
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
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <Label htmlFor="voice-text" className="text-xs text-[#F7F8F6]">Text</Label>
        <Textarea
          id="voice-text"
          placeholder="Enter text for voiceover..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-24 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>
      
      <div className="space-y-2">
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
          </SelectContent>
        </Select>
      </div>
      
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
      
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !text.trim()}
        className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300 text-sm h-8"
      >
        {isGenerating ? (
          <span className="animate-pulse">Generating...</span>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Generate Voiceover
          </>
        )}
      </Button>
      
      {generatedAudio && (
        <div className="mt-3 space-y-2">
          <div 
            className="flex items-center gap-2 bg-editor-panel/50 p-2 rounded cursor-move group relative"
            draggable
            onDragStart={(e) => {
              const item = {
                id: `voiceover-${Date.now()}`,
                type: 'audio',
                name: `Voiceover: ${text.substring(0, 15)}${text.length > 15 ? '...' : ''}`,
                src: generatedAudio,
                duration: '5:00'
              };
              
              e.dataTransfer.setData('application/json', JSON.stringify(item));
              
              // Create custom drag image
              const dragImage = document.createElement('div');
              dragImage.classList.add('p-2', 'bg-editor-panel', 'rounded', 'shadow-lg', 'text-white', 'border', 'border-white/20');
              dragImage.style.width = '120px';
              dragImage.style.opacity = '0.8';
              dragImage.textContent = item.name;
              document.body.appendChild(dragImage);
              
              e.dataTransfer.setDragImage(dragImage, 60, 30);
              
              // Clean up
              setTimeout(() => {
                document.body.removeChild(dragImage);
              }, 0);
            }}
          >
            <button
              className="p-1 bg-editor-hover rounded-full flex-shrink-0"
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

            <GripVertical className="w-4 h-4 text-white/40 group-hover:text-white/90 transition-colors ml-1" />
            
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Drag to timeline
            </div>
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

export default VoiceoverGenerator;
