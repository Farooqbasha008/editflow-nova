import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Send, Sparkles, Clock, Film, Loader2, Download, Play, ChevronRight, Pencil } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface VideoDetails {
  title: string;
  script: string;
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
  const [duration, setDuration] = useState(60); // Default 60 seconds
  const [style, setStyle] = useState('cinematic');
  const [generatedVideo, setGeneratedVideo] = useState<VideoDetails | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    
    // Simulate AI response after a delay
    setTimeout(() => {
      // This would be replaced with actual API call to an LLM
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'I\'ve analyzed your request. Would you like to adjust the duration or style before I generate the video script?'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsGenerating(false);
      setShowSettings(true);
    }, 1500);
  };

  const handleGenerateVideo = () => {
    setIsGenerating(true);
    setShowSettings(false);
    
    // Add a message about generating
    const processingMessage: Message = {
      role: 'assistant',
      content: `Generating a ${duration} second ${style} video based on your description...`
    };
    
    setMessages(prev => [...prev, processingMessage]);
    
    // Simulate video generation (would be an actual API call)
    setTimeout(() => {
      const completionMessage: Message = {
        role: 'assistant',
        content: 'Your video has been generated! You can now preview it, edit it further, or download it.'
      };
      
      setMessages(prev => [...prev, completionMessage]);
      setIsGenerating(false);
      
      // Mock generated video details
      setGeneratedVideo({
        title: 'Your Generated Video',
        script: 'This is a sample script generated based on your description. It would include detailed scenes, dialogue, and directions for a professional video.',
        duration: duration,
        style: style
      });
    }, 3000);
  };

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
                  onClick={handleGenerateVideo}
                >
                  Generate Video
                </Button>
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
                <p className="whitespace-pre-wrap text-sm">{generatedVideo.script}</p>
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