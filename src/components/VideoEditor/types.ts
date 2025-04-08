
// Define common types used across the VideoEditor components

export interface TimelineItem {
  id: string;
  trackId: string;
  start: number;
  duration: number;
  type: 'video' | 'audio' | 'image' | 'text';
  name: string;
  color: string;
  src: string;
  thumbnail?: string;
  volume?: number;
}
