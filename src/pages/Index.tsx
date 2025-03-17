
import React from 'react';
import VideoEditor from '@/components/VideoEditor/VideoEditor';
import { Toaster } from "@/components/ui/sonner";

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-editor-bg">
      <VideoEditor />
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Index;
