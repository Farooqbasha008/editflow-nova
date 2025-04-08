/** @jsxImportSource react */
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Send, Copy, Download, Sparkles, User, Bot, Settings, Loader2, X, ChevronRight, ChevronLeft, Sliders, Clock, Film, Play, Pencil } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { saveProject } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import third-party integrations
import { generateVideo } from '../lib/falai';
import { generateSound, generateSpeech as generateElevenLabsSpeech } from '../lib/elevenlabs';
import { generateSpeech as generateGroqSpeech } from '../lib/groq';

// Default model to use for script generation
const DEFAULT_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface VideoScriptParams {
  prompt: string;
  numScenes: number;
  style: string;
  voiceover: boolean;
  music: string;
  characters: string;
  restrictions: string;
}

interface ScriptScene {
  sceneNumber: number;
  setting: string;
  textToVideoPrompt: string;
  voiceoverPrompt: string;
  backgroundMusicPrompt: string;
}

interface VideoGenerationOptions {
  duration?: number;
  width?: number;
  height?: number;
  negativePrompt?: string;
}

interface GeneratedScript {
  title: string;
  logline: string;
  style: string;
  duration: string;
  scriptSummary: string;
  scenes: ScriptScene[];
  script?: string;
}

interface VideoDetails {
  title: string;
  logline: string;
  style: string;
  duration: string;
  scriptSummary: string;
  scenes: ScriptScene[];
  script?: string;
}

