import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Video, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { generateVideo } from '@/lib/falai';
import { generatedMediaDB } from '@/lib/db';

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [falaiApiKey, setFalaiApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('falai_api_key');
    if (savedApiKey) {
      setFalaiApiKey(savedApiKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (falaiApiKey.trim()) {
      localStorage.setItem('falai_api_key', falaiApiKey);
      setShowApiKeyInput(false);
      toast.success('API key saved successfully');
    } else {
      toast.error('Please enter a valid API key');
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate a video');
      return;
    }

    if (!falaiApiKey) {
      setShowApiKeyInput(true);
      toast.error('Fal.ai API key not found', {
        description: 'Please add your Fal.ai API key to continue.',
      });
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      toast.info('Starting video generation', {
        description: 'This may take a few moments...',
        duration: 5000,
      });

      // Update progress to show we're starting
      setProgress(10);

      // Generate video using fal.ai
      const videoUrl = await generateVideo(prompt, falaiApiKey, {
        duration: 5,
        negativePrompt: 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting'
      });

      if (!videoUrl) {
        throw new Error('Failed to generate video: No URL returned');
      }

      // Update progress to show completion
      setProgress(100);

      // Generate a unique ID for the video
      const videoId = `generated-${Date.now()}`;
      
      // Create a thumbnail URL (using the first frame of the video)
      const thumbnailUrl = videoUrl.replace('.mp4', '.jpg');

      // Save to IndexedDB
      await generatedMediaDB.addMedia({
        name: `Generated from: ${prompt.slice(0, 20)}${prompt.length > 20 ? '...' : ''}`,
        type: 'video',
        src: videoUrl,
        dateCreated: new Date(),
        prompt: prompt,
        metadata: {
          thumbnail: thumbnailUrl,
          duration: 5 // Default duration from fal.ai
        }
      });

      const newItem: TimelineItem = {
        id: videoId,
        trackId: 'video-1',
        start: 0,
        duration: 5, // Default duration from fal.ai
        type: 'video',
        name: `Generated from: ${prompt.slice(0, 20)}${prompt.length > 20 ? '...' : ''}`,
        color: '#6366F1',
        src: videoUrl,
        thumbnail: thumbnailUrl
      };

      onAddToTimeline(newItem);
      
      toast.success('Video generation complete', {
        description: 'Video has been added to your timeline and saved to your library'
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
      {showApiKeyInput ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="falai-api-key">Fal.ai API Key</Label>
            <Input
              id="falai-api-key"
              type="password"
              value={falaiApiKey}
              onChange={(e) => setFalaiApiKey(e.target.value)}
              placeholder="Enter your Fal.ai API key"
              className="bg-[#151514] border-white/20 focus:border-[#D7F266]"
            />
            <p className="text-xs text-white/60">
              Get your API key from{' '}
              <a
                href="https://fal.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D7F266] hover:underline"
              >
                fal.ai
              </a>
            </p>
          </div>
          <Button
            onClick={handleSaveApiKey}
            disabled={!falaiApiKey.trim()}
            className="w-full bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80"
          >
            Save API Key
          </Button>
        </div>
      ) : (
        <>
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
            onClick={handleGenerateVideo} 
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
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">
              Powered by fal.ai - Generate high-quality videos from text descriptions
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeyInput(true)}
              className="text-white/60 hover:text-white"
            >
              <Settings className="h-4 w-4 mr-1" />
              API Key
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoGenerator;
