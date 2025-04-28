import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Play, Pause, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generatedMediaDB } from '@/lib/db';
import { TimelineItem } from './VideoEditor';

interface GeneratedMediaManagerProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const TRACK_IDS = {
  VIDEO: 'video-track',
  MUSIC: 'music-track',
  VOICEOVER: 'voiceover-track',
  SOUND_EFFECTS: 'sfx-track'
} as const;

export function GeneratedMediaManager({ onAddToTimeline }: GeneratedMediaManagerProps) {
  const [media, setMedia] = useState<{
    videos: any[];
    voiceovers: any[];
    soundEffects: any[];
  }>({
    videos: [],
    voiceovers: [],
    soundEffects: []
  });

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const allMedia = await generatedMediaDB.getAllMedia();
        setMedia({
          videos: allMedia.filter(m => m.type === 'video'),
          voiceovers: allMedia.filter(m => m.type === 'audio'),
          soundEffects: allMedia.filter(m => m.type === 'sfx')
        });
      } catch (error) {
        console.error('Error loading media:', error);
        toast.error('Failed to load generated media');
      }
    };

    loadMedia();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await generatedMediaDB.deleteMedia(id);
      setMedia(prev => ({
        videos: prev.videos.filter(m => m.id !== id),
        voiceovers: prev.voiceovers.filter(m => m.id !== id),
        soundEffects: prev.soundEffects.filter(m => m.id !== id)
      }));
      toast.success('Media deleted successfully');
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media');
    }
  };

  const handleAddToTimeline = (item: any) => {
    onAddToTimeline({
      id: `media-${Date.now()}`,
      trackId: item.type === 'video' ? TRACK_IDS.VIDEO : TRACK_IDS.VOICEOVER,
      start: 0,
      duration: item.metadata?.duration || 0,
      type: item.type === 'video' ? 'video' : 'audio',
      name: item.name,
      color: item.type === 'video' ? '#FF6B6B' : '#4ECDC4',
      src: item.src,
      thumbnail: item.metadata?.thumbnail,
      volume: 1
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Videos</Label>
        <div className="grid grid-cols-2 gap-2">
          {media.videos.map(video => (
            <div key={video.id} className="relative">
              <video src={video.src} className="w-full rounded" />
              <div className="absolute bottom-0 right-0 flex gap-1 p-1">
                <Button size="sm" onClick={() => handleAddToTimeline(video)}>
                  Add
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(video.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Voiceovers</Label>
        <div className="grid grid-cols-2 gap-2">
          {media.voiceovers.map(voiceover => (
            <div key={voiceover.id} className="relative">
              <audio src={voiceover.src} controls className="w-full" />
              <div className="absolute bottom-0 right-0 flex gap-1 p-1">
                <Button size="sm" onClick={() => handleAddToTimeline(voiceover)}>
                  Add
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(voiceover.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Sound Effects</Label>
        <div className="grid grid-cols-2 gap-2">
          {media.soundEffects.map(sfx => (
            <div key={sfx.id} className="relative">
              <audio src={sfx.src} controls className="w-full" />
              <div className="absolute bottom-0 right-0 flex gap-1 p-1">
                <Button size="sm" onClick={() => handleAddToTimeline(sfx)}>
                  Add
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(sfx.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 