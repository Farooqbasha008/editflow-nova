import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { fal } from "@fal-ai/client";

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

// Fal.ai API types based on their documentation
interface FalQueueUpdate {
  status: 'IN_PROGRESS' | 'COMPLETED' | 'IN_QUEUE' | 'FAILED';
  queue_position?: number;
  logs?: Array<{ message: string }>;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [useEnhancedPrompt, setUseEnhancedPrompt] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  // Load API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('falai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Enhance prompt with cinematic terms
  const enhancePrompt = (userPrompt: string): string => {
    let enhanced = userPrompt.trim();

    if (!enhanced.toLowerCase().includes("cinematic")) {
      enhanced += ", cinematic 8K quality";
    }

    if (!enhanced.toLowerCase().includes("lighting")) {
      enhanced += ", professional lighting";
    }

    return enhanced + ", highly detailed, sharp focus";
  };

  // Update enhanced prompt when prompt changes
  useEffect(() => {
    if (prompt && useEnhancedPrompt) {
      const enhanced = enhancePrompt(prompt);
      setEnhancedPrompt(enhanced);
    } else {
      setEnhancedPrompt(prompt);
    }
  }, [prompt, useEnhancedPrompt]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!apiKey) {
      toast.error('FAL.ai API key is required');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgressMessage('Initializing...');
    setProgress(0);

    try {
      fal.config({ credentials: apiKey });

      const result = await fal.subscribe('fal-ai/wan/v2.1/1.3b/text-to-video', {
        input: {
          prompt: useEnhancedPrompt ? enhancedPrompt : prompt,
          negative_prompt: 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting, poor composition, bad framing',
          num_inference_steps: 30, // Increased for better quality
          guidance_scale: 12.5, // Increased for stronger adherence to prompt
          seed: Math.floor(Math.random() * 1000000),
          enable_safety_checker: true,
          enable_prompt_expansion: true, // Enable to get better results
          sampler: "dpm++", // Using the allowed dpm++ sampler
        },
        pollInterval: 5000,
        onQueueUpdate(update: FalQueueUpdate) {
          if (update.status === "IN_PROGRESS") {
            setProgressMessage('Generating video...');
            // Their logs contain message like "50/100 steps"
            if (update.logs?.length > 0) {
              const lastLog = update.logs[update.logs.length - 1];
              const progressMatch = lastLog.message.match(/(\d+)\/(\d+)\s*steps/i);
              if (progressMatch) {
                const [_, current, total] = progressMatch;
                const percent = Math.round((parseInt(current) / parseInt(total)) * 100);
                setProgress(percent);
              } else {
                setProgress(prev => Math.min(95, prev + 5));
              }
            }
          } else if (update.status === "COMPLETED") {
            setProgress(100);
            setProgressMessage('Finalizing video...');
          } else if (update.status === "IN_QUEUE") {
            setProgressMessage(`Waiting in queue... Position: ${update.queue_position ?? 'N/A'}`);
            setProgress(0);
          }
        },
      });

      // The WAN model returns a data array where the first item is the video URL
      const videoUrl = Array.isArray(result) && result.length > 0 
        ? (typeof result[0] === 'string' ? result[0] : result[0]?.url)
        : null;

      if (!videoUrl || typeof videoUrl !== 'string') {
        console.warn('Unexpected response format:', result);
        throw new Error('Unable to find video URL in the response');
      }

      setGeneratedVideo(videoUrl);
      toast.success('Video generated successfully!');
      localStorage.setItem('falai_api_key', apiKey);

    } catch (error) {
      console.error('Error generating video:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating the video';
      setError(errorMessage);
      toast.error('Failed to generate video', {
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
      setProgressMessage('');
      setProgress(0);
    }
  };

  const handleAddToTimeline = () => {
    if (!generatedVideo) return;

    const newVideoItem: TimelineItem = {
      id: `generated-video-${Date.now()}`,
      trackId: 'video-track',
      start: 0,
      duration: 5,
      type: 'video',
      name: `AI Video: ${prompt.substring(0, 15)}${prompt.length > 15 ? '...' : ''}`,
      color: 'bg-green-400/70',
      src: generatedVideo,
      thumbnail: generatedVideo,
      volume: 1,
    };

    onAddToTimeline(newVideoItem);
    toast.success('Video added to timeline');
  };

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <div className="space-y-2">
          <Label htmlFor="falai-api-key" className="text-xs text-[#F7F8F6]">
            FAL.ai API Key
          </Label>
          <input
            id="falai-api-key"
            type="password"
            placeholder="Enter your FAL.ai API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full h-9 px-3 py-2 text-xs rounded-md bg-[#0E0E0E] border border-white/20 text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D7F266]"
          />
          <p className="text-[10px] text-[#F7F8F6]/60">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="video-prompt" className="text-xs text-[#F7F8F6]">
            Describe your video
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="enhance-prompt"
                checked={useEnhancedPrompt}
                onCheckedChange={setUseEnhancedPrompt}
                className="data-[state=checked]:bg-[#D7F266]"
              />
              <Label htmlFor="enhance-prompt" className="text-xs text-[#F7F8F6] cursor-pointer">
                Enhance prompt
              </Label>
            </div>
            {generatedVideo && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAddToTimeline}
                className="h-7 px-2 text-xs border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
              >
                Add to Timeline
              </Button>
            )}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="h-7 px-2 text-xs bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
              <Sparkles className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
        
        <Textarea
          id="video-prompt"
          placeholder="A beautiful sunset over a mountain range..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[80px] max-h-[160px] resize-none bg-[#0E0E0E] border-white/20 text-white text-xs"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(isGenerating || progressMessage) && (
        <div className="space-y-2">
          <div className="text-xs text-[#F7F8F6]/70">{progressMessage}</div>
          <Progress value={progress} />
        </div>
      )}

      {generatedVideo && (
        <div className="relative aspect-video bg-black rounded-md overflow-hidden">
          <video 
            src={generatedVideo} 
            className="w-full h-full" 
            controls 
            loop 
            autoPlay 
            muted 
          />
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;