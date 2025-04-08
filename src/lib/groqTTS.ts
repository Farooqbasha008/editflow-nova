/**
 * Groq PlayAI Text-to-Speech API integration
 */

// Default model to use for TTS
const DEFAULT_TTS_MODEL = 'playai-tts';

// Default voice ID for TTS (Groq requires '-PlayAI' suffix which is added automatically)
const DEFAULT_VOICE = 'Fritz'; // Groq supports various voices

/**
 * Speech generation options
 */
export interface SpeechGenerationOptions {
  voiceId?: string;
  model?: string;
  speed?: number;
  stability?: number;
  trimSilence?: boolean; // Option to trim silence from the beginning and end of audio
}

/**
 * Generate speech using Groq's PlayAI text-to-speech API
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
  const speed = options.speed || 1.0;
  const stability = options.stability || 0.5;

  try {
    // Make the API call to Groq PlayAI for text-to-speech
    // Append '-PlayAI' suffix to voice ID as required by Groq API
    const formattedVoiceId = `${voiceId}-PlayAI`;
    
    const response = await fetch(`https://api.groq.com/openai/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: text,
        voice: formattedVoiceId,
        speed: speed,
        // Additional parameters can be added as Groq's API evolves
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${errorData || response.statusText}`);
    }

    // Convert the audio blob to a URL
    const audioBlob = await response.blob();
    
    // Apply silence trimming if enabled
    if (options.trimSilence) {
      const trimmedBlob = await trimSilenceFromAudio(audioBlob);
      const audioUrl = URL.createObjectURL(trimmedBlob);
      return audioUrl;
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  } catch (error) {
    console.error('Error generating speech with Groq PlayAI:', error);
    throw error;
  }
}

/**
 * Available voices in Groq PlayAI
 * Note: The '-PlayAI' suffix is automatically appended to these voice IDs when making API requests
 */
/**
 * Trims silence from the beginning and end of an audio blob
 * @param audioBlob The audio blob to process
 * @returns A Promise that resolves to a processed audio blob with silence removed
 */
async function trimSilenceFromAudio(audioBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a file reader to read the blob
    const fileReader = new FileReader();
    
    fileReader.onload = async (event) => {
      try {
        // Decode the audio data
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the audio data
        const channelData = audioBuffer.getChannelData(0); // Use the first channel
        
        // Define the silence threshold (adjust as needed)
        const silenceThreshold = 0.01; // Values below this are considered silence
        
        // Find the start and end points (trim silence)
        let startIndex = 0;
        let endIndex = channelData.length - 1;
        
        // Find the first non-silent sample from the beginning
        while (startIndex < channelData.length && Math.abs(channelData[startIndex]) < silenceThreshold) {
          startIndex++;
        }
        
        // Find the last non-silent sample from the end
        while (endIndex > startIndex && Math.abs(channelData[endIndex]) < silenceThreshold) {
          endIndex--;
        }
        
        // Add a small buffer (100ms) to avoid cutting off speech too abruptly
        const bufferSamples = audioBuffer.sampleRate * 0.1;
        startIndex = Math.max(0, startIndex - bufferSamples);
        endIndex = Math.min(channelData.length - 1, endIndex + bufferSamples);
        
        // Create a new buffer with the trimmed audio
        const trimmedLength = endIndex - startIndex + 1;
        const trimmedBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          trimmedLength,
          audioBuffer.sampleRate
        );
        
        // Copy the trimmed audio data to the new buffer
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          const trimmedChannelData = trimmedBuffer.getChannelData(channel);
          
          for (let i = 0; i < trimmedLength; i++) {
            trimmedChannelData[i] = channelData[startIndex + i];
          }
        }
        
        // Convert the trimmed buffer back to a blob
        const offlineContext = new OfflineAudioContext(
          trimmedBuffer.numberOfChannels,
          trimmedBuffer.length,
          trimmedBuffer.sampleRate
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = trimmedBuffer;
        source.connect(offlineContext.destination);
        source.start(0);
        
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert the rendered buffer to a WAV blob
        const wavBlob = audioBufferToWav(renderedBuffer);
        resolve(wavBlob);
      } catch (error) {
        console.error('Error processing audio:', error);
        // If there's an error, return the original blob
        resolve(audioBlob);
      } finally {
        audioContext.close();
      }
    };
    
    fileReader.onerror = () => {
      console.error('Error reading audio file');
      resolve(audioBlob); // Return original on error
    };
    
    fileReader.readAsArrayBuffer(audioBlob);
  });
}

/**
 * Converts an AudioBuffer to a WAV Blob
 * @param buffer The AudioBuffer to convert
 * @returns A Blob containing the WAV data
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numOfChannels * 2;
  const sampleRate = buffer.sampleRate;
  
  // Create the WAV file header
  const wavDataView = new DataView(new ArrayBuffer(44 + length));
  
  // "RIFF" chunk descriptor
  writeString(wavDataView, 0, 'RIFF');
  wavDataView.setUint32(4, 36 + length, true);
  writeString(wavDataView, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(wavDataView, 12, 'fmt ');
  wavDataView.setUint32(16, 16, true); // subchunk1size
  wavDataView.setUint16(20, 1, true); // audio format (PCM)
  wavDataView.setUint16(22, numOfChannels, true);
  wavDataView.setUint32(24, sampleRate, true);
  wavDataView.setUint32(28, sampleRate * numOfChannels * 2, true); // byte rate
  wavDataView.setUint16(32, numOfChannels * 2, true); // block align
  wavDataView.setUint16(34, 16, true); // bits per sample
  
  // "data" sub-chunk
  writeString(wavDataView, 36, 'data');
  wavDataView.setUint32(40, length, true);
  
  // Write the PCM samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      wavDataView.setInt16(offset, value, true);
      offset += 2;
    }
  }
  
  return new Blob([wavDataView], { type: 'audio/wav' });
}

/**
 * Helper function to write a string to a DataView
 */
function writeString(dataView: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    dataView.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const GROQ_VOICES = [
  { id: 'Aaliyah', name: 'Aaliyah' },
  { id: 'Adelaide', name: 'Adelaide' },
  { id: 'Angelo', name: 'Angelo' },
  { id: 'Arista', name: 'Arista' },
  { id: 'Atlas', name: 'Atlas' },
  { id: 'Basil', name: 'Basil' },
  { id: 'Briggs', name: 'Briggs' },
  { id: 'Calum', name: 'Calum' },
  { id: 'Celeste', name: 'Celeste' },
  { id: 'Cheyenne', name: 'Cheyenne' },
  { id: 'Chip', name: 'Chip' },
  { id: 'Cillian', name: 'Cillian' },
  { id: 'Deedee', name: 'Deedee' },
  { id: 'Eleanor', name: 'Eleanor' },
  { id: 'Fritz', name: 'Fritz' },
  { id: 'Gail', name: 'Gail' },
  { id: 'Indigo', name: 'Indigo' },
  { id: 'Jennifer', name: 'Jennifer' },
  { id: 'Judy', name: 'Judy' },
  { id: 'Mamaw', name: 'Mamaw' },
  { id: 'Mason', name: 'Mason' },
  { id: 'Mikail', name: 'Mikail' },
  { id: 'Mitch', name: 'Mitch' },
  { id: 'Nia', name: 'Nia' },
  { id: 'Quinn', name: 'Quinn' },
  { id: 'Ruby', name: 'Ruby' },
  { id: 'Thunder', name: 'Thunder' },
];