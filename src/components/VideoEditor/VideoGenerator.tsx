import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { fal } from "@fal-ai/client";
import { sceneGenerationRules } from '@/lib/videoGeneration';

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

// Default parameters based on fal.ai documentation
const DEFAULT_INFERENCE_STEPS = 30;
const DEFAULT_GUIDANCE_SCALE = 5;
const DEFAULT_SHIFT = 5;
const DEFAULT_SAMPLER = 'unipc';
const DEFAULT_WIDTH = 1024; // 16:9 aspect ratio
const DEFAULT_HEIGHT = 576;

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

  const enhancePrompt = (userPrompt: string) => {
    const guidelines = [
      // Main Subject & Action
      "- Using present continuous tense",
      "- Including specific details (age, clothing, expressions)",
      // Setting & Environment
      "- Detailed location description",
      "- Time of day and weather conditions",
      "- Lighting conditions and atmosphere",
      // Camera Perspective
      "- Specified shot type (medium/wide preferred)",
      "- Defined camera movement",
      "- Camera angle description",
      // Visual Style
      "- Color palette and tone",
      "- Visual effects or transitions",
      "- Cinematic quality reference"
    ];

    // Add cinematic best practices
    const dos = sceneGenerationRules.characters.do.concat(sceneGenerationRules.environments.do);
    const donts = sceneGenerationRules.characters.dont.concat(sceneGenerationRules.environments.dont);

    let enhanced = userPrompt.trim();

    // Add shot type if not specified
    if (!enhanced.toLowerCase().includes("shot")) {
      enhanced += ", medium shot";
    }

    // Add lighting if not specified
    if (!enhanced.toLowerCase().includes("light")) {
      enhanced += ", natural lighting";
    }

    // Add quality reference if not specified
    if (!enhanced.toLowerCase().includes("cinematic") && !enhanced.toLowerCase().includes("quality")) {
      enhanced += ", cinematic 8K quality";
    }

    // Add camera movement if not specified
    if (!enhanced.toLowerCase().includes("tracking") && !enhanced.toLowerCase().includes("panning") && !enhanced.toLowerCase().includes("static")) {
      enhanced += ", smooth tracking shot";
    }

    return enhanced;
  };

  useEffect(() => {
    if (prompt) {
      const enhanced = enhancePrompt(prompt);
      setEnhancedPrompt(enhanced);
    }
  }, [prompt]);

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
      // Configure fal client with API key
      fal.config({ credentials: apiKey });

      // Use the enhanced prompt if enabled
      const finalPrompt = useEnhancedPrompt ? enhancedPrompt : prompt;

      const result = await fal.subscribe('fal-ai/wan/v2.1/1.3b/text-to-video', {
        input: {
          prompt: finalPrompt,
          negative_prompt: 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting',
          num_inference_steps: DEFAULT_INFERENCE_STEPS,
          guidance_scale: DEFAULT_GUIDANCE_SCALE,
          sampler: DEFAULT_SAMPLER,
          shift: DEFAULT_SHIFT,
          enable_safety_checker: true,
          enable_prompt_expansion: false,
          seed: Math.floor(Math.random() * 1000000),
        },
        onQueueUpdate(update) {
          if (update.status === "IN_PROGRESS") {
            setProgressMessage('Generating video...');
            if (update.logs && update.logs.length > 0) {
              const lastLog = update.logs[update.logs.length - 1];
              // Updated progress calculation logic based on logs (assuming similar log format)
              // Note: The exact log message format might differ for the new model.
              // This regex attempts to find any progress indication like "step X/Y" or "frame X/Y".
              const progressMatch = lastLog.message.match(/(\d+)\/(\d+)/);
              if (progressMatch) {
                const currentStep = parseInt(progressMatch[1]);
                const totalSteps = parseInt(progressMatch[2]);
                // Use totalSteps from the log if available, otherwise use inference steps
                const estimatedTotal = totalSteps > 0 ? totalSteps : DEFAULT_INFERENCE_STEPS;
                const newProgress = Math.min(100, Math.round((currentStep / estimatedTotal) * 100));
                setProgress(newProgress);
              } else {
                // Fallback if specific progress log isn't found, increment slowly
                setProgress(prev => Math.min(95, prev + 1));
              }
            }
          } else if (update.status === "COMPLETED") {
            setProgress(100);
            setProgressMessage('Finalizing video...');
          } else if (update.status === "IN_QUEUE") {
            setProgressMessage(`Waiting in queue... Position: ${update.queue_position ?? 'N/A'}`);
            setProgress(0); // Reset progress when queued
          }
        },
      });

      // Check for video_uri instead of video_url in the response
      if (result?.data?.[0]) {
        setGeneratedVideo(result.data[0]);
        toast.success('Video generated successfully!');
        setError(null);
        // Save API key if successful
        localStorage.setItem('falai_api_key', apiKey);
      } else {
        // Log the actual result for debugging if the structure is different
        console.warn('Unexpected result structure from fal.ai:', result);
        throw new Error('No video found in the response from fal.ai.');
      }
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
      // Duration might need adjustment based on the actual generated video length
      // For now, keeping it fixed, but ideally, we'd get duration from the video metadata
      duration: 5, // Example duration, adjust as needed
      type: 'video',
      name: `AI Video: ${prompt.substring(0, 15)}${prompt.length > 15 ? '...' : ''}`,
      color: 'bg-green-400/70',
      src: generatedVideo,
      // Thumbnail might not be directly available; using video src for now
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
          <Input 
            id="falai-api-key"
            type="password" 
            placeholder="Enter your FAL.ai API key" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-[#0E0E0E] border-white/20 text-white text-xs"
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
        {useEnhancedPrompt && enhancedPrompt && (
          <div className="mt-2 p-2 rounded bg-[#1E1E1E] border border-white/10">
            <Label className="text-xs text-[#D7F266]">Enhanced Prompt:</Label>
            <p className="text-xs text-white/70 mt-1">{enhancedPrompt}</p>
          </div>
        )}
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