import { fal } from "@fal-ai/client";

interface ScriptGenerationOptions {
  duration?: number;
  negativePrompt?: string;
}

// Define possible response formats based on API documentation
interface FalApiResponse {
  // Format 1: As per documentation
  video?: {
    url: string;
  };
  seed?: number;
  
  // Format 2: Artifacts array format
  artifacts?: Array<{
    url?: string;
  }>;
  
  // Format 3: Data wrapper format
  data?: {
    video?: {
      url: string;
    };
  };
}

export async function generateVideo(
  prompt: string,
  apiKey: string,
  options: ScriptGenerationOptions = {}
): Promise<string> {
  const { 
    duration = 5, 
    negativePrompt = 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting'
  } = options;

  if (!apiKey) {
    throw new Error('Fal.ai API key is required');
  }

  try {
    fal.config({ credentials: apiKey });

    // Log the request for debugging
    console.log('Sending request to Fal.ai with prompt:', prompt);
    
    const result = await fal.subscribe('fal-ai/wan/v2.1/1.3b/text-to-video', {
      input: {
        prompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 30,
        guidance_scale: 12.5,
        seed: Math.floor(Math.random() * 1000000)
      },
      pollInterval: 5000,
      logs: true
    });

    if (!result) {
      throw new Error('No response from API');
    }

    // Log the full response for debugging
    console.log('Fal.ai API response:', JSON.stringify(result, null, 2));

    // Try multiple possible response formats
    const response = result as FalApiResponse;
    
    // Check for different possible URL locations in the response
    let videoUrl = response.video?.url;
    
    if (!videoUrl && response.artifacts && response.artifacts.length > 0) {
      videoUrl = response.artifacts[0]?.url;
    }
    
    if (!videoUrl && response.data?.video?.url) {
      videoUrl = response.data.video.url;
    }

    if (!videoUrl) {
      console.error('Unable to find video URL in response:', response);
      throw new Error('No video URL in the response');
    }

    return videoUrl;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}
