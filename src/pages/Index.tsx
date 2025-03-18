
import React from 'react';
import VideoEditor from '@/components/VideoEditor/VideoEditor';
import { Toaster } from "@/components/ui/sonner";
import { 
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable";

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-editor-bg">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <VideoEditor />
      </ResizablePanelGroup>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Index;
