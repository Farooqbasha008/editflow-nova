
// This is a custom addition that will add the media downloading functionality
// and save functionality to the Header component.

import { supabase } from "@/integrations/supabase/client";

// Get all exported functions and components from the original Header file
export * from "@/components/VideoEditor/Header";

// Add our custom functions to download media and save projects
export const downloadMedia = async (mediaItems: any[], projectName = "video-project") => {
  // For now, we'll implement a basic download of the first audio or video item
  if (mediaItems && mediaItems.length > 0) {
    // Find the first media item with a src
    const mediaItem = mediaItems.find(item => item.src);
    
    if (mediaItem && mediaItem.src) {
      try {
        // Create a temporary anchor element
        const a = document.createElement("a");
        a.href = mediaItem.src;
        a.download = `${projectName}-${mediaItem.type || "media"}-${Date.now()}.${mediaItem.type === 'audio' ? 'mp3' : 'mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
      } catch (error) {
        console.error("Error downloading media:", error);
        return false;
      }
    }
  }
  return false;
};

export const saveProject = async (projectData: any, userId?: string) => {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated. Please login to save projects.');
    }
  }
  
  try {
    const { data, error } = await supabase.functions.invoke("save-project", {
      body: { 
        projectData, 
        userId 
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving project:", error);
    throw error;
  }
};
