import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { fal } from "@fal-ai/client";

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState('');
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

      const result = await fal.subscribe('110602490-sd-video', {
        input: {
          prompt: prompt,
          negative_prompt: 'blurry, low quality, distorted faces',
          num_frames: 80,
          num_inference_steps: 30,
          guidance_scale: 12.5,
          seed: Math.floor(Math.random() * 1000000),
          width: 512,
          height: 512,
        },
        onQueueUpdate(update) {
          if (update.status === "IN_PROGRESS") {
            setProgressMessage('Generating video...');
            if (update.logs && update.logs.length > 0) {
              const lastLog = update.logs[update.logs.length - 1];
              const frameMatch = lastLog.message.match(/Processed frame (\d+)/);
              if (frameMatch) {
                const frameCount = parseInt(frameMatch[1]);
                const newProgress = Math.min(100, Math.round((frameCount / 81) * 100));
                setProgress(newProgress);
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
        // Save API key if successful
        localStorage.setItem('falai_api_key', apiKey);
      } else {
        throw new Error('No video URL in response');
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
          <div className="flex gap-2">
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