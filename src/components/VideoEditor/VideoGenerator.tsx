import React, { useState, useCallback } from 'react';
import { Sparkles, Video, Download, Plus, Settings2, AlertCircle, RefreshCcw, Clock, BookOpen, Plus as PlusIcon, Copy as CopyIcon, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { fal } from "@fal-ai/client";
import VideoGeneratorErrorBoundary from './VideoGeneratorErrorBoundary';

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

interface TextToVideoOutput {
  seed: number;
  nsfw_content_detected: boolean;
  image: string;
}

interface GenerationSettings {
  prompt: string;
  model: ModelId;
  duration: number;
  fps: number;
  quality: number;
  creativity: number;
  enableUpscale: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const isValidApiKey = (key: string) => {
  // FAL AI keys are always 64 characters long
  return /^[a-zA-Z0-9]{64}$/.test(key);
};

// Model options with their parameters
const VIDEO_MODELS = {
  'lcm-sd15-i2v': {
    id: '110602490-lcm-sd15-i2v',
    name: 'LCM Text to Video',
    description: 'Fast and stable text-to-video generation',
    maxFrames: 50,
    minFrames: 8,
    defaultFps: 8
  },
  'sdxl-turbo-i2v': {
    id: '110602490-sdxl-turbo-i2v',
    name: 'SDXL Turbo',
    description: 'High-quality video generation with SDXL',
    maxFrames: 24,
    minFrames: 4,
    defaultFps: 16
  }
} as const;

const PROMPT_TEMPLATES = [
  {
    name: 'Cinematic Scene',
    prompt: 'A cinematic [scene description], shot with shallow depth of field, dramatic lighting, camera movement from [direction], [time of day], [weather/atmosphere]',
  },
  {
    name: 'Character Animation',
    prompt: 'A [character description] performing [action], smooth fluid motion, detailed facial expressions, [emotion], [lighting setup], [environment]',
  },
  {
    name: 'Abstract Animation',
    prompt: 'Abstract [shapes/elements] morphing and flowing, [color scheme], [movement type], [mood/atmosphere], artistic animation style',
  },
  {
    name: 'Nature Scene',
    prompt: 'A beautiful [natural environment] with [weather conditions], [time of day], dynamic movement of [elements], photorealistic style',
  }
] as const;

const KEYBOARD_SHORTCUTS = {
  GENERATE: ['Control+Enter', 'Meta+Enter'],
  TOGGLE_SETTINGS: ['Control+/', 'Meta+/'],
  SAVE_TO_TIMELINE: ['Control+s', 'Meta+s'],
  COPY_SETTINGS: ['Control+Shift+c', 'Meta+Shift+c'],
} as const;

type ModelId = keyof typeof VIDEO_MODELS;

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [apiKey, setApiKey] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quality, setQuality] = useState(50); // 1-100 scale for num_inference_steps
  const [creativity, setCreativity] = useState(12.5); // guidance_scale
  const [enableUpscale, setEnableUpscale] = useState(false);
  const [duration, setDuration] = useState(3); // Duration in seconds
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isValidKey, setIsValidKey] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('lcm-sd15-i2v');
  const [fps, setFps] = useState<number>(VIDEO_MODELS['lcm-sd15-i2v'].defaultFps);
  const [promptHistory, setPromptHistory] = useState<Array<{ prompt: string; timestamp: number }>>(() => {
    const saved = localStorage.getItem('prompt_history');
    return saved ? JSON.parse(saved) : [];
  });

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error('Failed to play video:', err);
        toast.error('Failed to play video');
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Load API key from localStorage
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('fal_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsValidKey(isValidApiKey(savedApiKey));
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    setIsValidKey(isValidApiKey(newKey));
  };

  const saveApiKey = (key: string) => {
    if (key.trim() && isValidApiKey(key)) {
      localStorage.setItem('fal_api_key', key);
      setApiKey(key);
      setIsValidKey(true);
      toast.success('API key saved');
    } else {
      toast.error('Invalid API key format', {
        description: 'Please enter a valid 64-character FAL AI API key'
      });
    }
  };

  const handleModelChange = (modelId: ModelId) => {
    setSelectedModel(modelId);
    setFps(VIDEO_MODELS[modelId].defaultFps as number);
    // Adjust duration limits based on model
    const maxDuration = Math.floor(VIDEO_MODELS[modelId].maxFrames / VIDEO_MODELS[modelId].defaultFps);
    if (duration > maxDuration) {
      setDuration(maxDuration);
    }
  };

  const addToPromptHistory = useCallback((prompt: string) => {
    const newHistory = [
      { prompt, timestamp: Date.now() },
      ...promptHistory.filter(h => h.prompt !== prompt).slice(0, 9) // Keep last 10 unique prompts
    ];
    setPromptHistory(newHistory);
    localStorage.setItem('prompt_history', JSON.stringify(newHistory));
  }, [promptHistory]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy prompt');
    }
  };

  const shareSettings = async () => {
    const settings: GenerationSettings = {
      prompt,
      model: selectedModel,
      duration,
      fps,
      quality,
      creativity,
      enableUpscale
    };

    try {
      const settingsString = btoa(JSON.stringify(settings));
      await navigator.clipboard.writeText(settingsString);
      toast.success('Settings copied to clipboard', {
        description: 'Share this code with others to reproduce your results'
      });
    } catch (err) {
      toast.error('Failed to copy settings');
    }
  };

  const loadSharedSettings = (settingsString: string) => {
    try {
      const settings: GenerationSettings = JSON.parse(atob(settingsString));
      setPrompt(settings.prompt);
      setSelectedModel(settings.model);
      setDuration(settings.duration);
      setFps(Number(settings.fps));
      setQuality(settings.quality);
      setCreativity(settings.creativity);
      setEnableUpscale(settings.enableUpscale);
      toast.success('Settings loaded successfully');
    } catch (err) {
      toast.error('Invalid settings code');
    }
  };

  const handleGenerate = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setRetryCount(0);
      setError(null);
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt for the video');
      return;
    }

    if (!apiKey || !isValidKey) {
      toast.error('Invalid FAL AI API key', {
        description: 'Please enter a valid API key in the settings'
      });
      return;
    }

    setIsGenerating(true);
    setProgressMessage('Starting generation...');

    try {
      fal.config({ credentials: apiKey });

      const model = VIDEO_MODELS[selectedModel];
      const totalFrames = Math.min(duration * fps, model.maxFrames);

      const result = await fal.subscribe(model.id, {
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, low quality, distorted faces, bad anatomy, worst quality, watermark',
          num_frames: totalFrames,
          width: enableUpscale ? 768 : 512,
          height: enableUpscale ? 768 : 512,
          num_inference_steps: Math.floor((quality / 100) * 100) + 25, // Map 1-100 to 25-125 steps
          guidance_scale: creativity,
          fps: fps,
          seed: Math.floor(Math.random() * 1000000),
          scheduler: "euler_discrete"
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const latestMessage = update.logs[update.logs.length - 1]?.message;
            if (latestMessage) {
              setProgressMessage(latestMessage);

              // Try to extract frame information
              const frameMatch = latestMessage.match(/frame (\d+)/i);
              if (frameMatch) {
                const frameCount = parseInt(frameMatch[1]);
                const newProgress = Math.min(100, Math.round((frameCount / totalFrames) * 100));
                setProgress(newProgress);
              }

              if (latestMessage.includes('Generating frame')) {
                setProgressMessage(`Generating video: ${Math.round((totalFrames / model.maxFrames) * 100)}%`);
              }
            }
          } else if (update.status === "COMPLETED") {
            setProgress(100);
            setProgressMessage('Finalizing video...');
          } else if (update.status === "IN_QUEUE") {
            setProgressMessage('Waiting in queue...');
          }
        },
      });

      if (result.data?.video_url) {
        setGeneratedVideo(result.data.video_url);
        toast.success('Video generated successfully!');
        setError(null);
        setRetryCount(0);
        addToPromptHistory(prompt); // Save successful prompt
      } else {
        throw new Error('No video URL in response');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the video';
      setError(errorMessage);

      if (retryCount < MAX_RETRIES) {
        toast.error('Generation failed, retrying...', {
          description: `Attempt ${retryCount + 1} of ${MAX_RETRIES}`,
        });
        setRetryCount(prev => prev + 1);
        setTimeout(() => handleGenerate(true), RETRY_DELAY);
      } else {
        toast.error('Failed to generate video', {
          description: errorMessage,
        });
      }
    } finally {
      if (retryCount >= MAX_RETRIES || !error) {
        setIsGenerating(false);
        setProgressMessage('');
        setProgress(0);
        setCurrentFrame(null);
      }
    }
  }, [prompt, apiKey, isValidKey, duration, enableUpscale, quality, creativity, retryCount, error, selectedModel, fps, addToPromptHistory]);

  const handleAddToTimeline = () => {
    if (!generatedVideo) return;

    const newVideoItem: TimelineItem = {
      id: `generated-video-${Date.now()}`,
      trackId: 'video-track',
      start: 0,
      duration: duration, // Use actual generated duration
      type: 'video',
      name: `AI Video: ${prompt.substring(0, 15)}${prompt.length > 15 ? '...' : ''}`,
      color: 'bg-green-400/70',
      src: generatedVideo,
      thumbnail: generatedVideo,
      volume: 1,
    };

    onAddToTimeline(newVideoItem);
    toast.success('Video added to timeline', {
      description: 'Added to Video Track'
    });
  };

  const applyTemplate = (template: string) => {
    setPrompt(template);
  };

  // Add keyboard shortcut handlers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrCmd && e.key === 'Enter' && !isGenerating && prompt.trim() && apiKey) {
        e.preventDefault();
        void handleGenerate();
      }

      if (ctrlOrCmd && e.key === '/' && !isGenerating) {
        e.preventDefault();
        setShowAdvanced(prev => !prev);
      }

      if (ctrlOrCmd && !e.shiftKey && e.key.toLowerCase() === 's' && generatedVideo) {
        e.preventDefault();
        handleAddToTimeline();
      }

      if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        void shareSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate, prompt, apiKey, isGenerating, generatedVideo, shareSettings]);

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <Label htmlFor="model-select" className="text-xs text-[#F7F8F6]">Model</Label>
        <Select value={selectedModel} onValueChange={(value: ModelId) => handleModelChange(value)}>
          <SelectTrigger id="model-select" className="bg-transparent border-white/20 text-white focus:ring-[#D7F266]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-white/20">
            {Object.entries(VIDEO_MODELS).map(([id, model]) => (
              <SelectItem key={id} value={id} className="text-white hover:bg-white/5">
                <div className="flex flex-col">
                  <span>{model.name}</span>
                  <span className="text-xs text-white/60">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="video-prompt" className="text-xs text-[#F7F8F6]">
            Video Description
            <span className="ml-2 text-[#F7F8F6]/40">
              Press {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+Enter to generate
            </span>
          </Label>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-[#1A1A1A] border-white/20">
                {PROMPT_TEMPLATES.map((template) => (
                  <DropdownMenuItem
                    key={template.name}
                    onClick={() => applyTemplate(template.prompt)}
                    className="flex flex-col items-start p-2 focus:bg-white/5"
                  >
                    <span className="font-medium text-white">{template.name}</span>
                    <span className="text-xs text-white/60 mt-1">{template.prompt}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  History
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-[#1A1A1A] border-white/20">
                {promptHistory.length > 0 ? (
                  promptHistory.map(({ prompt: historyPrompt, timestamp }) => (
                    <DropdownMenuItem
                      key={timestamp}
                      onClick={() => setPrompt(historyPrompt)}
                      className="flex flex-col items-start p-2 focus:bg-white/5"
                    >
                      <span className="text-xs text-white line-clamp-2">{historyPrompt}</span>
                      <span className="text-xs text-white/60 mt-1">
                        {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString()}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-white/60">No prompt history yet</div>
                )}
                {promptHistory.length > 0 && (
                  <DropdownMenuItem
                    onClick={() => {
                      setPromptHistory([]);
                      localStorage.removeItem('prompt_history');
                      toast.success('Prompt history cleared');
                    }}
                    className="flex items-center justify-center p-2 text-xs text-red-400 hover:text-red-300 focus:bg-white/5"
                  >
                    Clear History
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={copyPrompt}
            >
              <CopyIcon className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={shareSettings}
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
          </div>
        </div>
        <Textarea
          id="video-prompt"
          placeholder="Describe the video you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-24 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            placeholder="Paste settings code here..."
            className="flex-1 h-7 px-2 text-xs rounded-md bg-transparent border border-white/20 text-white/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D7F266]"
            onPaste={async (e) => {
              e.preventDefault();
              const text = e.clipboardData.getData('text');
              loadSharedSettings(text);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-[#D7F266]"
            onClick={() => {
              const settingsCode = window.prompt('Enter settings code:');
              if (settingsCode) loadSharedSettings(settingsCode);
            }}
          >
            Load Settings
          </Button>
        </div>
      </div>

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between p-2 hover:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={14} />
              <span className="text-xs">Advanced Settings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">{showAdvanced ? 'Hide' : 'Show'}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 rounded-md border border-white/20">
                {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+/
              </kbd>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="duration" className="text-xs text-[#F7F8F6]">Duration</Label>
              <span className="text-xs text-[#F7F8F6]/60">{duration}s ({Math.min(duration * fps, VIDEO_MODELS[selectedModel].maxFrames)} frames)</span>
            </div>
            <Slider
              id="duration"
              min={1}
              max={Math.floor(VIDEO_MODELS[selectedModel].maxFrames / fps)}
              step={1}
              value={[duration]}
              onValueChange={([value]) => setDuration(value)}
              className="w-full"
            />
            <p className="text-xs text-[#F7F8F6]/60">
              Maximum frames: {VIDEO_MODELS[selectedModel].maxFrames} at {fps} FPS
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="fps" className="text-xs text-[#F7F8F6]">Frames per Second</Label>
              <span className="text-xs text-[#F7F8F6]/60">{fps} FPS</span>
            </div>
            <Slider
              id="fps"
              min={4}
              max={30}
              step={1}
              value={[fps]}
              onValueChange={([value]) => setFps(value)}
              className="w-full"
            />
            <p className="text-xs text-[#F7F8F6]/60">Higher FPS results in smoother video</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quality" className="text-xs text-[#F7F8F6]">Quality</Label>
              <span className="text-xs text-[#F7F8F6]/60">{quality}%</span>
            </div>
            <Slider
              id="quality"
              min={1}
              max={100}
              step={1}
              value={[quality]}
              onValueChange={([value]) => setQuality(value)}
              className="w-full"
            />
            <p className="text-xs text-[#F7F8F6]/60">Higher quality takes longer to generate</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="creativity" className="text-xs text-[#F7F8F6]">Creativity</Label>
              <span className="text-xs text-[#F7F8F6]/60">{creativity.toFixed(1)}</span>
            </div>
            <Slider
              id="creativity"
              min={1}
              max={20}
              step={0.1}
              value={[creativity]}
              onValueChange={([value]) => setCreativity(value)}
              className="w-full"
            />
            <p className="text-xs text-[#F7F8F6]/60">Higher values follow the prompt more strictly</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="upscale"
              checked={enableUpscale}
              onCheckedChange={setEnableUpscale}
            />
            <Label htmlFor="upscale" className="text-xs text-[#F7F8F6] cursor-pointer">
              Generate at higher resolution (768x768)
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {!apiKey && (
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs text-[#F7F8F6]">FAL AI API Key</Label>
          <div className="flex space-x-2">
            <input
              id="api-key"
              type="password"
              placeholder="Enter your FAL AI API key"
              className={`flex-1 h-9 px-3 py-2 text-xs rounded-md bg-transparent border text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D7F266] ${isValidKey ? "border-green-500/50" : "border-white/20"}`}
              onChange={handleApiKeyChange}
              value={apiKey}
            />
            <Button 
              onClick={() => saveApiKey(apiKey)}
              disabled={!isValidKey}
              className={`h-9 px-3 py-2 text-xs ${isValidKey ? "bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]" : "bg-white/10 text-white/50"}`}
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-[#F7F8F6]/60">
            Enter your FAL AI API key. It should be 64 characters long.
          </p>
        </div>
      )}

      {error && retryCount >= MAX_RETRIES && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={() => void handleGenerate()}
              className="ml-2 h-auto p-0 text-xs text-red-400 hover:text-red-300"
            >
              <RefreshCcw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={() => void handleGenerate()}
        disabled={isGenerating || !prompt.trim() || !apiKey}
        className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300 text-sm h-8"
      >
        {isGenerating ? (
          <div className="w-full">
            <div className="flex items-center justify-center mb-2">
              <span className="animate-pulse">{progressMessage || 'Generating...'}</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Video
          </div>
        )}
      </Button>

      {generatedVideo && (
        <div className="space-y-2 mt-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={generatedVideo}
              className="w-full h-full object-contain"
              playsInline
              loop
              onEnded={() => setIsPlaying(false)}
              onError={() => toast.error('Error loading video')}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlayback}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => {
                const a = document.createElement('a');
                a.href = generatedVideo;
                a.download = `ai-video-${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toast.success('Downloading video');
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/5 rounded-md border border-white/20">
                {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+S
              </kbd>
              <Button
                onClick={handleAddToTimeline}
                size="sm"
                className="text-xs bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to Timeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VideoGeneratorWithErrorBoundary: React.FC<VideoGeneratorProps> = (props) => (
  <VideoGeneratorErrorBoundary>
    <VideoGenerator {...props} />
  </VideoGeneratorErrorBoundary>
);

export { VideoGeneratorWithErrorBoundary as default };