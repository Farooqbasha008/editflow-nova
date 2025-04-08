import React, { useState } from 'react';
import { Film, Music, Mic, Sparkles } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { TimelineItem } from './VideoEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioExtractor from './AudioExtractor';
import VoiceoverGenerator from './VoiceoverGenerator';
import SoundEffectsGenerator from './SoundEffectsGenerator';

interface MediaSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddToTimeline: (item: TimelineItem) => void;
  promptText: string;
  setPromptText: (text: string) => void;
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
  const [generatorTab, setGeneratorTab] = useState<string>("prompt");
  
  return (
    <div className="flex flex-col h-full bg-[#151514]">
      {/* Media Type Icons */}
      <div className="flex p-1 space-x-1 border-b border-white/10">
        <button 
          className={`p-2 rounded-full flex items-center justify-center ${activeTab === 'visuals' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('visuals')}
        >
          <Film size={16} />
        </button>
        <button 
          className={`p-2 rounded-full flex items-center justify-center ${activeTab === 'audio' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('audio')}
        >
          <Music size={16} />
        </button>
        <button 
          className={`p-2 rounded-full flex items-center justify-center ${activeTab === 'voiceover' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('voiceover')}
        >
          <Mic size={16} />
        </button>
        <button 
          className={`p-2 rounded-full flex items-center justify-center ${activeTab === 'generate' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('generate')}
        >
          <Sparkles size={16} />
        </button>
      </div>
      
      {/* Media Library */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'visuals' && (
          <MediaLibrary onAddToTimeline={onAddToTimeline} mediaType="video" />
        )}
        
        {activeTab === 'audio' && (
          <Tabs defaultValue="library" className="w-full h-full">
            <TabsList className="w-full grid grid-cols-2 bg-editor-panel/50 p-1 h-8">
              <TabsTrigger value="library" className="text-xs h-6">Audio Library</TabsTrigger>
              <TabsTrigger value="effects" className="text-xs h-6">Sound Effects</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="h-[calc(100%-2rem)] overflow-y-auto">
              <div className="flex flex-col h-full">
                <MediaLibrary onAddToTimeline={onAddToTimeline} mediaType="audio" />
                <AudioExtractor videoItem={selectedVideo} onAddExtractedAudio={onAddToTimeline} />
              </div>
            </TabsContent>
            <TabsContent value="effects" className="h-[calc(100%-2rem)] overflow-y-auto">
              <SoundEffectsGenerator onAddToTimeline={onAddToTimeline} />
            </TabsContent>
          </Tabs>
        )}
        
        {activeTab === 'voiceover' && (
          <VoiceoverGenerator onAddToTimeline={onAddToTimeline} />
        )}
        
        {activeTab === 'generate' && (
          <div className="h-[calc(100%-2rem)] flex flex-col p-3">
            <div className="flex-1">
              <Textarea
                placeholder="Describe your idea... (e.g., 'Create a montage of city scenes with upbeat music')"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="bg-transparent border-white/20 resize-none text-sm text-[#F7F8F6] focus-visible:ring-[#D7F266] h-[calc(100%-3rem)]"
              />
            </div>
            <Button 
              className="w-full mt-3 bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300"
              onClick={onGenerate}
            >
              Generate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaSidebar;