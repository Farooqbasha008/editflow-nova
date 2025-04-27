
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const generateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate a video');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      // For demonstration purposes, we'll simulate video generation
      // In a real implementation, this would call an API to generate a video
      
      toast.info('Starting video generation', {
        description: 'This may take a few moments...',
        duration: 5000,
      });

      // Simulate progress updates
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(interval);
      setProgress(100);

      // Sample video (using a placeholder)
      const videoId = `generated-${Date.now()}`;
      const newItem: TimelineItem = {
        id: videoId,
        trackId: 'video-1',
        start: 0,
        duration: 10,
        type: 'video',
        name: `Generated from: ${prompt.slice(0, 20)}${prompt.length > 20 ? '...' : ''}`,
        color: '#6366F1',
        src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
      };

      onAddToTimeline(newItem);
      
      toast.success('Video generation complete', {
        description: 'Video has been added to your timeline'
      });
      
      setPrompt('');
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Failed to generate video', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">Describe the video you want to generate</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A serene lake surrounded by mountains at sunset..."
          className="h-24 bg-[#151514] border-white/20 focus:border-[#D7F266]"
        />
      </div>
      
      {generating && (
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-[#D7F266] h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <Button 
        onClick={generateVideo} 
        className="w-full bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80"
        disabled={generating || !prompt.trim()}
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Video className="mr-2 h-4 w-4" />
            Generate Video
          </>
        )}
      </Button>
      
      <div className="text-xs text-white/60 text-center">
        Note: This is a placeholder implementation. In a full version, 
        this would connect to an AI video generation service.
      </div>
    </div>
  );
};

export default VideoGenerator;
