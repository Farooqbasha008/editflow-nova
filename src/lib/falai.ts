import { fal } from "@fal-ai/client";

interface VideoGenerationOptions {
  duration?: number;
  negativePrompt?: string;
}

export async function generateVideo(
  prompt: string,
  apiKey: string,
  options: VideoGenerationOptions = {}
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

    const result = await fal.subscribe('fal-ai/wan/v2.1/1.3b/text-to-video', {
      input: {
        prompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 30,
        guidance_scale: 12.5,
        seed: Math.floor(Math.random() * 1000000)
      },
      pollInterval: 5000
    });

    if (!result) {
      throw new Error('No response from API');
    }

    // Access the first video URL from the response
    const videoUrl = (result as any)?.artifacts?.[0]?.url;
    if (!videoUrl) {
      throw new Error('No video URL in the response');
    }

    return videoUrl;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}
