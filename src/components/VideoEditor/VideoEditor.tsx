
// This is just updating the handler for video volume changes in VideoEditor.tsx

// Update the event listener for video volume changes
useEffect(() => {
  const handleVideoVolumeChange = (e: CustomEvent<{id: string, volume: number}>) => {
    if (e.detail && e.detail.id) {
      const item = timelineItems.find(item => item.id === e.detail.id);
      if (item) {
        handleUpdateTimelineItem({
          ...item,
          volume: e.detail.volume
        });
      }
    }
  };
  
  window.addEventListener('video-volume-change', handleVideoVolumeChange as EventListener);
  
  return () => {
    window.removeEventListener('video-volume-change', handleVideoVolumeChange as EventListener);
  };
}, [timelineItems]);
