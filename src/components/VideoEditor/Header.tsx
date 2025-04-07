
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Save, Edit2, ArrowLeft, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
}

interface HeaderProps {
  projectName: string;
  onRename: (name: string) => void;
  onSave: () => void;
  onExport: () => void;
  currentProjectId?: string | null;
  onLoadProject: (projectId: string) => void;
  isLoadingProject?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  projectName, 
  onRename, 
  onSave, 
  onExport,
  currentProjectId,
  onLoadProject,
  isLoadingProject = false
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(projectName);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
  
  const handleOpenProjectDialog = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fixed TypeScript error by using correct typing for the query
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      setProjects(data || []);
      setOpenProjectDialog(true);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
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
        
        <Button
          variant="ghost"
          size="sm"
          className="text-[#F7F8F6]/80 gap-2 ml-2"
          onClick={handleOpenProjectDialog}
          disabled={isLoading || !user}
        >
          <FolderOpen size={18} />
          Open
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
          disabled={!user}
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
      
      <Dialog open={openProjectDialog} onOpenChange={setOpenProjectDialog}>
        <DialogContent className="sm:max-w-[500px] bg-[#1E1E1D] text-[#F7F8F6] border-[#333]">
          <DialogHeader>
            <DialogTitle className="text-[#F7F8F6]">Open Project</DialogTitle>
            <DialogDescription className="text-[#F7F8F6]/70">
              Select a project to load
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto pr-2">
            {projects.length === 0 ? (
              <div className="py-8 text-center text-[#F7F8F6]/60">
                No projects found. Create a new project by adding items to the timeline and saving.
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      currentProjectId === project.id 
                        ? 'bg-[#D7F266]/10 border border-[#D7F266]/30' 
                        : 'bg-[#2A2A29] hover:bg-[#2A2A29]/80'
                    }`}
                    onClick={() => {
                      onLoadProject(project.id);
                      setOpenProjectDialog(false);
                    }}
                  >
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-[#F7F8F6]/60 mt-1">
                      Last updated: {formatDate(project.updated_at || project.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Header;
