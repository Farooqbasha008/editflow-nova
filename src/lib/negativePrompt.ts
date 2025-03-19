/**
 * Generate negative prompts using predefined rules and patterns
 */

// Common negative prompts for better image quality
const COMMON_NEGATIVE_PATTERNS = [
  'blurry',
  'low quality',
  'bad anatomy',
  'bad proportions',
  'deformed',
  'disfigured',
  'mutated',
  'extra limbs',
  'missing limbs',
  'disconnected limbs',
  'malformed hands',
  'poorly drawn hands',
  'extra fingers',
  'fused fingers',
  'too many fingers',
  'missing fingers',
  'watermark',
  'signature',
  'text',
  'logo',
  'cropped',
  'worst quality',
  'jpeg artifacts',
  'compression artifacts',
];

// Keywords that suggest specific negative patterns
const CONTEXT_PATTERNS = {
  person: [
    'deformed face',
    'ugly face',
    'bad face',
    'asymmetric face',
    'distorted face',
  ],
  landscape: [
    'power lines',
    'telephone poles',
    'cars',
    'modern buildings',
    'trash',
    'litter',
  ],
  object: [
    'duplicate',
    'multiple',
    'deformed',
    'broken',
    'incomplete',
  ],
};

/**
 * Generate a negative prompt based on the input prompt
 * @param prompt The input prompt to analyze
 * @returns A generated negative prompt
 */
export function generateNegativePrompt(prompt: string): string {
  const lowercasePrompt = prompt.toLowerCase();
  let negativePatterns = [...COMMON_NEGATIVE_PATTERNS];

  // Add context-specific patterns
  if (lowercasePrompt.includes('person') || 
      lowercasePrompt.includes('people') || 
      lowercasePrompt.includes('portrait')) {
    negativePatterns = [...negativePatterns, ...CONTEXT_PATTERNS.person];
  }

  if (lowercasePrompt.includes('landscape') || 
      lowercasePrompt.includes('nature') || 
      lowercasePrompt.includes('scenery')) {
    negativePatterns = [...negativePatterns, ...CONTEXT_PATTERNS.landscape];
  }

  if (lowercasePrompt.includes('object') || 
      lowercasePrompt.includes('item') || 
      lowercasePrompt.includes('thing')) {
    negativePatterns = [...negativePatterns, ...CONTEXT_PATTERNS.object];
  }

  // Join patterns with commas
  return negativePatterns.join(', ');
}