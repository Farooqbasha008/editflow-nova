/**
 * Hugging Face API integration for image generation
 */

// Default model to use for image generation
const DEFAULT_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

/**
 * Generate an image using Hugging Face's Inference API
 * @param prompt The text prompt to generate an image from
 * @param apiKey The Hugging Face API key
 * @param options Additional options for image generation
 * @returns A Promise that resolves to a base64 encoded image
 */
export type ImageOrientation = 'portrait' | 'landscape';

export async function generateImage(
  prompt: string,
  apiKey: string,
  options: {
    negativePrompt?: string;
    steps?: number;
    cfgScale?: number;
    model?: string;
    orientation?: ImageOrientation;
  } = {}
): Promise<string> {
  if (!apiKey) {
    throw new Error('Hugging Face API key is required');
  }

  const model = options.model || DEFAULT_MODEL;
  
  // Set dimensions based on orientation
  const width = options.orientation === 'portrait' ? 1080 : 1920;
  const height = options.orientation === 'portrait' ? 1920 : 1080;

  const payload = {
    inputs: prompt,
    parameters: {
      negative_prompt: options.negativePrompt || '',
      num_inference_steps: options.steps || 30,
      guidance_scale: options.cfgScale || 7.5,
      width,
      height
    }
  };

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}${error ? ' - ' + JSON.stringify(error) : ''}`);
    }

    // The API returns the image as binary data
    const imageBlob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}