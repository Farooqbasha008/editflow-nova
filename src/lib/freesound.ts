
interface FreeSoundParams {
  query?: string;
  page?: number;
  page_size?: number;
  fields?: string;
  filter?: string;
  sort?: string;
  token: string;
}

interface FreeSoundResult {
  id: number;
  name: string;
  url: string;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
  };
  duration: number;
  username: string;
  license: string;
  description: string;
  tags: string[];
}

interface FreeSoundResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FreeSoundResult[];
}

const API_URL = 'https://freesound.org/apiv2';
const CLIENT_ID = 'YOUR_CLIENT_ID'; // This is a public client ID for demo purposes

/**
 * Search for sounds on FreeSoundAPI
 */
export const searchFreeSounds = async (params: Omit<FreeSoundParams, 'token'>): Promise<FreeSoundResponse> => {
  try {
    // Create a record of strings for URLSearchParams
    const searchParamsObj: Record<string, string> = {
      token: CLIENT_ID,
      fields: params.fields || 'id,name,url,previews,duration,username,license,description,tags',
    };
    
    // Add optional parameters if they exist
    if (params.query) searchParamsObj.query = params.query;
    if (params.page) searchParamsObj.page = params.page.toString();
    if (params.page_size) searchParamsObj.page_size = params.page_size.toString();
    if (params.filter) searchParamsObj.filter = params.filter;
    if (params.sort) searchParamsObj.sort = params.sort;
    
    const searchParams = new URLSearchParams(searchParamsObj);
    
    const response = await fetch(`${API_URL}/search/text/?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`FreeSoundAPI Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching FreeSoundAPI:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific sound
 */
export const getSoundDetails = async (soundId: number): Promise<FreeSoundResult> => {
  try {
    const response = await fetch(`${API_URL}/sounds/${soundId}/?token=${CLIENT_ID}`);
    
    if (!response.ok) {
      throw new Error(`FreeSoundAPI Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching sound details:', error);
    throw error;
  }
};

/**
 * Formats FreeSoundResult to TimelineItem format
 */
export const formatSoundToTimelineItem = (sound: FreeSoundResult) => {
  return {
    id: `timeline-${Date.now()}`,
    trackId: 'track3', // Default to Audio 1 track
    start: 0, // Will be positioned at the start or after last item
    duration: sound.duration || 5,
    type: 'audio' as const,
    name: sound.name || 'Freesound Audio',
    color: 'bg-blue-400/70',
    src: sound.previews['preview-hq-mp3'],
    thumbnail: '',
    volume: 1.0
  };
};

export default {
  searchFreeSounds,
  getSoundDetails,
  formatSoundToTimelineItem
};
