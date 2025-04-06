
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { TimelineItem } from './VideoEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateVideo } from '@/lib/falai';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!apiKey.trim()) {
      toast.error('Please enter your Fal.ai API key');
      return;
    }

    setIsGenerating(true);

    try {
      toast.info('Generating video...', {
        description: 'This may take a minute or two.',
      });

      const videoUrl = await generateVideo(prompt, apiKey, {
        negativePrompt: negativePrompt || undefined
      });

      const newItem: TimelineItem = {
        id: uuidv4(),
        trackId: 'video-track-1',
        start: 0,
        duration: 10,
        type: 'video',
        name: `AI Video: ${prompt.substring(0, 20)}${prompt.length > 20 ? '...' : ''}`,
        color: '#D7F266',
        src: videoUrl,
        thumbnail: videoUrl,
      };

      onAddToTimeline(newItem);

      toast.success('Video generated successfully', {
        description: 'The video has been added to your timeline.',
      });

      setPrompt('');
    } catch (error) {
      console.error('Video generation failed:', error);
      toast.error('Video generation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex items-center mb-3">
        <Sparkles size={16} className="mr-2 text-[#D7F266]" />
        <h3 className="text-sm font-semibold text-white">Generate AI Video</h3>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <Label htmlFor="api-key">Fal.ai API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your Fal.ai API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-editor-panel border-white/10"
          />
          <p className="text-xs text-white/50 mt-1">
            Get your API key from <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#D7F266]">fal.ai dashboard</a>
          </p>
        </div>

        <div>
          <Label htmlFor="video-prompt">Prompt</Label>
          <Textarea
            id="video-prompt"
            placeholder="Describe the video you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-24 bg-editor-panel border-white/10 resize-none"
          />
        </div>

        <div>
          <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
          <Textarea
            id="negative-prompt"
            placeholder="What to avoid in the video..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="h-16 bg-editor-panel border-white/10 resize-none"
          />
        </div>
      </div>

      <Button
        onClick={handleGenerateVideo}
        disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
        className="w-full mt-3 bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300"
      >
        {isGenerating ? 'Generating...' : 'Generate Video'}
      </Button>
    </div>
  );
};

export default VideoGenerator;
