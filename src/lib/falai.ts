
/**
 * Fal.ai API integration for text-to-video generation
 */ 
import * as fal from "@fal-ai/serverless-client";

// Default model to use for text-to-video generation
const DEFAULT_MODEL = "fal-ai/wan/v2.1/1.3b/text-to-video";

// Define interface for video generation options
export interface VideoGenerationOptions {
  model?: string;
  negativePrompt?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export async function generateVideo(prompt: string, apiKey: string, options: VideoGenerationOptions = {}) {
    if (!apiKey) {
        throw new Error('Fal.ai API key is required');
    }
    
    const model = options.model || DEFAULT_MODEL;
    
    try {
        // Configure the fal client with the API key
        fal.config({
            credentials: apiKey
        });
        
        console.log(`Generating video with prompt: ${prompt}`);
        
        const result = await fal.subscribe(model, {
            input: {
                prompt,
                negative_prompt: options.negativePrompt || ""
            },
            logs: true,
            onQueueUpdate: (update: any) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map((log: any) => log.message).forEach(console.log);
                }
            }
        });
        
        console.log("Video generation complete:", result);
        
        // Properly handle type checking for result
        const responseData = result as { data?: { video_url?: string } };
        
        // Return video URL from the result data
        if (responseData.data && responseData.data.video_url) {
            return responseData.data.video_url;
        } else {
            throw new Error("No video URL returned from Fal.ai");
        }
    } catch (error) {
        console.error('Error generating video:', error);
        throw error;
    }
}
