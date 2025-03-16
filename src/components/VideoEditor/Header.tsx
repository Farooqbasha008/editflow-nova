
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Save, Undo, Redo, Layout, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  projectName: string;
  onRename: (name: string) => void;
  onSave: () => void;
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  projectName, 
  onRename, 
  onSave, 
  onExport 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(projectName);

  const handleStartEditing = () => {
    setEditedName(projectName);
    setIsEditing(true);
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      onRename(editedName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

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
        {isEditing ? (
          <div className="flex items-center">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-editor-panel border-editor-accent text-white max-w-[200px]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-white">{projectName}</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/50 hover:text-white"
              onClick={handleStartEditing}
            >
              <Edit2 size={14} />
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
          <Undo size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
          <Redo size={18} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white/70 hover:text-white"
          onClick={onSave}
        >
          <Save size={18} />
        </Button>
        <Button 
          className="bg-editor-accent hover:bg-editor-accent-hover text-white flex items-center gap-2 rounded-full transition-all duration-300"
          onClick={onExport}
        >
          <Download size={16} />
          Export
        </Button>
      </div>
    </div>
  );
};

export default Header;
