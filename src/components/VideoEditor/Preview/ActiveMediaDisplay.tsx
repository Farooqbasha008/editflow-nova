
import React from 'react';
import { TimelineItem } from '../VideoEditor';

interface ActiveMediaDisplayProps {
  activeVideos: TimelineItem[];
  activeAudios: TimelineItem[];
}

const ActiveMediaDisplay: React.FC<ActiveMediaDisplayProps> = ({
  activeVideos,
  activeAudios
}) => {
  return (
    <div className="p-2 bg-editor-panel/50 border-t border-white/10 h-8 overflow-hidden">
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-white/70">Active:</span>
        <div className="flex flex-wrap gap-1">
          {activeVideos.map(video => (
            <div key={video.id} className="text-[10px] bg-yellow-400/20 px-1 py-0.5 rounded text-white/90">
              📹 {video.name}
            </div>
          ))}
          {activeAudios.map(audio => (
            <div key={audio.id} className="text-[10px] bg-blue-400/20 px-1 py-0.5 rounded text-white/90">
              🔊 {audio.name} ({Math.round(audio.volume! * 100)}%)
            </div>
          ))}
          {activeVideos.length === 0 && activeAudios.length === 0 && (
            <div className="text-[10px] text-white/50">No active media</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveMediaDisplay;
