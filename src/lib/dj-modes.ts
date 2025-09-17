import { DJMode } from './types';

// Predefined DJ Party Modes with curated search queries and vibes
export const DJ_MODES: DJMode[] = [
  {
    id: 'daaru-party',
    name: 'Daaru Party',
    description: 'High-energy Punjabi party anthems for drinking celebrations',
    icon: '🍻',
    language: 'punjabi',
    genres: ['Punjabi', 'Hip-Hop/Rap', 'Dance', 'Pop'],
    searchQueries: [
      'punjabi party songs',
      'daru badnaam',
      'punjabi daaru songs',
      'drunk punjabi',
      'punjabi celebration',
      'jatt party',
      'punjabi club hits',
      'bhangra party'
    ],
    mood: 'party',
    energy: 'high',
    vibeProfile: {
      language: 'punjabi',
      energy: 'high',
      mood: 'party',
      tempo: 'fast',
      primaryGenre: 'Punjabi',
      filmIndustry: 'punjabi_cinema'
    }
  },
  {
    id: 'wedding-party',
    name: 'Wedding Party',
    description: 'Mixed celebratory songs perfect for wedding festivities',
    icon: '💒',
    language: 'hindi',
    genres: ['Bollywood', 'Punjabi', 'Pop', 'Dance'],
    searchQueries: [
      'bollywood wedding songs',
      'indian wedding music',
      'sangam songs',
      'shaadi ke gane',
      'wedding celebration',
      'mehendi songs',
      'baraat songs',
      'punjabi wedding'
    ],
    mood: 'wedding',
    energy: 'high',
    vibeProfile: {
      language: 'hindi',
      energy: 'high',
      mood: 'party',
      tempo: 'fast',
      primaryGenre: 'Bollywood',
      filmIndustry: 'bollywood'
    }
  },
  {
    id: 'punjabi-songs',
    name: 'Punjabi Vibes',
    description: 'Pure Punjabi music collection with authentic regional sounds',
    icon: '🎵',
    language: 'punjabi',
    genres: ['Punjabi', 'Bhangra', 'Folk', 'Hip-Hop/Rap'],
    searchQueries: [
      'punjabi songs',
      'punjabi music',
      'bhangra',
      'punjabi hits',
      'desi punjabi',
      'jatt songs',
      'punjabi folk',
      'gurbani'
    ],
    mood: 'energetic',
    energy: 'medium',
    vibeProfile: {
      language: 'punjabi',
      energy: 'medium',
      mood: 'energetic',
      tempo: 'medium',
      primaryGenre: 'Punjabi',
      filmIndustry: 'punjabi_cinema'
    }
  },
  {
    id: 'tamil-vibe',
    name: 'Tamil Vibe',
    description: 'South Indian Tamil music with Kollywood charm',
    icon: '🌴',
    language: 'tamil',
    genres: ['Tamil', 'Pop', 'Classical', 'Folk'],
    searchQueries: [
      'tamil songs',
      'kollywood music',
      'tamil film songs',
      'tamil hits',
      'chennai music',
      'a r rahman',
      'ilaiyaraaja',
      'tamil melody'
    ],
    mood: 'energetic',
    energy: 'medium',
    vibeProfile: {
      language: 'tamil',
      energy: 'medium',
      mood: 'energetic',
      tempo: 'medium',
      primaryGenre: 'Tamil',
      filmIndustry: 'kollywood'
    }
  },
  {
    id: 'bollywood-party',
    name: 'Bollywood Party',
    description: 'High-energy Hindi film songs for ultimate dance party',
    icon: '🎬',
    language: 'hindi',
    genres: ['Bollywood', 'Hindi', 'Pop', 'Dance'],
    searchQueries: [
      'bollywood party songs',
      'hindi dance',
      'bollywood hits',
      'filmi songs',
      'bollywood club',
      'hindi party',
      'dance bollywood',
      'bollywood celebration'
    ],
    mood: 'party',
    energy: 'high',
    vibeProfile: {
      language: 'hindi',
      energy: 'high',
      mood: 'party',
      tempo: 'fast',
      primaryGenre: 'Bollywood',
      filmIndustry: 'bollywood'
    }
  },
  {
    id: 'edm-party',
    name: 'EDM Party',
    description: 'Electronic dance music for club-style energy',
    icon: '🎧',
    language: 'english',
    genres: ['Electronic', 'Dance', 'House', 'Techno', 'EDM'],
    searchQueries: [
      'edm',
      'electronic dance music',
      'house music',
      'techno',
      'club music',
      'electronic hits',
      'dance electronic',
      'party edm'
    ],
    mood: 'dance',
    energy: 'high',
    vibeProfile: {
      language: 'english',
      energy: 'high',
      mood: 'party',
      tempo: 'fast',
      primaryGenre: 'Electronic',
      filmIndustry: 'international'
    }
  }
];

// Get DJ mode by ID
export function getDJModeById(id: string): DJMode | undefined {
  return DJ_MODES.find(mode => mode.id === id);
}

// Get compatible DJ modes based on language
export function getCompatibleDJModes(language: string): DJMode[] {
  return DJ_MODES.filter(mode => mode.language === language);
}

// Get all available DJ modes
export function getAllDJModes(): DJMode[] {
  return DJ_MODES;
}