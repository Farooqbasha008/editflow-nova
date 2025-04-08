interface SpeechOptions {
  voiceId?: string;
}

interface SoundOptions {
  type: 'bgm' | 'sfx';
  duration: number;
}

export async function generateSpeech(
  text: string,
  apiKey: string,
  options: SpeechOptions = {}
): Promise<string> {
  const { voiceId = 'default' } = options;
  
  try {
    // TODO: Implement ElevenLabs API call
    const mockUrl = `https://example.com/speech-${Date.now()}.mp3`;
    return mockUrl;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech with ElevenLabs');
  }
}

export async function generateSound(
  prompt: string,
  apiKey: string,
  options: SoundOptions
): Promise<string> {
  try {
    // TODO: Implement ElevenLabs sound generation API call
    const mockUrl = `https://example.com/sound-${Date.now()}.mp3`;
    return mockUrl;
  } catch (error) {
    console.error('Error generating sound:', error);
    throw new Error('Failed to generate sound with ElevenLabs');
  }
}
