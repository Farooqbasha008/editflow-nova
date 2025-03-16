
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Save, Undo, Redo, Layout } from "lucide-react";

const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-between w-full h-14 px-4 bg-editor-bg border-b border-white/10 animate-fade-in">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white/80 gap-2"
          onClick={() => window.history.back()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back
        </Button>
      </div>
      
      <div className="flex items-center">
        <h1 className="text-xl font-medium text-white">Untitled Project</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
          <Undo size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
          <Redo size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
          <Save size={18} />
        </Button>
        <Button className="bg-editor-accent hover:bg-editor-accent-hover text-white flex items-center gap-2 rounded-full transition-all duration-300">
          <Download size={16} />
          Export
        </Button>
      </div>
    </div>
  );
};

export default Header;
