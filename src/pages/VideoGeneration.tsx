import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Send, Sparkles, Clock, Film, Loader2, Download, Play, ChevronRight, Pencil, Key, Video, Music, Mic } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

import { generateScript, GeneratedScript, ScriptScene } from '@/lib/gemini';
import { generateVideo, VideoGenerationOptions } from '@/lib/falai';
import { generateSpeech as generateElevenLabsSpeech } from '@/lib/elevenlabs';
import { generateSound } from '@/lib/elevenlabs';
import { generateSpeech as generateGroqSpeech } from '@/lib/groq';

interface VideoDetails {
  title: string;
  script: GeneratedScript;
  duration: number;
  style: string;
  videoUrl?: string;
  audioUrls?: Record<string, string>;
}

interface UserInputData {
  story: string;
  duration: number;
  style: string;
}

const VideoGeneration = () => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hi there! I can help you create a video. Describe your story, desired duration, and any specific style preferences. The more details you provide, the better the result will be!'
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [duration, setDuration] = useState(60); // Default 60 seconds
  const [style, setStyle] = useState('cinematic');
  const [generatedVideo, setGeneratedVideo] = useState<VideoDetails | null>(null);
  
  // User input collection state
  const [userInputData, setUserInputData] = useState<UserInputData | null>(null);
  const [inputCollectionStep, setInputCollectionStep] = useState<'story' | 'settings' | 'complete'>('story');
  
  // API Keys
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [falaiApiKey, setFalaiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState('');
  
  // Generation progress
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load API keys from environment variables
  useEffect(() => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const falaiKey = import.meta.env.VITE_FALAI_API_KEY;
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const elevenlabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (geminiKey) setGeminiApiKey(geminiKey);
    if (falaiKey) setFalaiApiKey(falaiKey);
    if (groqKey) setGroqApiKey(groqKey);
    if (elevenlabsKey) setElevenlabsApiKey(elevenlabsKey);
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);
    
    // Check if API keys are set
    if (!geminiApiKey) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Before we can generate your script, I need your Gemini API key. Please provide it in the API Keys section.'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsGenerating(false);
      setShowApiKeys(true);
      return;
    }
    
    // Check if all API keys are set for full video generation
    const hasAllKeys = geminiApiKey && falaiApiKey && groqApiKey && elevenlabsApiKey;
    if (!hasAllKeys && inputCollectionStep === 'complete') {
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Note: You only have the Gemini API key set. You can generate scripts, but you\'ll need to add the other API keys (Fal.ai, Groq, and ElevenLabs) to generate the complete video.'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsGenerating(false);
      setShowApiKeys(true);
      return;
    }
    
    // Collect story input first
    if (inputCollectionStep === 'story') {
      // Store the story input
      setUserInputData({
        story: inputValue.trim(),
        duration: duration,
        style: style
      });
      
      // Move to settings step
      setInputCollectionStep('settings');
      
      // Prompt user to adjust settings
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Thanks for sharing your story idea! Now, let\'s adjust the duration and style for your video. Please use the settings panel to customize these options.'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsGenerating(false);
      setShowSettings(true);
      return;
    }
    
    // If we're already past the input collection steps
    const assistantMessage: Message = {
      role: 'assistant',
      content: 'I\'ve analyzed your request. Would you like to adjust the duration or style before I generate the video script?'
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsGenerating(false);
    setShowSettings(true);
  };

  // State for script preview and confirmation dialog
  const [scriptPreview, setScriptPreview] = useState<GeneratedScript | null>(null);
  const [showScriptConfirmation, setShowScriptConfirmation] = useState(false);

  // Function to generate script only
  const handleGenerateScript = async () => {
    try {
      setIsGenerating(true);
      setShowSettings(false);
      setGenerationStep('script');
      setGenerationProgress(0);
      
      // Update user input data with current settings
      if (userInputData) {
        setUserInputData({
          ...userInputData,
          duration: duration,
          style: style
        });
      } else {
        // Fallback if somehow userInputData is null
        const userMessages = messages.filter(m => m.role === 'user');
        const lastMessage = userMessages[userMessages.length - 1].content;
        setUserInputData({
          story: lastMessage,
          duration: duration,
          style: style
        });
      }
      
      // Mark input collection as complete
      setInputCollectionStep('complete');
      
      // Prepare the input data in JSON format
      const inputJson = JSON.stringify({
        story: userInputData?.story || '',
        duration: duration,
        style: style
      });
      
      console.log('User input data collected:', inputJson);
      
      // Add a message about generating script
      const processingMessage: Message = {
        role: 'assistant',
        content: `Generating a script for your ${duration} second ${style} video...`
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      // Generate script using Gemini with the collected story
      setGenerationProgress(50);
      const script = await generateScript(userInputData?.story || '', geminiApiKey, {
        format: 'openclap',
        temperature: 0.7
      });
      
      setGenerationProgress(100);
      
      // Update message with script generation completion
      const scriptCompleteMessage: Message = {
        role: 'assistant',
        content: `I've created a script for your video. Please review it and confirm if you'd like to proceed with generating the video and audio.`
      };
      
      setMessages(prev => [...prev, scriptCompleteMessage]);
      setIsGenerating(false);
      
      // Set the script preview and show confirmation dialog
      setScriptPreview(script);
      setShowScriptConfirmation(true);
      
    } catch (error) {
      console.error('Error generating script:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `There was an error generating your script: ${error instanceof Error ? error.message : 'Unknown error'}.\n\nPlease check your API keys and try again.`
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
    }
  };

  // Function to generate video after script confirmation
  const handleGenerateVideo = async () => {
    try {
      if (!scriptPreview) {
        throw new Error('Script preview is not available');
      }
      
      // Check if all required API keys are available for video generation
      if (!falaiApiKey || !groqApiKey || !elevenlabsApiKey) {
        const missingKeys = [];
        if (!falaiApiKey) missingKeys.push('Fal.ai');
        if (!groqApiKey) missingKeys.push('Groq');
        if (!elevenlabsApiKey) missingKeys.push('ElevenLabs');
        
        const errorMessage: Message = {
          role: 'assistant',
          content: `You're missing the following API keys required for video generation: ${missingKeys.join(', ')}. \n\nYou can still use the generated script, but you'll need to add the missing API keys to generate the complete video.`
        };
        
        setMessages(prev => [...prev, errorMessage]);
        setIsGenerating(false);
        setShowScriptConfirmation(false);
        setShowApiKeys(true);
        return;
      }
      
      setIsGenerating(true);
      setShowScriptConfirmation(false);
      setGenerationStep('video');
      setGenerationProgress(0);
      
      // Add a message about generating video
      const processingMessage: Message = {
        role: 'assistant',
        content: `Generating a ${duration} second ${style} video based on the confirmed script...\n\nStep 1/3: Generating video scenes...`
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      // Use the confirmed script
      const script = scriptPreview;
      
      // Step 1: Generate video for each scene using Fal.ai
      setGenerationStep('video');
      const videoUrls: Record<number, string> = {};
      
      // Process each scene
      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];
        setGenerationProgress((i / script.scenes.length) * 33);
        
        // Generate video for this scene
        const videoUrl = await generateVideo(scene.visualPrompt, falaiApiKey, {
          duration: Math.min(5, duration / script.scenes.length), // Limit each scene to 5 seconds or less
          width: 512,
          height: 512,
          negativePrompt: 'blurry, low quality, distorted faces'
        });
        
        videoUrls[scene.sceneNumber] = videoUrl;
      }
      
      setGenerationProgress(33);
      
      // Update message with video generation completion
      const videoCompleteMessage: Message = {
        role: 'assistant',
        content: `Step 1/3: Video scenes generated!\n\nStep 2/3: Creating voiceovers using Groq's advanced text-to-speech technology...`
      };
      
      setMessages(prev => [...prev, videoCompleteMessage]);
      
      // Step 2: Generate speech for dialogue using Groq or ElevenLabs
      setGenerationStep('speech');
      const audioUrls: Record<string, string> = {};
      
      // Process dialogue for each scene
      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];
        setGenerationProgress(33 + (i / script.scenes.length) * 33);
        
        // Generate speech for each dialogue line
        for (let j = 0; j < scene.dialogue.length; j++) {
          const dialogue = scene.dialogue[j];
          const key = `scene${scene.sceneNumber}_${dialogue.character}_${j}`;
          
          // Generate speech using Groq API for dialogue
          const speechUrl = await generateGroqSpeech(dialogue.line, groqApiKey, {
            // You could map character names to specific voice IDs here
            voiceId: dialogue.character === 'Narrator' ? 'nova' : 'alloy' // Use different voices for different characters
          });
          
          audioUrls[key] = speechUrl;
        }
      }
      
      setGenerationProgress(66);
      
      // Update message with speech generation completion
      const speechCompleteMessage: Message = {
        role: 'assistant',
        content: `Step 2/3: Voiceovers created with Groq!\n\nStep 3/3: Adding sound effects and background music using ElevenLabs...`
      };
      
      setMessages(prev => [...prev, speechCompleteMessage]);
      
      // Step 3: Generate sound effects and background music using ElevenLabs
      setGenerationStep('sound');
      
      // Process sound effects and music for each scene
      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];
        setGenerationProgress(66 + (i / script.scenes.length) * 34);
        
        // Generate sound effects if available
        if (scene.audioDescription) {
          const sfxKey = `scene${scene.sceneNumber}_sfx`;
          const sfxUrl = await generateSound(scene.audioDescription, elevenlabsApiKey, {
            type: 'sfx',
            duration: Math.min(5, duration / script.scenes.length)
          });
          
          audioUrls[sfxKey] = sfxUrl;
        }
        
        // Generate background music if available
        if (scene.musicDescription) {
          const bgmKey = `scene${scene.sceneNumber}_bgm`;
          const bgmUrl = await generateSound(scene.musicDescription, elevenlabsApiKey, {
            type: 'bgm',
            duration: Math.min(10, duration / script.scenes.length * 2)
          });
          
          audioUrls[bgmKey] = bgmUrl;
        }
      }
      
      setGenerationProgress(100);
      
      // Final assembly would happen here in a real implementation
      // For now, we'll just collect all the generated assets
      
      // Update with completion message
      const completionMessage: Message = {
        role: 'assistant',
        content: 'Your video has been generated based on the script you approved! You can now preview it, edit it further, or download it.'
      };
      
      setMessages(prev => [...prev, completionMessage]);
      setIsGenerating(false);
      
      // Set the generated video details
      setGeneratedVideo({
        title: script.title,
        script: script,
        duration: duration,
        style: style,
        videoUrl: videoUrls[1], // Just use the first scene's video for preview
        audioUrls: audioUrls
      });
      
    } catch (error) {
      console.error('Error generating video:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `There was an error generating your video: ${error instanceof Error ? error.message : 'Unknown error'}.\n\nPlease check your API keys and try again.`
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
    }
  }; // Close handleGenerateVideo function

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center">
          <Link to="/" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-[#D7F266]">Video Generation</h1>
        </div>
        {generatedVideo && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Save
            </Button>
            <Link to="/editor">
              <Button className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] flex items-center gap-1" size="sm">
                <ChevronRight className="h-4 w-4" />
                Edit in Timeline
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-white/10">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' 
                    ? 'bg-[#2A2A2A] text-white' 
                    : 'bg-[#1E1E1E] border border-white/10'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center mb-1">
                      <Sparkles className="h-4 w-4 text-[#D7F266] mr-1" />
                      <span className="text-xs font-medium text-[#D7F266]">AI Assistant</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-[#1E1E1E] border border-white/10">
                  <div className="flex items-center mb-1">
                    <Sparkles className="h-4 w-4 text-[#D7F266] mr-1" />
                    <span className="text-xs font-medium text-[#D7F266]">AI Assistant</span>
                  </div>
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p>Thinking...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* API Keys Dialog */}
          <Dialog open={showApiKeys} onOpenChange={setShowApiKeys}>
            <DialogContent className="bg-[#1E1E1E] border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-[#D7F266]">API Keys</DialogTitle>
                <DialogDescription>
                  Enter your API keys for the AI services. Only Gemini API key is required for script generation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Key className="h-4 w-4 mr-2 text-[#D7F266]" />
                      <span>Gemini API Key</span>
                    </div>
                    <span className="text-xs font-medium text-[#D7F266]">Required for Script</span>
                  </div>
                  <Input
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="bg-[#1E1E1E] border-white/20"
                    type="password"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-2 text-[#D7F266]" />
                      <span>Fal.ai API Key</span>
                    </div>
                    <span className="text-xs text-white/70">Required for Video</span>
                  </div>
                  <Input
                    value={falaiApiKey}
                    onChange={(e) => setFalaiApiKey(e.target.value)}
                    placeholder="Enter your Fal.ai API key"
                    className="bg-[#1E1E1E] border-white/20"
                    type="password"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mic className="h-4 w-4 mr-2 text-[#D7F266]" />
                      <span>Groq API Key</span>
                    </div>
                    <span className="text-xs text-white/70">Required for Video</span>
                  </div>
                  <Input
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="Enter your Groq API key"
                    className="bg-[#1E1E1E] border-white/20"
                    type="password"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Music className="h-4 w-4 mr-2 text-[#D7F266]" />
                      <span>ElevenLabs API Key</span>
                    </div>
                    <span className="text-xs text-white/70">Required for Video</span>
                  </div>
                  <Input
                    value={elevenlabsApiKey}
                    onChange={(e) => setElevenlabsApiKey(e.target.value)}
                    placeholder="Enter your ElevenLabs API key"
                    className="bg-[#1E1E1E] border-white/20"
                    type="password"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col space-y-2 sm:space-y-0">
                <div className="text-xs text-white/70 text-right mb-2">
                  {geminiApiKey ? 
                    (falaiApiKey && groqApiKey && elevenlabsApiKey ? 
                      'All keys provided. Full video generation available.' : 
                      'Script generation available. Add remaining keys for video generation.') : 
                    'Add at least Gemini API key to generate scripts.'}
                </div>
                <Button 
                  className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]" 
                  onClick={() => setShowApiKeys(false)}
                >
                  Save Keys
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Settings Dialog */}
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogContent className="bg-[#1E1E1E] border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-[#D7F266]">Video Settings</DialogTitle>
                <DialogDescription>
                  Customize your video before generation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-[#D7F266]" />
                      <span>Duration (seconds)</span>
                    </div>
                    <span className="text-sm text-white/70">{duration}s</span>
                  </div>
                  <Slider 
                    value={[duration]} 
                    min={15} 
                    max={300} 
                    step={15} 
                    onValueChange={(value) => setDuration(value[0])}
                    className="[&>span]:bg-[#D7F266]"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Film className="h-4 w-4 mr-2 text-[#D7F266]" />
                    <span>Video Style</span>
                  </div>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="documentary">Documentary</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="animation">Animation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
                <Button 
                  className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]" 
                  onClick={handleGenerateScript}
                >
                  Generate Script
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Script Confirmation Dialog */}
          <Dialog open={showScriptConfirmation} onOpenChange={setShowScriptConfirmation}>
            <DialogContent className="bg-[#1E1E1E] border border-white/10 max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#D7F266]">Script Preview</DialogTitle>
                <DialogDescription>
                  Review the generated script before proceeding with video generation
                </DialogDescription>
              </DialogHeader>
              
              {scriptPreview && (
                <div className="space-y-4 py-4">
                  <div className="bg-[#1E1E1E] rounded-lg p-4 border border-white/10">
                    <h3 className="font-medium text-lg mb-1">{scriptPreview.title}</h3>
                    <p className="text-sm text-white/70 italic mb-4">{scriptPreview.logline}</p>
                    
                    <div className="space-y-6 mt-4">
                      {scriptPreview.scenes.map((scene, index) => (
                        <div key={index} className="border-t border-white/10 pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-[#D7F266]">Scene {scene.sceneNumber}</h4>
                            <span className="text-xs text-white/70">{scene.setting}</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium mb-1">Visual Description:</h5>
                              <p className="text-sm text-white/90 bg-[#252525] p-2 rounded">{scene.visualPrompt}</p>
                            </div>
                            
                            {scene.audioDescription && (
                              <div>
                                <h5 className="text-sm font-medium mb-1">Sound Effects:</h5>
                                <p className="text-sm text-white/90 bg-[#252525] p-2 rounded">{scene.audioDescription}</p>
                              </div>
                            )}
                            
                            {scene.musicDescription && (
                              <div>
                                <h5 className="text-sm font-medium mb-1">Music:</h5>
                                <p className="text-sm text-white/90 bg-[#252525] p-2 rounded">{scene.musicDescription}</p>
                              </div>
                            )}
                            
                            {scene.dialogue.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-1">Dialogue:</h5>
                                <div className="space-y-2">
                                  {scene.dialogue.map((line, i) => (
                                    <div key={i} className="text-sm bg-[#252525] p-2 rounded">
                                      <span className="font-medium text-[#D7F266]">{line.character}:</span> {line.line}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowScriptConfirmation(false)}>Make Changes</Button>
                {falaiApiKey && groqApiKey && elevenlabsApiKey ? (
                  <Button 
                    className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]" 
                    onClick={handleGenerateVideo}
                  >
                    Generate Video
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 items-end">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setShowApiKeys(true)}
                    >
                      <Key className="h-4 w-4" />
                      Add Missing API Keys
                    </Button>
                    <Button 
                      className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] flex items-center gap-1" 
                      onClick={() => {
                        // Close the confirmation dialog
                        setShowScriptConfirmation(false);
                        
                        // Add a message about script generation completion
                        const scriptCompleteMessage: Message = {
                          role: 'assistant',
                          content: `Your script has been generated successfully! You can now download it or add the remaining API keys to generate the full video.`
                        };
                        
                        setMessages(prev => [...prev, scriptCompleteMessage]);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Use Script Only
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-end gap-2">
              <Textarea 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyDown={handleKeyDown}
                placeholder="Describe your video idea..."
                className="min-h-[60px] resize-none bg-[#1E1E1E] border-white/10 focus-visible:ring-[#D7F266]"
                disabled={isGenerating}
              />
              <Button 
                className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] h-10 w-10 p-2 rounded-full flex-shrink-0"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isGenerating}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-white/50 mt-2">
              Tip: Be specific about your video's content, style, and target audience for better results.
            </p>
          </div>
        </div>

        {/* Preview Section (shown when video is generated) */}
        {generatedVideo && (
          <div className="w-full md:w-2/5 lg:w-1/3 border-t md:border-t-0 border-white/10 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-bold text-lg">{generatedVideo.title}</h2>
              <div className="flex items-center gap-2 text-sm text-white/70 mt-1">
                <Clock className="h-3 w-3" />
                <span>{generatedVideo.duration}s</span>
                <span className="mx-1">•</span>
                <Film className="h-3 w-3" />
                <span className="capitalize">{generatedVideo.style}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-[#1E1E1E] rounded-lg p-4 border border-white/10">
                <h3 className="font-medium text-sm text-[#D7F266] mb-2">Generated Script</h3>
                <div className="space-y-4">
                  <p className="text-sm font-medium">{generatedVideo.script.title}</p>
                  <p className="text-xs text-white/70 italic">{generatedVideo.script.logline}</p>
                  
                  <div className="space-y-3 mt-2">
                    {generatedVideo.script.scenes.map((scene, index) => (
                      <div key={index} className="border-t border-white/10 pt-2">
                        <p className="text-xs font-medium text-[#D7F266]">{scene.setting}</p>
                        <p className="text-xs text-white/70 mt-1">{scene.visualPrompt}</p>
                        
                        {scene.dialogue.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {scene.dialogue.map((line, i) => (
                              <div key={i} className="text-xs">
                                <span className="font-medium">{line.character}:</span> {line.line}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium text-sm text-[#D7F266] mb-3">What's next?</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-between" size="sm">
                    <span className="flex items-center">
                      <Play className="h-4 w-4 mr-2" />
                      Preview Video
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Link to="/editor" className="w-full">
                    <Button variant="outline" className="w-full justify-between" size="sm">
                      <span className="flex items-center">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit in Timeline
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-between" size="sm">
                    <span className="flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Download Script
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGeneration;