
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MediaLibrary from './MediaLibrary';
import { TimelineItem } from './VideoEditor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Film, Music, TextIcon, Mic, FolderOpen, Sparkles, ImageIcon } from 'lucide-react';
import ImageGenerator from './ImageGenerator';
import AudioExtractor from './AudioExtractor';
import FreeSoundBrowser from './FreeSoundBrowser';
import { Textarea } from '@/components/ui/textarea';

interface MediaSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddToTimeline: (item: TimelineItem) => void;
  promptText: string;
  setPromptText: (prompt: string) => void;
  onGenerate: () => void;
  selectedVideo: TimelineItem | null;
}

const MediaSidebar: React.FC<MediaSidebarProps> = ({
  activeTab,
  setActiveTab,
  onAddToTimeline,
  promptText,
  setPromptText,
  onGenerate,
  selectedVideo
}) => {
  // Determine the active media type (visuals, audio, text)
  const [activeMediaType, setActiveMediaType] = useState<'library' | 'freesound' | 'generator'>('library');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <TabsList className="flex w-full justify-between bg-editor-panel/50 p-0 h-10">
        <TabsTrigger 
          value="visuals" 
          className="flex-1 h-full rounded-none data-[state=active]:bg-editor-panel"
        >
          <Film size={16} className="mr-1.5" />
          <span className="text-xs">Visuals</span>
        </TabsTrigger>
        <TabsTrigger 
          value="audio" 
          className="flex-1 h-full rounded-none data-[state=active]:bg-editor-panel"
        >
          <Music size={16} className="mr-1.5" />
          <span className="text-xs">Audio</span>
        </TabsTrigger>
        <TabsTrigger 
          value="text" 
          className="flex-1 h-full rounded-none data-[state=active]:bg-editor-panel"
        >
          <TextIcon size={16} className="mr-1.5" />
          <span className="text-xs">Text</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="visuals" className="flex-1 flex flex-col overflow-hidden m-0 border-0 p-0">
        <Tabs value={activeMediaType} onValueChange={setActiveMediaType as any} className="h-full flex flex-col">
          <TabsList className="flex justify-between w-full bg-editor-panel/30 p-0.5 h-8">
            <TabsTrigger 
              value="library" 
              className="h-7 text-xs px-2 rounded-sm data-[state=active]:bg-editor-panel"
            >
              Media Library
            </TabsTrigger>
            <TabsTrigger 
              value="generator" 
              className="h-7 text-xs px-2 rounded-sm data-[state=active]:bg-editor-panel"
            >
              Generate Image
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="flex-1 overflow-hidden m-0 border-0 p-0">
            <MediaLibrary 
              onAddToTimeline={onAddToTimeline} 
              mediaType="video"
            />
          </TabsContent>
          
          <TabsContent value="generator" className="flex-1 overflow-hidden m-0 border-0 p-0">
            <ImageGenerator onAddToTimeline={onAddToTimeline} />
          </TabsContent>
        </Tabs>
      </TabsContent>
      
      <TabsContent value="audio" className="flex-1 flex flex-col overflow-hidden m-0 border-0 p-0">
        <Tabs value={activeMediaType} onValueChange={setActiveMediaType as any} className="h-full flex flex-col">
          <TabsList className="flex justify-between w-full bg-editor-panel/30 p-0.5 h-8">
            <TabsTrigger 
              value="library" 
              className="h-7 text-xs px-2 rounded-sm data-[state=active]:bg-editor-panel"
            >
              Media Library
            </TabsTrigger>
            <TabsTrigger 
              value="freesound" 
              className="h-7 text-xs px-2 rounded-sm data-[state=active]:bg-editor-panel"
            >
              Royalty Free Music
            </TabsTrigger>
            <TabsTrigger 
              value="generator" 
              className="h-7 text-xs px-2 rounded-sm data-[state=active]:bg-editor-panel"
            >
              Extract Audio
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="flex-1 overflow-hidden m-0 border-0 p-0">
            <MediaLibrary 
              onAddToTimeline={onAddToTimeline} 
              mediaType="audio"
            />
          </TabsContent>
          
          <TabsContent value="freesound" className="flex-1 overflow-hidden m-0 border-0 p-0">
            <FreeSoundBrowser onAddToTimeline={onAddToTimeline} />
          </TabsContent>
          
          <TabsContent value="generator" className="flex-1 overflow-hidden m-0 border-0 p-0">
            <AudioExtractor 
              onAddToTimeline={onAddToTimeline} 
              selectedVideo={selectedVideo}
            />
          </TabsContent>
        </Tabs>
      </TabsContent>
      
      <TabsContent value="text" className="flex-1 overflow-hidden m-0 border-0 p-0">
        <div className="flex flex-col h-full bg-editor-panel/70">
          <div className="p-3 border-b border-white/10">
            <div className="text-sm font-medium text-white/90 mb-2">AI Assistance</div>
            <div className="text-xs text-white/70 mb-4">
              Describe what you want to create and the AI will help you generate it.
            </div>
            
            <div className="space-y-3">
              <ScrollArea className="h-28">
                <Textarea
                  placeholder="Describe your idea..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="bg-editor-bg/80 border-white/10 text-white/90 min-h-24"
                />
              </ScrollArea>
              
              <Button
                onClick={onGenerate}
                className="w-full bg-editor-accent hover:bg-editor-accent/90 text-black"
              >
                <Sparkles size={16} className="mr-1.5" />
                Generate
              </Button>
            </div>
          </div>
          
          {/* Text options will go here */}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MediaSidebar;
