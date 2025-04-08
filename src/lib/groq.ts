/**
 * Groq API integration for LLM capabilities
 */

// Default model to use for LLM
const DEFAULT_MODEL = 'qwen-qwq-32b';

/*
 * Interface for image generation parameters
 */
interface ImageGenerationParams {
  negativePrompt: string;
  steps: number;
  cfgScale: number;
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
  model: string = DEFAULT_MODEL
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
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response from the LLM
    try {
      // Extract JSON object from the response if it's wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const params = JSON.parse(jsonStr);
      
      return {
        negativePrompt: params.negativePrompt || '',
        steps: Math.min(Math.max(params.steps || 30, 20), 50), // Ensure steps is between 20-50
        cfgScale: Math.min(Math.max(params.cfgScale || 7.5, 5), 10) // Ensure cfgScale is between 5-10
      };
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      // Return default parameters if parsing fails
      return {
        negativePrompt: '',
        steps: 30,
        cfgScale: 7.5
      };
    }
  } catch (error) {
    console.error('Error calling Groq API:', error);
    // Return default parameters if API call fails
    return {
      negativePrompt: '',
      steps: 30,
      cfgScale: 7.5
    };
  }
}