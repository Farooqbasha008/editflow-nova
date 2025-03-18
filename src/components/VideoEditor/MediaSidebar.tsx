
import React from 'react';
import { Film, Music, TextIcon, Mic, Image } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { TimelineItem } from './VideoEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MediaSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddToTimeline: (item: TimelineItem) => void;
  promptText: string;
  setPromptText: (text: string) => void;
  onGenerate: () => void;
}

const MediaSidebar: React.FC<MediaSidebarProps> = ({
  activeTab,
  setActiveTab,
  onAddToTimeline,
  promptText,
  setPromptText,
  onGenerate
}) => {
  return (
    <div className="flex flex-col h-full bg-[#151514]">
      {/* Media Type Icons */}
      <div className="flex p-2 space-x-1 border-b border-white/10">
        <button 
          className={`p-3 rounded-full flex items-center justify-center ${activeTab === 'visuals' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('visuals')}
        >
          <Film size={18} />
        </button>
        <button 
          className={`p-3 rounded-full flex items-center justify-center ${activeTab === 'audio' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('audio')}
        >
          <Music size={18} />
        </button>
        <button 
          className={`p-3 rounded-full flex items-center justify-center ${activeTab === 'text' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('text')}
        >
          <TextIcon size={18} />
        </button>
        <button 
          className={`p-3 rounded-full flex items-center justify-center ${activeTab === 'voiceover' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('voiceover')}
        >
          <Mic size={18} />
        </button>
      </div>
      
      {/* Media Library */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'visuals' && (
          <MediaLibrary onAddToTimeline={onAddToTimeline} mediaType="video" />
        )}
        
        {activeTab === 'audio' && (
          <MediaLibrary onAddToTimeline={onAddToTimeline} mediaType="audio" />
        )}
        
        {activeTab === 'text' && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-white/70">
            <TextIcon size={32} className="mb-2" />
            <p className="text-sm">Text elements coming soon</p>
          </div>
        )}
        
        {activeTab === 'voiceover' && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-white/70">
            <Mic size={32} className="mb-2" />
            <p className="text-sm">Record voiceover coming soon</p>
          </div>
        )}
      </div>
      
      {/* AI Generation Input */}
      <div className="p-3 border-t border-white/10">
        <div className="bg-[#151514] border border-white/20 rounded-md p-2 mb-2">
          <Textarea
            placeholder="Describe your image idea... (e.g., 'Sunlight filtering through trees and a gentle stream flowing')"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="bg-transparent border-none resize-none text-sm text-[#F7F8F6] focus-visible:ring-0 h-24"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] rounded-full transition-all duration-300"
            onClick={onGenerate}
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MediaSidebar;
