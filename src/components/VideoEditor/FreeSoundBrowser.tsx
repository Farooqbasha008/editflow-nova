
import React, { useState, useEffect } from 'react';
import { Search, Music, PlayCircle, PauseCircle, Download, Plus } from 'lucide-react';
import { searchFreeSounds, formatSoundToTimelineItem } from '@/lib/freesound';
import { TimelineItem } from './VideoEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface FreeSoundBrowserProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const FreeSoundBrowser: React.FC<FreeSoundBrowserProps> = ({ onAddToTimeline }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // Handle search
  const handleSearch = async (page = 1) => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await searchFreeSounds({
        query: searchTerm,
        page,
        page_size: 15,
        sort: 'rating_desc'
      });
      
      setSearchResults(response.results);
      setTotalResults(response.count);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error searching sounds:', error);
      toast.error('Failed to search sounds', {
        description: 'Please try again or check your internet connection'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(1);
  };

  // Handle sound playback
  const togglePlay = (previewUrl: string) => {
    if (playingSound === previewUrl) {
      // Stop current sound
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      }
      setPlayingSound(null);
    } else {
      // Stop previous sound if any
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      }
      
      // Play new sound
      const newPlayer = new Audio(previewUrl);
      newPlayer.addEventListener('ended', () => setPlayingSound(null));
      newPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
        toast.error('Failed to play audio', {
          description: 'Please try again or check your browser settings'
        });
      });
      
      setAudioPlayer(newPlayer);
      setPlayingSound(previewUrl);
    }
  };
  
  // Handle adding sound to timeline
  const addSoundToTimeline = (sound: any) => {
    const timelineItem = formatSoundToTimelineItem(sound);
    
    // Create and dispatch a custom event to get current timeline items
    const customEvent = new CustomEvent('get-timeline-items', { 
      detail: { callback: (existingItems: TimelineItem[]) => {
        // Find the last item in this track to position new item right after it
        const itemsInTrack = existingItems.filter(item => item.trackId === timelineItem.trackId);
        
        if (itemsInTrack.length > 0) {
          const lastItemInTrack = itemsInTrack.reduce((latest, item) => {
            return (item.start + item.duration > latest.start + latest.duration) ? item : latest;
          }, itemsInTrack[0]);
          
          // Position new item immediately after the last item
          timelineItem.start = lastItemInTrack.start + lastItemInTrack.duration;
        }
        
        onAddToTimeline(timelineItem);
        
        toast.success('Added to timeline', {
          description: `${sound.name} has been added to your timeline`
        });
      }}
    });
    document.dispatchEvent(customEvent);
  };

  // Clean up audio player on unmount
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
      }
    };
  }, [audioPlayer]);

  return (
    <div className="flex flex-col h-full bg-editor-panel/70">
      <div className="p-3 border-b border-white/10">
        <form onSubmit={handleSubmit} className="relative">
          <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Search royalty-free music..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-editor-bg/80 border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-editor-accent"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
          >
            <Search size={14} />
          </button>
        </form>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-white/60 mb-2">
                Found {totalResults} results for "{searchTerm}"
              </div>
              
              {searchResults.map((sound) => (
                <div 
                  key={sound.id} 
                  className="flex items-center p-2 rounded-md bg-editor-bg/50 hover:bg-editor-bg/80 transition-colors group"
                >
                  <button
                    onClick={() => togglePlay(sound.previews['preview-hq-mp3'])}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white"
                  >
                    {playingSound === sound.previews['preview-hq-mp3'] ? (
                      <PauseCircle size={24} />
                    ) : (
                      <PlayCircle size={24} />
                    )}
                  </button>
                  
                  <div className="ml-2 flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/90 truncate">{sound.name}</div>
                    <div className="text-xs text-white/60 flex items-center gap-2 truncate">
                      <span>{sound.username}</span>
                      <span>•</span>
                      <span>{Math.round(sound.duration)}s</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => addSoundToTimeline(sound)}
                    className="ml-2 p-1.5 text-white/70 hover:text-white/100 bg-editor-accent/20 hover:bg-editor-accent/30 rounded-md"
                    title="Add to timeline"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
              
              {/* Pagination */}
              {totalResults > 15 && (
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-white/10">
                  <button
                    onClick={() => handleSearch(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`text-xs px-2 py-1 rounded ${currentPage === 1 ? 'text-white/40' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                  >
                    Previous
                  </button>
                  
                  <span className="text-xs text-white/60">
                    Page {currentPage} of {Math.ceil(totalResults / 15)}
                  </span>
                  
                  <button
                    onClick={() => handleSearch(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalResults / 15)}
                    className={`text-xs px-2 py-1 rounded ${currentPage >= Math.ceil(totalResults / 15) ? 'text-white/40' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : searchTerm.trim() ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Music size={48} className="text-white/30 mb-3" />
              <h3 className="text-white/80 font-medium">No results found</h3>
              <p className="text-white/60 text-sm mt-1">Try different keywords or check spelling</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Music size={48} className="text-white/30 mb-3" />
              <h3 className="text-white/80 font-medium">Search for Music</h3>
              <p className="text-white/60 text-sm mt-1">Find royalty-free music for your project</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FreeSoundBrowser;
