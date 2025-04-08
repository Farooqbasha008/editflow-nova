import React, { useState } from 'react';
import { Film, Music, Mic } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { TimelineItem } from './types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioExtractor from './AudioExtractor';
<<<<<<< HEAD
import VoiceoverGenerator from './VoiceoverGenerator';

import SoundEffectsGenerator from './SoundEffectsGenerator';
=======
import VideoGenerator from './VideoGenerator';
import SoundEffectGenerator from './SoundEffectGenerator';
import VoiceoverGenerator from './VoiceoverGenerator';
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df

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
<<<<<<< HEAD

=======
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
      </div>
      
      {/* Media Library */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'visuals' && (
          <Tabs defaultValue="media" className="w-full h-full">
            <TabsList className="w-full grid grid-cols-2 bg-editor-panel/50 p-1 h-8">
              <TabsTrigger value="media" className="text-xs h-6">Media Library</TabsTrigger>
              <TabsTrigger value="video" className="text-xs h-6">Generate Video</TabsTrigger>
            </TabsList>
            <TabsContent value="media" className="h-[calc(100%-2rem)] overflow-y-auto">
              <MediaLibrary onAddToTimeline={onAddToTimeline} mediaType="video" />
            </TabsContent>
            <TabsContent value="video" className="h-[calc(100%-2rem)] overflow-y-auto">
              <VideoGenerator onAddToTimeline={onAddToTimeline} />
            </TabsContent>
          </Tabs>
        )}
        
        {activeTab === 'audio' && (
<<<<<<< HEAD
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
=======
          <Tabs defaultValue="media" className="w-full h-full">
            <TabsList className="w-full grid grid-cols-2 bg-editor-panel/50 p-1 h-8">
              <TabsTrigger value="media" className="text-xs h-6">Media Library</TabsTrigger>
              <TabsTrigger value="sfx" className="text-xs h-6">Sound Effects</TabsTrigger>
            </TabsList>
            <TabsContent value="media" className="h-[calc(100%-2rem)] overflow-y-auto">
              <MediaLibrary onAddToTimeline={onAddToTimeline} mediaType="audio" />
              <AudioExtractor videoItem={selectedVideo} onAddExtractedAudio={onAddToTimeline} />
            </TabsContent>
            <TabsContent value="sfx" className="h-[calc(100%-2rem)] overflow-y-auto">
              <SoundEffectGenerator onAddToTimeline={onAddToTimeline} />
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
            </TabsContent>
          </Tabs>
        )}
        
        {activeTab === 'voiceover' && (
<<<<<<< HEAD
          <VoiceoverGenerator onAddToTimeline={onAddToTimeline} />
        )}
        

=======
          <div className="h-[calc(100%-2rem)] overflow-y-auto">
            <VoiceoverGenerator onAddToTimeline={onAddToTimeline} />
          </div>
        )}
>>>>>>> b384b77ec11a6e4e6e07ecd133f154706d9926df
      </div>
    </div>
  );
};

export default MediaSidebar;