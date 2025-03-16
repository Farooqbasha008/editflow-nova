
import React, { useState, useEffect } from 'react';
import Header from './Header';
import MediaLibrary from './MediaLibrary';
import Timeline from './Timeline';
import Preview from './Preview';
import { toast } from 'sonner';

const VideoEditor: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(20); // Total timeline duration in seconds
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectName, setProjectName] = useState("Untitled Project");
  
  // Simulated playback
  useEffect(() => {
    let playbackInterval: number;
    
    if (isPlaying) {
      playbackInterval = window.setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prevTime + 0.1;
        });
      }, 100);
    }
    
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [isPlaying, duration]);
  
  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleSave = () => {
    toast.success('Project saved', {
      description: `${projectName} has been saved.`,
    });
  };

  const handleExport = () => {
    toast.success('Export started', {
      description: 'Your video is being prepared for download.',
    });
    // In a real implementation, this would trigger the export process
    setTimeout(() => {
      toast.success('Export complete', {
        description: 'Your video is ready to download.',
      });
    }, 2000);
  };

  const handleRename = (name: string) => {
    setProjectName(name);
    toast.success('Project renamed', {
      description: `Project is now named "${name}".`,
    });
  };
  
  return (
    <div className="flex flex-col h-full bg-editor-bg text-white">
      <Header 
        projectName={projectName}
        onRename={handleRename}
        onSave={handleSave}
        onExport={handleExport}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <MediaLibrary />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Preview currentTime={currentTime} isPlaying={isPlaying} />
          
          <div className="h-[300px] border-t border-white/10">
            <Timeline 
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
