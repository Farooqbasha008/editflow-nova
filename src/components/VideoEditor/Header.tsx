
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Save, Edit2, ArrowLeft } from "lucide-react";
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
    <div className="flex items-center justify-between w-full h-14 px-4 bg-[#151514] border-b border-white/10 animate-fade-in">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[#F7F8F6]/80 gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={18} />
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
              className="bg-editor-panel border-[#D7F266] text-[#F7F8F6] max-w-[200px]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-[#F7F8F6]">{projectName}</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#F7F8F6]/50 hover:text-[#F7F8F6]"
              onClick={handleStartEditing}
            >
              <Edit2 size={14} />
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-[#F7F8F6] border-[#F7F8F6]/20 bg-[#151514]/50 hover:bg-[#151514]/70"
          onClick={onSave}
        >
          <Save size={16} className="mr-2" />
          Save
        </Button>
        <Button 
          className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] flex items-center gap-2 rounded-full transition-all duration-300"
          onClick={onExport}
        >
          <Download size={16} />
          Download
        </Button>
      </div>
    </div>
  );
};

export default Header;
