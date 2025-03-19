
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { TimelineItem } from './VideoEditor';
import { generateImage } from '@/lib/huggingface';
import { getOptimizedParams } from '@/lib/groq';

interface ImageGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [steps, setSteps] = useState(30);
  const [cfg, setCfg] = useState(7.5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  
  // Get the API key from environment variables
  useEffect(() => {
    const hfApiKey = import.meta.env.VITE_HF_API_KEY;
    if (hfApiKey) {
      setApiKey(hfApiKey);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    if (!apiKey) {
      toast.error('API key is missing', {
        description: 'Please add your Hugging Face API key to the .env file (VITE_HF_API_KEY)',
      });
      return;
    }

    setIsGenerating(true);
    toast.info('Generating image...', {
      description: 'This might take a few moments'
    });

    try {
      // Use the Hugging Face API to generate an image
      const imageUrl = await generateImage(prompt, apiKey, {
        negativePrompt,
        steps,
        cfgScale: cfg,
        // You can specify a different model here if needed
        // model: 'stabilityai/sdxl-turbo'
      });
      
      setGeneratedImage(imageUrl);
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image', {
        description: error instanceof Error ? error.message : 'An error occurred while communicating with the AI model.',
      });
      
      // Fallback to dummy image if API fails
      const dummyImageUrl = await generateDummyImage();
      setGeneratedImage(dummyImageUrl);
    } finally {
      setIsGenerating(false);
    }
  };

  // Dummy function to generate a placeholder image
  const generateDummyImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create a gradient based on the prompt to simulate different images
        const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = hash % 360;
        
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 70%, 40%)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Add some visual elements to make it look more interesting
        ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 512;
          const size = 20 + Math.random() * 100;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    });
  };

  const handleAddToTimeline = () => {
    if (!generatedImage) return;
    
    const newImageItem: TimelineItem = {
      id: `image-${Date.now()}`,
      trackId: 'track1', // First video track
      start: 0,
      duration: 5, // Default 5 seconds duration for images
      type: 'image',
      name: `AI Generated: ${prompt.substring(0, 15)}${prompt.length > 15 ? '...' : ''}`,
      color: 'bg-green-400/70',
      src: generatedImage,
      thumbnail: generatedImage,
    };
    
    onAddToTimeline(newImageItem);
    toast.success('Image added to timeline', {
      description: `Added to Video Track 1`
    });
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `generated_image_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Image download started');
  };

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-xs text-[#F7F8F6]">Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Describe what you want to see in the image..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-20 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="negative-prompt" className="text-xs text-[#F7F8F6]">Negative Prompt</Label>
        <Textarea
          id="negative-prompt"
          placeholder="What you don't want to see in the image..."
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          className="h-16 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#D7F266]"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="steps" className="text-xs text-[#F7F8F6]">Steps: {steps}</Label>
        </div>
        <Slider


          id="steps"
          min={1}
          max={50}
          step={1}
          value={[steps]}
          onValueChange={(value) => setSteps(value[0])}
          className="py-1"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="cfg" className="text-xs text-[#F7F8F6]">CFG Scale: {cfg}</Label>
        </div>
        <Slider
          id="cfg"
          min={1}
          max={15}
          step={0.1}
          value={[cfg]}
          onValueChange={(value) => setCfg(value[0])}
          className="py-1"
        />
      </div>
      
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300 text-sm h-8"
      >
        {isGenerating ? 'Generating...' : 'Generate Image'}
      </Button>
      
      {!apiKey && (
        <div className="text-xs text-amber-400 mt-1">
          ⚠️ Please add your Hugging Face API key to the .env file (VITE_HF_API_KEY)
        </div>
      )}
      
      {generatedImage && (
        <div className="mt-3 space-y-2">
          <div className="border border-white/10 rounded overflow-hidden">
            <img 
              src={generatedImage} 
              alt="Generated image" 
              className="w-full h-auto" 
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddToTimeline}
              className="flex-1 h-8 text-xs bg-editor-panel border border-white/20 hover:bg-editor-hover text-[#F7F8F6]"
              variant="outline"
            >
              <Plus size={14} className="mr-1" /> Add to Timeline
            </Button>
            <Button
              size="sm"
              onClick={downloadImage}
              className="h-8 w-8 bg-editor-panel border border-white/20 hover:bg-editor-hover"
              variant="outline"
            >
              <Download size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