const VideoGeneration: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hi there! I can help you create a video. Describe your story, desired duration, and any specific style preferences. The more details you provide, the better the result will be!',
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  // Video script parameters
  const [scriptParams, setScriptParams] = useState<VideoScriptParams>({
    prompt: '',
    numScenes: 6,
    style: 'Cinematic',
    voiceover: true,
    music: 'Ambient',
    characters: '',
    restrictions: ''
  });
  
  // Additional state variables for API keys and generation process
  const [falaiApiKey, setFalaiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState('');
  
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  // UI state
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'settings' | 'script'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Create system message
  const createSystemMessage = (): Message => ({
    role: 'system',
    content: `I'm a highly advanced AI assistant specialized in professional short video script generation. I'll help you create a structured, production-ready video script with ${scriptParams.numScenes} scenes, each lasting 5 seconds. Let's start by discussing your video concept.`,
    timestamp: new Date()
  });
  
  // Add system message when component mounts
  useEffect(() => {
    const systemMessage = createSystemMessage();
    
    // Only set the system message if we don't already have the welcome message
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([systemMessage, ...messages]);
    } else if (messages.length === 0) {
      setMessages([systemMessage]);
    }
  }, [scriptParams.numScenes, messages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load environment variables for API keys
  useEffect(() => {
    const falaiKey = import.meta.env.VITE_FALAI_API_KEY;
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const elevenlabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (falaiKey) setFalaiApiKey(falaiKey);
    if (groqKey) setGroqApiKey(groqKey);
    if (elevenlabsKey) setElevenlabsApiKey(elevenlabsKey);
    
    // Initialize with system message
    const systemMessage = createSystemMessage();
    setMessages([systemMessage]);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);
  
  // Load API keys from localStorage
  useEffect(() => {
    const savedGroqApiKey = localStorage.getItem('groq_api_key');
    const savedFalaiApiKey = localStorage.getItem('falai_api_key');
    const savedSupabaseUrl = localStorage.getItem('supabase_url');
    const savedSupabaseKey = localStorage.getItem('supabase_key');
    
    // Load saved API keys from localStorage
    if (savedGroqApiKey) {
      setApiKey(savedGroqApiKey);
      setGroqApiKey(savedGroqApiKey);
    } else {
      setShowApiKeyInput(true);
      setSidebarTab('settings');
    }

    if (savedFalaiApiKey) {
      setFalaiApiKey(savedFalaiApiKey);
    }
    
    if (savedSupabaseUrl) {
      setSupabaseUrl(savedSupabaseUrl);
    }
    
    if (savedSupabaseKey) {
      setSupabaseKey(savedSupabaseKey);
    }
  }, []);
  
  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      localStorage.setItem('groq_api_key', apiKey);
      setShowApiKeyInput(false);
      toast.success('API keys saved');
      setSidebarTab('chat');
    } else {
      toast.error('Please enter a valid Groq API key');
      return;
    }
    
    // Save FAL.ai API key if provided
    if (falaiApiKey.trim()) {
      localStorage.setItem('falai_api_key', falaiApiKey);
    }
    
    // Save Supabase credentials if provided
    if (supabaseUrl.trim()) {
      localStorage.setItem('supabase_url', supabaseUrl);
    }
    
    if (supabaseKey.trim()) {
      localStorage.setItem('supabase_key', supabaseKey);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
  };
  
  const handleScriptParamChange = (key: keyof VideoScriptParams, value: any) => {
    setScriptParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSubmit = async () => {
    if (!inputMessage.trim()) return;
    
    if (!apiKey) {
      setSidebarTab('settings');
      toast.error('Please enter your Groq API key');
      return;
    }
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    
    // Import the generateChatResponse function from the groq.ts file
    const { generateChatResponse } = await import('@/lib/groq');
    
    // Create the system prompt
    const systemPrompt = `You are a highly advanced AI assistant specialized in professional short video script generation. Your role is Cinematic Director & Video Production Specialist with expert-level knowledge (Level 280) in screenwriting, scene structure, cinematic pacing, and AI content generation. You are designed to generate exactly ${scriptParams.numScenes} scenes for a video, each lasting 5 seconds.

You create structured, production-ready video scripts suitable for text-to-video and audio generation models. Your output format must follow a strict JSON schema, with clear instructions for visuals, sound design, music, and concise dialogue. You must ensure all content is vivid, animatable, and logically sequenced.

OBJECTIVE:
Generate a professional short video script with the following goals:
- Divide the video into exactly ${scriptParams.numScenes} scenes (5 seconds per scene, no more, no less)
- Include vivid visual prompts suitable for text-to-video AI generation
- Add sound effect descriptions for each scene
- Suggest fitting background music for each scene
- Write concise, emotionally impactful dialogue (deliverable in 5 seconds)
- Maintain logical flow between scenes
- Avoid any content that is hard to animate or visualize

OUTPUT FORMAT (STRICT JSON SCHEMA):
{
  "title": "The title of the video",
  "logline": "A one-sentence summary of the video",
  "style": "${scriptParams.style}",
  "duration": "Total duration in seconds (e.g., ${scriptParams.numScenes * 5} seconds for ${scriptParams.numScenes} scenes)",
  "scriptSummary": "Optional short paragraph summary of the full video concept",
  "scenes": [
    {
      "sceneNumber": 1,
      "setting": "INT/EXT. LOCATION - TIME",
      "textToVideoPrompt": "Detailed visual prompt for AI video generation. Must include scene setting, camera angle, lighting, atmosphere, characters, and action.",
      "voiceoverPrompt": "Exact dialogue line or narration with voice style suggestions (if needed)",
      "backgroundMusicPrompt": "Description of music genre, instruments, intensity, mood, and transition notes"
    }
    // repeat for each scene until sceneNumber == ${scriptParams.numScenes}
  ]
}

FEATURES TO FOLLOW:
- Each scene must have:
  - A vivid text-to-video prompt with visual richness (camera shots, mood, environment)
  - A voiceover prompt, only if applicable, written to fit within 5 seconds
  - A music prompt tailored to the scene's tone
- Ensure scene-to-scene transitions are smooth and narratively cohesive
- Do not exceed or fall short of the exact scene count
- Do not include ambiguous or hard-to-visualize concepts
- Optimize descriptions for compatibility with AI video generation tools (e.g., Runway, Sora, Pika)
- Use cinematic and descriptive language with precision and emotion

PROMPT INPUT PARAMETERS FROM USER:
- prompt: ${scriptParams.prompt || inputMessage}
- numScenes: ${scriptParams.numScenes}
- style: ${scriptParams.style}
- voiceover: ${scriptParams.voiceover ? 'Yes' : 'No'}
- music: ${scriptParams.music}
- characters: ${scriptParams.characters}
- restrictions: ${scriptParams.restrictions}

REASONING RULES:
- Use narrative logic to ensure smooth scene flow
- Calculate speech duration to ensure 5-second dialogue fits naturally
- Align sound design and music with emotional tone and visual content
- Be aware of visual generative model limitations and avoid abstract or unrenderable prompts`;
    
    // Prepare conversation history for the API call
    const chatMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    // Send the message and get the response using Groq
    const assistantResponse = await generateChatResponse(
      [...chatMessages, { role: 'user', content: inputMessage }],
      apiKey,
      systemPrompt,
      { model: DEFAULT_MODEL }
    );
    
    // Check if the response contains a JSON script
    try {
      // Look for JSON in the response
      const jsonMatch = assistantResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        assistantResponse.match(/```([\s\S]*?)```/) ||
                        assistantResponse.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        const cleanedJson = jsonString.replace(/```json|```/g, '').trim();
        const scriptData = JSON.parse(cleanedJson);
        setGeneratedScript(scriptData);
        setSidebarTab('script');
      }
    } catch (jsonError) {
      console.error('Failed to parse JSON from response:', jsonError);
      // Continue with normal message handling even if JSON parsing fails
    }
    
    // Add assistant response to chat
    const assistantMessage: Message = {
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
    setIsTyping(false);
  };
  
  const handleGenerateScript = async () => {
    try {
      // No need to hide script params as they're now in the sidebar
      
      // Import the generateChatResponse function from the groq.ts file
      const { generateChatResponse } = await import('@/lib/groq');
      
      // Create the system prompt
      const systemPrompt = `You are a highly advanced AI assistant specialized in professional short video script generation. Your role is Cinematic Director & Video Production Specialist with expert-level knowledge (Level 280) in screenwriting, scene structure, cinematic pacing, and AI content generation. You are designed to generate exactly ${scriptParams.numScenes} scenes for a video, each lasting 5 seconds.

You create structured, production-ready video scripts suitable for text-to-video and audio generation models. Your output format must follow a strict JSON schema, with clear instructions for visuals, sound design, music, and concise dialogue. You must ensure all content is vivid, animatable, and logically sequenced.

OBJECTIVE:
Generate a professional short video script with the following goals:
- Divide the video into exactly ${scriptParams.numScenes} scenes (5 seconds per scene, no more, no less)
- Include vivid visual prompts suitable for text-to-video AI generation
- Add sound effect descriptions for each scene
- Suggest fitting background music for each scene
- Write concise, emotionally impactful dialogue (deliverable in 5 seconds)
- Maintain logical flow between scenes
- Avoid any content that is hard to animate or visualize

OUTPUT FORMAT (STRICT JSON SCHEMA):
{
  "title": "The title of the video",
  "logline": "A one-sentence summary of the video",
  "style": "${scriptParams.style}",
  "duration": "Total duration in seconds (e.g., ${scriptParams.numScenes * 5} seconds for ${scriptParams.numScenes} scenes)",
  "scriptSummary": "Optional short paragraph summary of the full video concept",
  "scenes": [
    {
      "sceneNumber": 1,
      "setting": "INT/EXT. LOCATION - TIME",
      "textToVideoPrompt": "Detailed visual prompt for AI video generation. Must include scene setting, camera angle, lighting, atmosphere, characters, and action.",
      "voiceoverPrompt": "Exact dialogue line or narration with voice style suggestions (if needed)",
      "backgroundMusicPrompt": "Description of music genre, instruments, intensity, mood, and transition notes"
    }
    // repeat for each scene until sceneNumber == ${scriptParams.numScenes}
  ]
}

FEATURES TO FOLLOW:
- Each scene must have:
  - A vivid text-to-video prompt with visual richness (camera shots, mood, environment)
  - A voiceover prompt, only if applicable, written to fit within 5 seconds
  - A music prompt tailored to the scene's tone
- Ensure scene-to-scene transitions are smooth and narratively cohesive
- Do not exceed or fall short of the exact scene count
- Do not include ambiguous or hard-to-visualize concepts
- Optimize descriptions for compatibility with AI video generation tools (e.g., Runway, Sora, Pika)
- Use cinematic and descriptive language with precision and emotion

PROMPT INPUT PARAMETERS FROM USER:
- prompt: ${scriptParams.prompt || inputMessage}
- numScenes: ${scriptParams.numScenes}
- style: ${scriptParams.style}
- voiceover: ${scriptParams.voiceover ? 'Yes' : 'No'}
- music: ${scriptParams.music}
- characters: ${scriptParams.characters}
- restrictions: ${scriptParams.restrictions}

REASONING RULES:
- Use narrative logic to ensure smooth scene flow
- Calculate speech duration to ensure 5-second dialogue fits naturally
- Align sound design and music with emotional tone and visual content
- Be aware of visual generative model limitations and avoid abstract or unrenderable prompts`;
      
      // Prepare conversation history for the API call
      const chatMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Send the message and get the response using Groq
      const assistantResponse = await generateChatResponse(
        [...chatMessages, { role: 'user', content: inputMessage }],
        apiKey,
        systemPrompt,
        { model: DEFAULT_MODEL }
      );
      
      // Check if the response contains a JSON script
      try {
        // Look for JSON in the response
        const jsonMatch = assistantResponse.match(/```json\n([\s\S]*?)\n```/) || 
                          assistantResponse.match(/```([\s\S]*?)```/) ||
                          assistantResponse.match(/{[\s\S]*}/);
        
        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          const cleanedJson = jsonString.replace(/```json|```/g, '').trim();
          const scriptData = JSON.parse(cleanedJson);
          setGeneratedScript(scriptData);
          setSidebarTab('script');
        }
      } catch (jsonError) {
        console.error('Failed to parse JSON from response:', jsonError);
        // Continue with normal message handling even if JSON parsing fails
      }
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      toast.error('Failed to get response from Groq');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };
  const handleGenerateVideo = async () => {
    try {
      if (!generatedScript) {
        throw new Error('Script is not available');
      }
      
      if (!falaiApiKey || !groqApiKey || !elevenlabsApiKey) {
        const missingKeys = [];
        if (!falaiApiKey) missingKeys.push('Fal.ai');
        if (!groqApiKey) missingKeys.push('Groq');
        if (!elevenlabsApiKey) missingKeys.push('ElevenLabs');
        
        const errorMessage: Message = {
          role: 'assistant',
          content: `You're missing the following API keys required for video generation: ${missingKeys.join(', ')}. \n\nYou can still use the generated script, but you'll need to add the missing API keys to generate the complete video.`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        setSidebarTab('settings');
        return;
      }
      
      setIsLoading(true);
      setGenerationStep('video');
      setGenerationProgress(0);
      
      const processingMessage: Message = {
        role: 'assistant',
        content: `Generating a ${generatedScript.duration} video based on the confirmed script...\n\nStep 1/3: Generating video scenes...`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      setGenerationStep('video');
      const videoUrls: Record<number, string> = {};
      
      for (let i = 0; i < generatedScript.scenes.length; i++) {
        const scene = generatedScript.scenes[i];
        setGenerationProgress((i / generatedScript.scenes.length) * 33);
        
        const videoUrl = await generateVideo(scene.textToVideoPrompt, falaiApiKey, {
          duration: 5,
          width: 512,
          height: 512,
          negativePrompt: 'blurry, low quality, distorted faces'
        });
        
        videoUrls[scene.sceneNumber] = videoUrl;
      }
      
      setGenerationProgress(33);
      
      const videoCompleteMessage: Message = {
        role: 'assistant',
        content: `Step 1/3: Video scenes generated!\n\nStep 2/3: Creating voiceovers using Groq's advanced text-to-speech technology...`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, videoCompleteMessage]);
      
      setGenerationStep('speech');
      const audioUrls: Record<string, string> = {};
      
      for (let i = 0; i < generatedScript.scenes.length; i++) {
        const scene = generatedScript.scenes[i];
        setGenerationProgress(33 + (i / generatedScript.scenes.length) * 33);
        
        if (scene.voiceoverPrompt) {
          const key = `scene${scene.sceneNumber}_voiceover`;
          
          const speechUrl = await generateGroqSpeech(scene.voiceoverPrompt, groqApiKey, {
            voiceId: 'nova'
          });
          
          audioUrls[key] = speechUrl;
        }
      }
      
      setGenerationProgress(66);
      
      const speechCompleteMessage: Message = {
        role: 'assistant',
        content: `Step 2/3: Voiceovers created with Groq!\n\nStep 3/3: Adding sound effects and background music using ElevenLabs...`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, speechCompleteMessage]);
      
      setGenerationStep('sound');
      
      for (let i = 0; i < generatedScript.scenes.length; i++) {
        const scene = generatedScript.scenes[i];
        setGenerationProgress(66 + (i / generatedScript.scenes.length) * 34);
        
        if (scene.backgroundMusicPrompt) {
          const bgmKey = `scene${scene.sceneNumber}_bgm`;
          const bgmUrl = await generateSound(scene.backgroundMusicPrompt, elevenlabsApiKey, {
            type: 'bgm',
            duration: 10
          });
          
          audioUrls[bgmKey] = bgmUrl;
        }
      }
      
      setGenerationProgress(100);
      const completionMessage: Message = {
        role: 'assistant',
        content: 'Your video has been generated! You can now preview it, edit it further, or download it.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, completionMessage]);
      
      // Complete the generation process
      setIsLoading(false);
      setGenerationStep('');
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Failed to generate video');
      setIsLoading(false);
      setGenerationStep('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };
  
  const downloadScript = () => {
    if (!generatedScript) return;
    
    const scriptJson = JSON.stringify(generatedScript, null, 2);
    const blob = new Blob([scriptJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedScript.title.replace(/\s+/g, '_')}_script.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Script downloaded');
  };
  
  const saveToSupabase = async () => {
    if (!generatedScript) return;
    
    if (!supabaseUrl || !supabaseKey) {
      toast.error('Supabase credentials required', {
        description: 'Please enter your Supabase URL and key in the settings',
      });
      setSidebarTab('settings');
      return;
    }
    
    try {
      toast.info('Saving project to Supabase...');
      
      await saveProject({
        title: generatedScript.title,
        script: generatedScript,
        timestamp: new Date().toISOString(),
      }, supabaseUrl, supabaseKey);
      
      toast.success('Project saved to Supabase');
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      toast.error('Failed to save project', {
        description: error instanceof Error ? error.message : 'An error occurred while saving the project.',
      });
    }
  };
  
  const formatMessage = (content: string) => {
    // Replace JSON code blocks with formatted display
    return content.replace(/```json([\s\S]*?)```|```([\s\S]*?)```/g, (match, jsonContent, codeContent) => {
      const content = jsonContent || codeContent || '';
      // Add syntax highlighting class for JSON content
      const isJson = jsonContent || match.includes('```json');
      return `<pre class="${isJson ? 'language-json' : ''} bg-gray-800 p-3 rounded-md overflow-x-auto my-2"><code>${content}</code></pre>`;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#0E0E0E]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1A1A1A]">
        <div className="flex items-center">
          <Link to="/" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-[#D7F266]">Video Script Generator</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-white/70 hover:text-white md:hidden"
          >
            {showSidebar ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarTab('settings')}
            className="text-white/70 hover:text-white"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area - Always visible */}
        <div className={cn(
          "flex-1 flex flex-col h-full transition-all duration-300",
          showSidebar ? "md:mr-80" : ""
        )}>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.filter(m => m.role !== 'system').map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-3 max-w-[85%]">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-[#1E1E1E] flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-5 w-5 text-[#D7F266]" />
                      </div>
                    )}
                    
                    <div 
                      className={`rounded-lg p-3 ${message.role === 'user' 
                        ? 'bg-[#D7F266] text-[#151514]' 
                        : 'bg-[#1E1E1E] text-[#F7F8F6] border border-white/10'}`}
                    >
                      <div 
                        className="prose prose-sm dark:prose-invert" 
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-[#D7F266] flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-5 w-5 text-[#151514]" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1E1E1E] flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-5 w-5 text-[#D7F266]" />
                    </div>
                    <div className="max-w-[85%] rounded-lg p-3 bg-[#1E1E1E] text-[#F7F8F6] border border-white/10">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-[#D7F266] animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-[#D7F266] animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 rounded-full bg-[#D7F266] animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-[#1A1A1A]">
            <div className="max-w-3xl mx-auto">
              {showApiKeyInput ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groq-api-key">Groq API Key</Label>
                    <Input 
                      id="groq-api-key"
                      type="password" 
                      placeholder="Enter your Groq API key" 
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-[#0E0E0E] border-white/20"
                    />
                    <p className="text-xs text-[#F7F8F6]/60">
                      Your API key is stored locally and never sent to our servers.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="falai-api-key">FAL.ai API Key</Label>
                    <Input 
                      id="falai-api-key"
                      type="password" 
                      placeholder="Enter your FAL.ai API key" 
                      value={falaiApiKey} 
                      onChange={(e) => setFalaiApiKey(e.target.value)}
                      className="bg-[#0E0E0E] border-white/20"
                    />
                  </div>
                  <Button 
                    onClick={handleApiKeySubmit}
                    className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                  >
                    Save API Keys
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2 items-end">
                  <div className="relative flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="min-h-[60px] max-h-[200px] resize-none pr-12 bg-[#0E0E0E] border-white/20 rounded-xl focus-visible:ring-[#D7F266] text-white"
                    />
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isLoading || !inputMessage.trim()}
                      className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSidebarTab('chat')}
                    className="h-10 w-10 rounded-xl border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
                  >
                    <Sliders className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div 
          className={cn(
            "fixed inset-y-0 right-0 w-full md:w-80 border-l border-white/10 bg-[#1A1A1A] p-4 overflow-y-auto transition-transform duration-300 ease-in-out z-20",
            showSidebar ? "translate-x-0" : "translate-x-full",
            "mt-[64px]" // Header height
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as any)} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="chat" className="text-sm">Parameters</TabsTrigger>
                <TabsTrigger value="script" className="text-sm">Script</TabsTrigger>
                <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-white">Video Concept</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe your video concept..."
                      value={scriptParams.prompt}
                      onChange={(e) => handleScriptParamChange('prompt', e.target.value)}
                      className="min-h-[100px] bg-[#0E0E0E] border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="numScenes" className="text-white">Number of Scenes ({scriptParams.numScenes})</Label>
                    <Slider
                      id="numScenes"
                      min={1}
                      max={12}
                      step={1}
                      value={[scriptParams.numScenes]}
                      onValueChange={(value) => handleScriptParamChange('numScenes', value[0])}
                      className="py-1"
                    />
                    <p className="text-xs text-[#F7F8F6]/60">
                      Total duration: {scriptParams.numScenes * 5} seconds
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="style" className="text-white">Video Style</Label>
                    <Select 
                      value={scriptParams.style} 
                      onValueChange={(value) => handleScriptParamChange('style', value)}
                    >
                      <SelectTrigger id="style" className="bg-[#0E0E0E] border-white/20 text-white">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cinematic">Cinematic</SelectItem>
                        <SelectItem value="Animated">Animated</SelectItem>
                        <SelectItem value="Documentary">Documentary</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Vlog">Vlog</SelectItem>
                        <SelectItem value="Tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="voiceover" className="text-white">Include Voiceover</Label>
                      <Switch
                        id="voiceover"
                        checked={scriptParams.voiceover}
                        onCheckedChange={(checked) => handleScriptParamChange('voiceover', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="music" className="text-white">Music Style</Label>
                    <Select 
                      value={scriptParams.music} 
                      onValueChange={(value) => handleScriptParamChange('music', value)}
                    >
                      <SelectTrigger id="music" className="bg-[#0E0E0E] border-white/20 text-white">
                        <SelectValue placeholder="Select music style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ambient">Ambient</SelectItem>
                        <SelectItem value="Upbeat">Upbeat</SelectItem>
                        <SelectItem value="Dramatic">Dramatic</SelectItem>
                        <SelectItem value="Inspirational">Inspirational</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Electronic">Electronic</SelectItem>
                        <SelectItem value="Acoustic">Acoustic</SelectItem>
                        <SelectItem value="None">No Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="characters" className="text-white">Characters (Optional)</Label>
                    <Input
                      id="characters"
                      placeholder="E.g. John: male narrator, Sarah: customer"
                      value={scriptParams.characters}
                      onChange={(e) => handleScriptParamChange('characters', e.target.value)}
                      className="bg-[#0E0E0E] border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="restrictions" className="text-white">Restrictions (Optional)</Label>
                    <Input
                      id="restrictions"
                      placeholder="E.g. no outdoor scenes, family-friendly"
                      value={scriptParams.restrictions}
                      onChange={(e) => handleScriptParamChange('restrictions', e.target.value)}
                      className="bg-[#0E0E0E] border-white/20 text-white"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key-settings" className="text-white">Groq API Key</Label>
                    <Input 
                      id="api-key-settings"
                      type="password" 
                      placeholder="Enter your Groq API key" 
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-[#0E0E0E] border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="falai-api-key-settings" className="text-white">FAL.ai API Key</Label>
                    <Input 
                      id="falai-api-key-settings"
                      type="password" 
                      placeholder="Enter your FAL.ai API key" 
                      value={falaiApiKey} 
                      onChange={(e) => setFalaiApiKey(e.target.value)}
                      className="bg-[#0E0E0E] border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supabase-url" className="text-white">Supabase URL</Label>
                    <Input 
                      id="supabase-url"
                      type="text" 
                      placeholder="Enter your Supabase URL" 
                      value={supabaseUrl} 
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="bg-[#0E0E0E] border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supabase-key" className="text-white">Supabase API Key</Label>
                    <Input 
                      id="supabase-key"
                      type="password" 
                      placeholder="Enter your Supabase API key" 
                      value={supabaseKey} 
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="bg-[#0E0E0E] border-white/20 text-white"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleApiKeySubmit}
                    className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                  >
                    Save Settings
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="script" className="space-y-6">
                {generatedScript ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">Generated Script</h2>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => copyToClipboard(JSON.stringify(generatedScript, null, 2))}
                          className="h-8 w-8 border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={downloadScript}
                          className="h-8 w-8 border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={saveToSupabase}
                          className="h-8 w-8 border-white/20 text-white hover:text-[#D7F266] hover:border-[#D7F266]"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-white">{generatedScript.title}</h3>
                        <p className="text-xs text-white/70">{generatedScript.logline}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-white">Style: {generatedScript.style}</h4>
                        <h4 className="text-xs font-medium text-white">Duration: {generatedScript.duration}</h4>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-white">Summary</h4>
                        <p className="text-xs text-white/70">{generatedScript.scriptSummary}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-white">Scenes</h4>
                        {generatedScript.scenes.map((scene, index) => (
                          <div key={index} className="p-2 rounded bg-[#0E0E0E] border border-white/10">
                            <h5 className="text-xs font-medium text-white mb-1">Scene {scene.sceneNumber}: {scene.setting}</h5>
                            <div className="space-y-1">
                              <p className="text-xs text-white/70"><span className="text-[#D7F266]">Visual:</span> {scene.textToVideoPrompt}</p>
                              {scene.voiceoverPrompt && (
                                <p className="text-xs text-white/70"><span className="text-[#D7F266]">Voice:</span> {scene.voiceoverPrompt}</p>
                              )}
                              <p className="text-xs text-white/70"><span className="text-[#D7F266]">Music:</span> {scene.backgroundMusicPrompt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-white/50">
                    <p>No script generated yet</p>
                    <p className="text-xs mt-2">Start a conversation to generate a script</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;