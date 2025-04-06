
/**
 * Fal.ai API integration for text-to-video generation
 */
import * as fal from "@fal-ai/client";

// Default model to use for text-to-video generation
const DEFAULT_MODEL = "fal-ai/wan/v2.1/1.3b/text-to-video";

/**
 * Generate a video clip using Fal.ai's text-to-video API
 * @param prompt The text prompt to generate a video from
 * @param apiKey The Fal.ai API key
 * @param options Additional options for video generation
 * @returns A Promise that resolves to a video URL
 */
export interface VideoGenerationOptions {
  negativePrompt?: string;
  duration?: number; // in seconds
  fps?: number;
  width?: number;
  height?: number;
  model?: string;
}

// Define interfaces for the fal.ai API response
interface FalVideoData {
  video_url: string;
  [key: string]: any;
}

interface FalResponse {
  data: FalVideoData;
  logs?: string[];
  [key: string]: any;
}

export async function generateVideo(
  prompt: string,
  apiKey: string,
  options: VideoGenerationOptions = {}
): Promise<string> {
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
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    }) as FalResponse;

    console.log("Video generation complete:", result.data);
    
    // Return video URL from the result data
    if (result.data && result.data.video_url) {
      return result.data.video_url;
    } else {
      throw new Error("No video URL returned from Fal.ai");
    }
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}
