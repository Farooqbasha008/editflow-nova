import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description for the video');
      return;
    }

    setIsGenerating(true);
    setProgressMessage('Starting generation...');

    try {
      const result = await fal.subscribe('110602490-wan-2.1-text2video-1.3b', {
        input: {
          prompt: prompt,
          num_frames: 81,
          width: 576,
          height: 320,
          fps: 16
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const latestMessage = update.logs[update.logs.length - 1]?.message;
            if (latestMessage) {
              setProgressMessage(latestMessage);
              const frameMatch = latestMessage.match(/frame (\d+)/i);
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
        <div className="flex items-center justify-between">
          <Label htmlFor="video-prompt" className="text-xs text-[#F7F8F6]">
            Describe your video
            <span className="ml-2 text-[#F7F8F6]/40">
              Press {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+Enter to generate
            </span>
          </Label>
        </div>
        <Textarea
          id="video-prompt"
          placeholder="Describe what you want to see in your 5 second video..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-24 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-[#F7F8F6]/60">{progressMessage}</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generatedVideo && !isGenerating && (
        <div className="space-y-2">
          <video 
            src={generatedVideo} 
            controls 
            loop
            className="w-full rounded-lg"
          />
          <Button onClick={handleAddToTimeline} className="w-full">
            Add to Timeline
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;