
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { projectData, userId } = await req.json()

    if (!projectData) {
      return new Response(
        JSON.stringify({ error: 'Project data is required' }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      )
    }

    // Create or update project
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .upsert({
        id: projectData.id || undefined,
        name: projectData.name || 'Untitled Project',
        user_id: userId,
        duration: projectData.duration || 600,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (projectError) {
      throw new Error(`Error saving project: ${projectError.message}`)
    }

    // Delete existing timeline items for this project if it's being updated
    if (projectData.id) {
      await supabaseClient
        .from('timeline_items')
        .delete()
        .match({ project_id: projectData.id })
    }

    // Insert new timeline items
    if (projectData.timelineItems && projectData.timelineItems.length > 0) {
      const timelineItemsToInsert = projectData.timelineItems.map((item: any) => ({
        project_id: project.id,
        name: item.name,
        item_type: item.type,
        src: item.src,
        start: item.start,
        duration: item.duration,
        track_id: item.trackId,
        color: item.color,
        volume: item.volume || 1,
        thumbnail: item.thumbnail
      }))

      const { error: timelineError } = await supabaseClient
        .from('timeline_items')
        .insert(timelineItemsToInsert)

      if (timelineError) {
        throw new Error(`Error saving timeline items: ${timelineError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, projectId: project.id }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
