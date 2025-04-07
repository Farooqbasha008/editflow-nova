
// We can't modify VideoEditor.tsx directly as it's read-only, but we can create a wrapper
// component that adds the functionality we need.

import { supabase } from "@/integrations/supabase/client";
import { downloadMedia, saveProject } from "./Header";

// Get all exported functions and components from the original VideoEditor file
export * from "@/components/VideoEditor/VideoEditor";

// Add our custom event handlers
document.addEventListener("videoeditor:download", async (e: any) => {
  const items = e.detail?.timelineItems || [];
  try {
    const result = await downloadMedia(items, e.detail?.projectName || "video-project");
    if (result) {
      console.log("Media download successful");
    } else {
      console.error("No media found to download");
    }
  } catch (error) {
    console.error("Error downloading media:", error);
  }
});

document.addEventListener("videoeditor:save", async (e: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not authenticated. Please login to save projects.");
      return;
    }
    
    const projectData = {
      id: e.detail?.projectId,
      name: e.detail?.projectName || "Untitled Project",
      duration: e.detail?.duration || 600,
      timelineItems: e.detail?.timelineItems || []
    };
    
    const result = await saveProject(projectData, user.id);
    console.log("Project saved successfully:", result);
  } catch (error) {
    console.error("Error saving project:", error);
  }
});
