export interface Track {
  trackId: number;
  artistName: string;
  trackName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  releaseDate?: string;
  country?: string;
}

export interface SearchResponse {
  resultCount: number;
  results: Track[];
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
}

export interface VibeProfile {
  genre?: string;
  energy?: 'low' | 'medium' | 'high';
  mood?: 'happy' | 'sad' | 'energetic' | 'relaxed' | 'party' | 'chill';
  tempo?: 'slow' | 'medium' | 'fast';
  language?: 'english' | 'hindi' | 'spanish' | 'french' | 'korean' | 'japanese' | 'arabic' | 'portuguese' | 'punjabi' | 'marathi' | 'tamil' | 'telugu' | 'gujarati' | 'bengali' | 'rajasthani' | 'kannada' | 'malayalam' | 'other';
  primaryGenre?: string;
  filmIndustry?: 'bollywood' | 'hollywood' | 'tollywood' | 'kollywood' | 'mollywood' | 'sandalwood' | 'punjabi_cinema' | 'bhojpuri' | 'marathi_cinema' | 'international' | 'other';
}

export interface DJQueue {
  id: string;
  tracks: Track[];
  currentIndex: number;
  isActive: boolean;
  vibeProfile?: VibeProfile;
  createdAt: string;
}

export interface DJPlaylist {
  id: string;
  name: string;
  tracks: Track[];
  playedTracks: number[]; // trackIds that have been played
  vibeProfile: VibeProfile;
  autoPlay: boolean;
  createdAt: string;
}

export interface DJState {
  isActive: boolean;
  currentQueue: DJQueue | null;
  autoQueue: boolean;
  nextTracks: Track[];
  playedTracks: Track[];
  currentVibeProfile: VibeProfile | null;
  selectedMode: DJMode | null;
}

export interface DJMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  language: string;
  genres: string[];
  searchQueries: string[];
  mood: 'party' | 'romantic' | 'energetic' | 'chill' | 'dance' | 'wedding';
  energy: 'low' | 'medium' | 'high';
  vibeProfile: VibeProfile;
}
