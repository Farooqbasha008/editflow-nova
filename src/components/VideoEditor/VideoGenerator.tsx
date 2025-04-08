<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Video, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TimelineItem } from './VideoEditor';
=======

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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAddToTimeline }) => {
<<<<<<< HEAD
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [duration, setDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  
  // Get the API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('video_gen_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleGenerate = async () => {
=======
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateVideo = async () => {
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
<<<<<<< HEAD
    
    if (!apiKey) {
      toast.error('API key is missing', {
        description: 'Please add your API key in the settings',
      });
=======

    if (!apiKey.trim()) {
      toast.error('Please enter your Fal.ai API key');
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
      return;
    }

    setIsGenerating(true);
<<<<<<< HEAD
    toast.info('Generating video...', {
      description: 'This might take a few moments'
    });

    try {
      // In a real implementation, this would call an API to generate a video
      // For now, we'll simulate the API call with a placeholder
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate a generated video URL
      // In a real implementation, this would be the URL of the generated video
      const videoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      
      setGeneratedVideo(videoUrl);
      toast.success('Video generated successfully!');
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Failed to generate video', {
        description: error instanceof Error ? error.message : 'An error occurred while generating the video.',
=======

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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
      });
    } finally {
      setIsGenerating(false);
    }
  };

<<<<<<< HEAD
  const handleAddToTimeline = () => {
    if (!generatedVideo) return;
    
    const newVideoItem: TimelineItem = {
      id: `video-${Date.now()}`,
      trackId: 'track1', // First video track
      start: 0,
      duration: duration, // Use the selected duration
      type: 'video',
      name: `AI Generated: ${prompt.substring(0, 15)}${prompt.length > 15 ? '...' : ''}`,
      color: 'bg-blue-400/70',
      src: generatedVideo,
      thumbnail: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Video',
    };
    
    onAddToTimeline(newVideoItem);
    toast.success('Video added to timeline', {
      description: `Added to Video Track 1`
    });
  };

  const downloadVideo = () => {
    if (!generatedVideo) return;
    
    // Create a temporary anchor element to download the video
    const a = document.createElement('a');
    a.href = generatedVideo;
    a.download = `generated_video_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Video download started');
  };

  const saveApiKey = (key: string) => {
    if (key.trim()) {
      localStorage.setItem('video_gen_api_key', key);
      setApiKey(key);
      toast.success('API key saved');
    }
  };

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-xs text-[#F7F8F6]">Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Describe what you want to see in the video..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-20 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="style" className="text-xs text-[#F7F8F6]">Style</Label>
        <Select value={style} onValueChange={setStyle}>
          <SelectTrigger id="style" className="bg-transparent border-white/20 text-white focus:ring-[#D7F266]">
            <SelectValue placeholder="Select a style" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
            <SelectItem value="Cinematic" className="focus:bg-[#D7F266]/20 focus:text-white">Cinematic</SelectItem>
            <SelectItem value="Documentary" className="focus:bg-[#D7F266]/20 focus:text-white">Documentary</SelectItem>
            <SelectItem value="Animation" className="focus:bg-[#D7F266]/20 focus:text-white">Animation</SelectItem>
            <SelectItem value="Vintage" className="focus:bg-[#D7F266]/20 focus:text-white">Vintage</SelectItem>
            <SelectItem value="Futuristic" className="focus:bg-[#D7F266]/20 focus:text-white">Futuristic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="duration" className="text-xs text-[#F7F8F6]">Duration: {duration}s</Label>
        </div>
        <Slider
          id="duration"
          min={3}
          max={15}
          step={1}
          value={[duration]}
          onValueChange={(value) => setDuration(value[0])}
          className="py-1"
        />
      </div>
      
      {!apiKey && (
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs text-[#F7F8F6]">API Key</Label>
          <div className="flex space-x-2">
            <input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
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
        disabled={isGenerating || !prompt.trim()}
        className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
      >
        {isGenerating ? (
          <>
            <span className="animate-pulse mr-2">Generating...</span>
          </>
        ) : (
          <>
            <Video className="h-4 w-4 mr-2" />
            Generate Video
          </>
        )}
      </Button>
      
      {generatedVideo && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Preview</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadVideo}
                className="h-8 border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddToTimeline}
                className="h-8 border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Timeline
              </Button>
            </div>
          </div>
          
          <video 
            controls 
            src={generatedVideo} 
            className="w-full h-48 object-cover rounded-md bg-black/50"
          />
        </div>
      )}
=======
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
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
    </div>
  );
};

<<<<<<< HEAD
export default VideoGenerator;
=======
export default VideoGenerator;
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
