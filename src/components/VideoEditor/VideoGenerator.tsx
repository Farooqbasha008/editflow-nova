import React, { useState, useEffect } from 'react';
import { Sparkles, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { fal } from "@fal-ai/client";

// Initialize fal client settings
try {
  // Check client version
  console.log("Using fal client version:", (fal as any).version || "unknown");
  
  // Set connection timeout
  fal.config({
    requestOptions: {
      timeout: 300000 // 5 minute timeout
    }
  });
} catch (error) {
  console.error("Failed to initialize fal client:", error);
}

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

interface FalQueueUpdate {
  status: 'IN_PROGRESS' | 'COMPLETED' | 'IN_QUEUE' | 'FAILED';
  queue_position?: number;
  logs?: Array<{ message: string }>;
}

interface FalVideoResponse {
  artifacts?: Array<{
    url?: string;
  }>;
  video?: {
    url: string;
  };
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
  const [debuggingInfo, setDebuggingInfo] = useState<string | null>(null);

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

    // API key validation removed to support different key formats

    setIsGenerating(true);
    setError(null);
    setProgressMessage('Initializing...');
    setProgress(0);

    let subscription;
    try {
      // Configure the client with the API key
      fal.config({
        credentials: apiKey
      });

      // Clean the prompt to remove control characters
      const cleanedPrompt = (useEnhancedPrompt ? enhancedPrompt : prompt).replace(/\n/g, ' ').replace(/\t/g, ' ');

      // Use the latest model version
      subscription = await fal.subscribe('fal-ai/wan/v2.1/1.3b/text-to-video', {
        input: {
          prompt: cleanedPrompt,
          negative_prompt: 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting',
          num_inference_steps: 30,
          guidance_scale: 7,
          seed: Math.floor(Math.random() * 1000000),
          aspect_ratio: "16:9",
          sampler: "unipc",
          shift: 5
        },
        pollInterval: 5000,
        logs: true,
        onQueueUpdate(update: FalQueueUpdate) {
          if (update.status === "IN_PROGRESS") {
            setProgressMessage('Generating video...');
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
          } else if (update.status === "FAILED") {
            setProgressMessage('Generation failed');
            let failReason = 'Video generation failed. Please try again.';
            if (update.logs && update.logs.length > 0) {
              const relevantLogs = update.logs.slice(-3).map(log => log.message).join('\n');
              console.error('Fal.ai Generation Failed Logs:', relevantLogs);
              failReason = `Video generation failed. Logs: ${relevantLogs.substring(0, 100)}${relevantLogs.length > 100 ? '...' : ''}`;
            }
            setError(failReason);
          }
        },
      });

      // Keep the subscription alive until we get a result
      const result = await new Promise<FalVideoResponse>((resolve, reject) => {
        const timeout = setTimeout(() => {
          subscription?.unsubscribe();
          reject(new Error('Video generation timed out after 5 minutes'));
        }, 300000); // 5 minute timeout

        subscription.onError((error) => {
          clearTimeout(timeout);
          console.error('Subscription error:', error);
          reject(error instanceof Error ? error : new Error(String(error)));
        });

        subscription.onComplete((result) => {
          clearTimeout(timeout);
          if (!result) {
            reject(new Error('Empty result received from FAL.ai'));
            return;
          }
          
          // Log the full response to understand its structure
          console.log('FAL.ai response:', JSON.stringify(result, null, 2));
          
          resolve(result as FalVideoResponse);
        });
      });

      // First try to access the video URL using the documentation format
      let videoUrl = result.video?.url;
      
      // If that fails, try the artifacts array format from the existing code
      if (!videoUrl && result.artifacts && result.artifacts.length > 0) {
        videoUrl = result.artifacts[0]?.url;
      }
      
      // If that fails too, check if "data" contains the URL (some API versions use this)
      if (!videoUrl && (result as any).data?.video?.url) {
        videoUrl = (result as any).data.video.url;
      }
      
      if (!videoUrl) {
        console.error('Could not find video URL in response:', result);
        throw new Error('No video URL found in the response. Please try again.');
      }

      setGeneratedVideo(videoUrl);
      toast.success('Video generated successfully!');
      
      // Only save valid API key after successful generation
      localStorage.setItem('falai_api_key', apiKey);

    } catch (error) {
      console.error('Error generating video:', error);
      let errorMessage = 'An error occurred while generating the video';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Invalid or expired API key. Please check your FAL.ai API key in settings.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Access denied. Your API key may not have permission to use this service.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request timed out. The service might be experiencing high load.';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Store detailed debugging information
      setDebuggingInfo(JSON.stringify(error, Object.getOwnPropertyNames(error)));
      setError(errorMessage);
      toast.error('Failed to generate video', {
        description: errorMessage,
      });
    } finally {
      if (subscription) {
        subscription.unsubscribe();
      }
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

  const handleDragStart = (e: React.DragEvent) => {
    if (!generatedVideo) return;
    
    const item = {
      id: `generated-video-${Date.now()}`,
      type: 'video',
      name: `AI Video: ${prompt.substring(0, 15)}${prompt.length > 15 ? '...' : ''}`,
      src: generatedVideo,
      thumbnail: generatedVideo,
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

      {debuggingInfo && (
        <details className="text-xs text-white/60 mt-2 bg-black/20 p-2 rounded">
          <summary className="cursor-pointer">Debug Information (click to expand)</summary>
          <div className="p-2 mt-1 bg-black/40 rounded max-h-32 overflow-auto">
            <pre>{debuggingInfo}</pre>
          </div>
        </details>
      )}

      {(isGenerating || progressMessage) && (
        <div className="space-y-2">
          <div className="text-xs text-[#F7F8F6]/70">{progressMessage}</div>
          <Progress value={progress} />
        </div>
      )}

      {generatedVideo && (
        <div 
          className="relative aspect-video bg-black rounded-md overflow-hidden group cursor-move"
          draggable
          onDragStart={handleDragStart}
        >
          <video 
            key={generatedVideo}
            src={generatedVideo} 
            className="w-full h-full object-contain" 
            controls 
            loop 
            playsInline
            autoPlay 
            muted 
            onError={(e) => {
              console.error('Video loading error:', e);
              setError('Error loading the generated video. Please try regenerating.');
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <GripVertical className="w-6 h-6 text-white" />
            <div className="absolute bottom-2 left-2 text-xs text-white">Drag to timeline</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;