
// We can't modify VideoEditor.tsx directly as it's read-only, but we can create a wrapper
// component that adds the functionality we need.

import { supabase } from "@/integrations/supabase/client";
import { downloadMedia, saveProject } from "./Header";

// Re-export the TimelineItem type using 'export type' syntax
export type { TimelineItem } from "./types";

// Since we can't directly import the original VideoEditor component (it would create a circular reference),
// let's just re-export the default export from the actual VideoEditor component
import VideoEditor from "@/components/VideoEditor/VideoEditor";
export default VideoEditor;

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
