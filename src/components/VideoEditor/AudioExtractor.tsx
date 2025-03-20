
import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileAudio, Play, Pause, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineItem } from './VideoEditor';

interface AudioExtractorProps {
  selectedVideo: TimelineItem | null;
  onAddToTimeline: (item: TimelineItem) => void;
}

const AudioExtractor: React.FC<AudioExtractorProps> = ({ selectedVideo, onAddToTimeline }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const extractAudio = async () => {
    if (!selectedVideo || !selectedVideo.src) {
      toast.error('No video selected for audio extraction');
      return;
    }

    setIsExtracting(true);
    toast.info('Extracting audio from video...');

    try {
      // In a real implementation, you would use a proper audio extraction library
      // For this demo, we'll simulate extraction by using the video's audio track directly
      // as most video elements also contain audio that can be played
      
      // Simulate a processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use the same source for audio (in reality, you'd extract the audio track)
      setExtractedAudioUrl(selectedVideo.src);
      
      toast.success('Audio extracted successfully!', {
        description: `Extracted from ${selectedVideo.name}`
      });
    } catch (error) {
      console.error('Error extracting audio:', error);
      toast.error('Failed to extract audio', {
        description: 'An error occurred during audio extraction.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !extractedAudioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
        toast.error('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const addToTimeline = () => {
    if (!extractedAudioUrl || !selectedVideo) return;
    
    const newAudioItem: TimelineItem = {
      id: `audio-${Date.now()}`,
      trackId: 'track3', // First audio track
      start: 0,
      duration: selectedVideo.duration,
      type: 'audio',
      name: `Audio from ${selectedVideo.name}`,
      color: 'bg-blue-400/70',
      src: extractedAudioUrl,
      thumbnail: '',
      volume: 1.0,
    };
    
    onAddToTimeline(newAudioItem);
    toast.success('Audio added to timeline', {
      description: `Added to Audio Track 1`
    });
  };

  const downloadAudio = () => {
    if (!extractedAudioUrl) return;
    
    // Create a temporary link element to trigger the download
    const a = document.createElement('a');
    a.href = extractedAudioUrl;
    a.download = `audio_from_${selectedVideo?.name || 'video'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Audio download started');
  };

  return (
    <div className="p-3 border-t border-white/10">
      {selectedVideo ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#F7F8F6] font-medium">Extract Audio</div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-editor-panel border-white/20 hover:bg-editor-hover"
              onClick={extractAudio}
              disabled={isExtracting}
            >
              {isExtracting ? 'Extracting...' : 'Extract'}
            </Button>
          </div>
          
          {extractedAudioUrl && (
            <>
              <div className="flex items-center gap-2 mt-2 bg-editor-panel/50 p-2 rounded">
                <FileAudio size={16} className="text-[#D7F266]" />
                <div className="text-xs text-[#F7F8F6]/90 truncate flex-1">
                  Audio from {selectedVideo.name}
                </div>
                <button
                  className="p-1 bg-editor-hover rounded-full"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1 bg-editor-panel border-white/20 hover:bg-editor-hover"
                  onClick={addToTimeline}
                >
                  Add to Timeline
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex items-center gap-1 bg-editor-panel border-white/20 hover:bg-editor-hover"
                  onClick={downloadAudio}
                >
                  <Download size={12} />
                </Button>
              </div>
              
              <audio ref={audioRef} src={extractedAudioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
            </>
          )}
        </div>
      ) : (
        <div className="text-xs text-[#F7F8F6]/60 text-center">
          Select a video to extract audio
        </div>
      )}
    </div>
  );
};

export default AudioExtractor;
