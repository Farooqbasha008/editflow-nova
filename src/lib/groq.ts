/**
 * Groq API integration for LLM capabilities and text-to-speech
 */

// Default models to use
const DEFAULT_LLM_MODEL = 'qwen-qwq-32b';
const DEFAULT_TTS_MODEL = 'playai-tts';

// Default voice ID for TTS
const DEFAULT_VOICE = 'Fritz-PlayAI'; // PlayAI voices include: Fritz-PlayAI, Mary-PlayAI, Chloe-PlayAI, etc.

/*
 * Interface for image generation parameters
 */
interface ImageGenerationParams {
  negativePrompt: string;
  steps: number;
  cfgScale: number;
}

/**
 * Speech generation options
 */
export interface SpeechGenerationOptions {
  voiceId?: string;
  model?: string;
  speed?: number;
  stability?: number;
}

/**
 * Generate speech using Groq's text-to-speech API
 * @param text The text to convert to speech
 * @param apiKey The Groq API key
 * @param options Additional options for speech generation
 * @returns A Promise that resolves to an audio URL
 */
export async function generateSpeech(
  text: string,
  apiKey: string,
  options: SpeechGenerationOptions = {}
): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API key is required');
  }

  const voiceId = options.voiceId || DEFAULT_VOICE;
  const model = options.model || DEFAULT_TTS_MODEL;
  
  try {
    // Make the API call to Groq for text-to-speech
    const response = await fetch(`https://api.groq.com/openai/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: text,
        voice: voiceId,
        response_format: 'mp3',
        // Additional parameters can be added as Groq's API evolves
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${errorData || response.statusText}`);
    }

    // In a real implementation, you would either:
    // 1. Convert the audio blob to a base64 string
    // 2. Save the audio to a file and return the URL
    // 3. Stream the audio directly to the client
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  } catch (error) {
    console.error('Error generating speech with Groq:', error);
    throw error;
  }
}

/**
 * Get optimized parameters for image generation using Groq LLM
 * @param prompt The text prompt for image generation
 * @param dimensions The dimensions of the image (e.g., "512x512")
 * @param apiKey The Groq API key
 * @returns A Promise that resolves to optimized image generation parameters
 */
export async function getOptimizedParams(
  prompt: string,
  dimensions: string,
  apiKey: string,
  model: string = DEFAULT_LLM_MODEL
): Promise<ImageGenerationParams> {
  if (!apiKey) {
    // Return default parameters if no API key is provided
    return {
      negativePrompt: '',
      steps: 30,
      cfgScale: 7.5
    };
  }

  try {
    // Prepare the system message and user prompt for the LLM
    const systemMessage = "You are an AI assistant specialized in optimizing parameters for image generation. Based on the user's prompt and desired image dimensions, suggest the best parameters for stable diffusion image generation.";
    
    const userPrompt = `Given the following prompt: "${prompt}" and dimensions: ${dimensions}, provide the optimal parameters for image generation. Return only a JSON object with these fields: negativePrompt (string), steps (number between 20-50), and cfgScale (number between 5-10).`;
    
    // Make the API call to Groq
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${errorData || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const params = JSON.parse(content);
      return {
        negativePrompt: params.negativePrompt || '',
        steps: params.steps || 30,
        cfgScale: params.cfgScale || 7.5
      };
    } catch (parseError) {
      console.error('Error parsing Groq response:', parseError);
      // Return default parameters if parsing fails
      return {
        negativePrompt: '',
        steps: 30,
        cfgScale: 7.5
      };
    }
  } catch (error) {
    console.error('Error getting optimized parameters from Groq:', error);
    // Return default parameters if API call fails
    return {
      negativePrompt: '',
      steps: 30,
      cfgScale: 7.5
    };
  }
}
