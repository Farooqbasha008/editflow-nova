
import React, { useState } from 'react';
import { Upload, Film, Music, Image as ImageIcon, Mic, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for media items
const MEDIA_ITEMS = [
  { id: '1', type: 'video', name: 'Cars drifting', duration: '00:15', thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop' },
  { id: '2', type: 'video', name: 'Turbocharging', duration: '00:08', thumbnail: 'https://images.unsplash.com/photo-1563358955-21ed330539a9?w=800&auto=format&fit=crop' },
  { id: '3', type: 'video', name: 'Car accelerating', duration: '00:10', thumbnail: 'https://images.unsplash.com/photo-1518563222397-1fc005b5a0e0?w=800&auto=format&fit=crop' },
  { id: '4', type: 'audio', name: 'Engine sound', duration: '00:13', thumbnail: '' },
  { id: '5', type: 'audio', name: 'Crowd cheer', duration: '00:07', thumbnail: '' },
];

interface MediaItemProps {
  item: typeof MEDIA_ITEMS[number];
  onDragStart: (e: React.DragEvent, item: typeof MEDIA_ITEMS[number]) => void;
}

const MediaItem: React.FC<MediaItemProps> = ({ item, onDragStart }) => {
  return (
    <div 
      className="video-item group"
      draggable
      onDragStart={(e) => onDragStart(e, item)}
    >
      {item.type === 'video' ? (
        <div className="relative">
          <img src={item.thumbnail} alt={item.name} className="w-full h-20 object-cover" />
          <div className="absolute bottom-0 right-0 bg-black/70 text-white/90 text-[10px] px-1 py-0.5 rounded-tl">
            {item.duration}
          </div>
        </div>
      ) : (
        <div className="h-14 bg-editor-panel flex items-center justify-center">
          {item.type === 'audio' && <Music size={20} className="text-white/70" />}
        </div>
      )}
      <div className="p-2 text-xs text-white/90 truncate">{item.name}</div>
    </div>
  );
};

const MediaLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  
  const handleDragStart = (e: React.DragEvent, item: typeof MEDIA_ITEMS[number]) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    
    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.classList.add('video-item', 'p-2', 'bg-editor-panel', 'rounded', 'shadow-lg', 'text-white', 'border', 'border-white/20');
    dragImage.style.width = '120px';
    dragImage.style.opacity = '0.8';
    dragImage.textContent = item.name;
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 60, 30);
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const filteredItems = activeTab === 'all' 
    ? MEDIA_ITEMS 
    : MEDIA_ITEMS.filter(item => item.type === activeTab);

  return (
    <div className="w-64 bg-editor-panel border-r border-white/10 flex flex-col h-full animate-slide-right">
      <div className="p-3 border-b border-white/10">
        <h2 className="text-base font-medium text-white/90">Media</h2>
      </div>
      
      <div className="grid grid-cols-4 gap-1 px-2 pt-2">
        <button 
          className={cn(
            "p-1.5 rounded-md text-white/70 hover:text-white transition-colors",
            activeTab === 'all' && "bg-editor-hover text-white"
          )}
          onClick={() => setActiveTab('all')}
        >
          <Film size={16} className="mx-auto" />
        </button>
        <button 
          className={cn(
            "p-1.5 rounded-md text-white/70 hover:text-white transition-colors",
            activeTab === 'video' && "bg-editor-hover text-white"
          )}
          onClick={() => setActiveTab('video')}
        >
          <Video size={16} className="mx-auto" />
        </button>
        <button 
          className={cn(
            "p-1.5 rounded-md text-white/70 hover:text-white transition-colors",
            activeTab === 'audio' && "bg-editor-hover text-white"
          )}
          onClick={() => setActiveTab('audio')}
        >
          <Music size={16} className="mx-auto" />
        </button>
        <button 
          className={cn(
            "p-1.5 rounded-md text-white/70 hover:text-white transition-colors",
            activeTab === 'image' && "bg-editor-hover text-white"
          )}
          onClick={() => setActiveTab('image')}
        >
          <ImageIcon size={16} className="mx-auto" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <div 
          className="video-item border border-dashed border-white/20 h-32 flex flex-col items-center justify-center text-white/60 cursor-pointer hover:border-white/40 hover:text-white/80"
        >
          <Upload size={24} className="mb-2" />
          <span className="text-xs">Upload Media</span>
        </div>
        
        {filteredItems.map(item => (
          <MediaItem 
            key={item.id} 
            item={item} 
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default MediaLibrary;
