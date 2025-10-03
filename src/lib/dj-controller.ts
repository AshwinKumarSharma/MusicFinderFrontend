import { Track, VibeProfile, DJState, DJQueue, DJMode } from "./types";
import {
  analyzeTrackVibe,
  calculateVibeCompatibility,
  generateVibeSearchQueries,
} from "./vibe-analyzer";
import { getDJModeById, getAllDJModes } from "./dj-modes";

export class DJController {
  private state: DJState = {
    isActive: false,
    currentQueue: null,
    autoQueue: false,
    nextTracks: [],
    playedTracks: [],
    currentVibeProfile: null,
    selectedMode: null,
  };

  private listeners: Set<(state: DJState) => void> = new Set();
  private searchCache: Map<string, Track[]> = new Map();

  constructor() {
    // Load any saved state from localStorage
    this.loadState();
  }

  // State management
  getState(): DJState {
    return { ...this.state };
  }

  subscribe(listener: (state: DJState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(newState: Partial<DJState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
    this.saveState();
  }

  private saveState() {
    try {
      localStorage.setItem(
        "dj-state",
        JSON.stringify({
          isActive: this.state.isActive,
          autoQueue: this.state.autoQueue,
          currentVibeProfile: this.state.currentVibeProfile,
          playedTracks: this.state.playedTracks,
        })
      );
    } catch (error) {
      console.warn("Failed to save DJ state:", error);
    }
  }

  private loadState() {
    try {
      const saved = localStorage.getItem("dj-state");
      if (saved) {
        const parsedState = JSON.parse(saved);
        this.setState({
          isActive: parsedState.isActive || false,
          autoQueue: parsedState.autoQueue || false,
          currentVibeProfile: parsedState.currentVibeProfile || null,
          playedTracks: parsedState.playedTracks || [],
        });
      }
    } catch (error) {
      console.warn("Failed to load DJ state:", error);
    }
  }

  // Core DJ functionality
  async startDJMode(initialTrack: Track): Promise<void> {
    // Analyze the initial track to set the vibe
    const vibeProfile = analyzeTrackVibe(initialTrack);

    // Create a new queue
    const queue: DJQueue = {
      id: `dj-${Date.now()}`,
      tracks: [initialTrack],
      currentIndex: 0,
      isActive: true,
      vibeProfile,
      createdAt: new Date().toISOString(),
    };

    this.setState({
      isActive: true,
      currentQueue: queue,
      autoQueue: true,
      currentVibeProfile: vibeProfile,
      playedTracks: [initialTrack],
      nextTracks: [],
    });

    // Start building the queue with similar tracks
    await this.buildQueue(vibeProfile, [initialTrack.trackId]);
  }

  stopDJMode(): void {
    this.setState({
      isActive: false,
      currentQueue: null,
      autoQueue: false,
      nextTracks: [],
      selectedMode: null,
    });
  }

  // DJ Mode Management
  setDJMode(modeId: string) {
    const mode = getDJModeById(modeId);
    if (mode) {
      this.setState({
        selectedMode: mode,
        currentVibeProfile: mode.vibeProfile,
      });
      console.log(`🎵 DJ Mode set to: ${mode.name} (${mode.description})`);

      // Clear existing queue when switching modes
      this.clearQueue();

      // If DJ is active, start building queue for this mode
      if (this.state.isActive) {
        this.buildModeQueue(mode);
      }
    } else {
      console.error(`❌ DJ Mode not found: ${modeId}`);
    }
  }

  getDJModes(): DJMode[] {
    return getAllDJModes();
  }

  getCurrentMode(): DJMode | null {
    return this.state.selectedMode;
  }

  // Start DJ with a specific mode
  async startDJModeWithMode(modeId: string): Promise<void> {
    const mode = getDJModeById(modeId);
    if (!mode) {
      console.error(`❌ DJ Mode not found: ${modeId}`);
      return;
    }

    this.setState({
      isActive: true,
      selectedMode: mode,
      currentVibeProfile: mode.vibeProfile,
      autoQueue: true,
      playedTracks: [],
      nextTracks: [],
    });

    console.log(`🎧 Starting DJ Mode: ${mode.name}`);

    // Build initial queue for this mode
    await this.buildModeQueue(mode);
  }

  // Build queue specifically for a DJ mode
  private async buildModeQueue(mode: DJMode): Promise<void> {
    console.log(`🔍 Building queue for DJ Mode: ${mode.name}`);
    console.log(`🎯 Mode search queries:`, mode.searchQueries);

    try {
      const tracks: Track[] = [];

      // Search using mode-specific queries
      for (const query of mode.searchQueries) {
        try {
          console.log(`🔍 Mode search: "${query}"`);
          const searchTracks = await this.searchTracks(query);
          console.log(
            `📀 Found ${searchTracks.length} tracks for mode query: "${query}"`
          );
          tracks.push(...searchTracks);

          // Stop if we have enough tracks
          if (tracks.length >= 50) break;
        } catch (error) {
          console.error(`❌ Mode search failed for query: ${query}`, error);
          continue;
        }
      }

      // Filter tracks by mode criteria
      const filteredTracks = this.filterTracksByMode(tracks, mode, []);

      console.log(
        `✅ DJ Mode Queue Built: ${filteredTracks.length} tracks for "${mode.name}"`
      );

      if (filteredTracks.length > 0) {
        // Use the first track as the initial track and create a proper queue
        const initialTrack = filteredTracks[0];

        const queue: DJQueue = {
          id: `dj-mode-${Date.now()}`,
          tracks: filteredTracks.slice(0, 20), // Include first 20 tracks in the queue
          currentIndex: 0,
          isActive: true,
          vibeProfile: mode.vibeProfile,
          createdAt: new Date().toISOString(),
        };

        this.setState({
          currentQueue: queue,
          nextTracks: filteredTracks.slice(1, 11), // Set next 10 tracks
        });

        console.log(
          `🎵 Started playing: "${initialTrack.trackName}" by ${initialTrack.artistName}`
        );
      } else {
        console.warn(`⚠️ No tracks found for DJ Mode: ${mode.name}`);
      }
    } catch (error) {
      console.error("❌ Failed to build mode queue:", error);
    }
  }

  // Filter tracks specifically by DJ mode criteria
  private filterTracksByMode(
    tracks: Track[],
    mode: DJMode,
    excludeTrackIds: number[] = []
  ): Track[] {
    // Remove duplicates and excluded tracks
    const uniqueTracks = tracks.filter((track, index, arr) => {
      return (
        !excludeTrackIds.includes(track.trackId) &&
        track.previewUrl && // Only include tracks with previews
        arr.findIndex((t) => t.trackId === track.trackId) === index
      );
    });

    // Score and rank tracks based on mode criteria
    const rankedTracks = uniqueTracks.map((track) => {
      let score = 0.1; // Base score

      // Language matching (70% weight - highest priority for modes)
      const detectedLanguage = this.detectTrackLanguage(track);
      if (detectedLanguage === mode.language) {
        score += 0.7; // Perfect language match
        console.log(
          `🎯 MODE LANGUAGE MATCH: "${track.trackName}" - ${detectedLanguage} === ${mode.language}`
        );
      } else {
        score -= 0.3; // Heavy penalty for wrong language
        console.log(
          `❌ MODE LANGUAGE MISMATCH: "${track.trackName}" - ${detectedLanguage} ≠ ${mode.language}`
        );
      }

      // Genre matching (20% weight)
      if (
        track.primaryGenreName &&
        mode.genres.includes(track.primaryGenreName)
      ) {
        score += 0.2; // Perfect genre match for mode
        console.log(
          `🎵 MODE GENRE MATCH: "${track.trackName}" - ${track.primaryGenreName}`
        );
      }

      // Energy matching (10% weight)
      const trackVibe = analyzeTrackVibe(track);
      if (trackVibe.energy === mode.energy) {
        score += 0.1; // Energy level match
      }

      return {
        track,
        score: Math.max(0, Math.min(1, score)),
        detectedLanguage,
      };
    });

    // Sort by score and return tracks
    const sortedTracks = rankedTracks
      .sort((a, b) => b.score - a.score)
      .map((item) => {
        console.log(
          `📊 Mode Score: ${item.score.toFixed(3)} - "${
            item.track.trackName
          }" (${item.detectedLanguage})`
        );
        return item.track;
      });

    return sortedTracks;
  }

  private clearQueue(): void {
    this.setState({
      nextTracks: [],
      currentQueue: null,
    });
  }

  toggleAutoQueue(): void {
    this.setState({
      autoQueue: !this.state.autoQueue,
    });
  }

  // Get next track in the DJ queue
  getNextTrack(): Track | null {
    if (!this.state.isActive || this.state.nextTracks.length === 0) {
      return null;
    }

    return this.state.nextTracks[0];
  }

  // Mark current track as played and advance queue
  markTrackPlayed(track: Track): void {
    if (!this.state.isActive) return;

    const updatedPlayedTracks = [...this.state.playedTracks, track];
    const updatedNextTracks = this.state.nextTracks.filter(
      (t) => t.trackId !== track.trackId
    );

    this.setState({
      playedTracks: updatedPlayedTracks,
      nextTracks: updatedNextTracks,
    });

    // If queue is getting low, build more tracks
    if (
      this.state.autoQueue &&
      updatedNextTracks.length < 3 &&
      this.state.currentVibeProfile
    ) {
      const playedTrackIds = updatedPlayedTracks.map((t) => t.trackId);
      this.buildQueue(this.state.currentVibeProfile, playedTrackIds);
    }
  }

  // Manually add a track to the DJ queue (user override)
  async addTrackToQueue(track: Track): Promise<void> {
    if (!this.state.isActive) {
      // If DJ mode isn't active, start it with this track
      await this.startDJMode(track);
      return;
    }

    // Add track to next up in queue
    const updatedNextTracks = [track, ...this.state.nextTracks];
    this.setState({
      nextTracks: updatedNextTracks,
    });

    // Update vibe profile based on user selection
    const trackVibe = analyzeTrackVibe(track);
    if (this.state.currentVibeProfile) {
      const newVibeProfile = this.blendVibeProfiles(
        this.state.currentVibeProfile,
        trackVibe
      );
      this.setState({
        currentVibeProfile: newVibeProfile,
      });
    }
  }

  // Remove a track from the queue
  removeTrackFromQueue(trackId: number): void {
    const updatedNextTracks = this.state.nextTracks.filter(
      (t) => t.trackId !== trackId
    );
    this.setState({
      nextTracks: updatedNextTracks,
    });
  }

  // Get queue status
  getQueueStatus(): {
    nextCount: number;
    playedCount: number;
    vibeProfile: VibeProfile | null;
  } {
    return {
      nextCount: this.state.nextTracks.length,
      playedCount: this.state.playedTracks.length,
      vibeProfile: this.state.currentVibeProfile,
    };
  }

  // Private methods for queue building
  private async buildQueue(
    vibeProfile: VibeProfile,
    excludeTrackIds: number[]
  ): Promise<void> {
    try {
      // Get reference track for smart matching
      const referenceTrack =
        this.state.playedTracks[this.state.playedTracks.length - 1];

      if (referenceTrack) {
        // Use smart matching based on primaryGenreName, country, and duration
        const smartTracks = await this.buildSmartQueue(
          referenceTrack,
          excludeTrackIds
        );
        if (smartTracks.length > 0) {
          const updatedNextTracks = [...this.state.nextTracks, ...smartTracks];
          this.setState({
            nextTracks: updatedNextTracks,
          });
          return;
        }
      }

      // Fallback to original vibe-based search if smart matching fails
      const queries = generateVibeSearchQueries(vibeProfile);
      const similarTracks: Track[] = [];

      // Search for similar tracks using multiple queries
      for (const query of queries) {
        const tracks = await this.searchTracks(query);
        similarTracks.push(...tracks);

        // Break if we have enough tracks
        if (similarTracks.length >= 50) break;
      }

      // Filter out already played tracks and duplicates
      const filteredTracks = this.filterAndRankTracks(
        similarTracks,
        vibeProfile,
        excludeTrackIds
      );

      // Add top-ranked tracks to queue
      const tracksToAdd = filteredTracks.slice(0, 10);
      const updatedNextTracks = [...this.state.nextTracks, ...tracksToAdd];

      this.setState({
        nextTracks: updatedNextTracks,
      });
    } catch (error) {
      console.error("Failed to build DJ queue:", error);
    }
  }

  // Smart queue building with LANGUAGE as highest priority
  private async buildSmartQueue(
    referenceTrack: Track,
    excludeTrackIds: number[]
  ): Promise<Track[]> {
    // Detect language from track name and artist (HIGHEST PRIORITY)
    const targetLanguage = this.detectTrackLanguage(referenceTrack);
    const targetGenre = referenceTrack.primaryGenreName;
    const targetCountry = referenceTrack.country;
    const targetDuration = referenceTrack.trackTimeMillis;

    console.log(`🎵 Building Smart Queue for: "${referenceTrack.trackName}" by ${referenceTrack.artistName}
    DETECTED LANGUAGE: "${targetLanguage}" (TOP PRIORITY)
    Target Metadata: Genre="${targetGenre}", Country="${targetCountry}", Duration=${targetDuration}ms`);

    // Define tolerance for similar energy (±10% as per your specification)
    const durationRange = targetDuration
      ? {
          min: targetDuration * 0.9,
          max: targetDuration * 1.1,
        }
      : null;

    try {
      const smartTracks: Track[] = [];

      // PRIORITY 1: Search by detected language
      if (targetLanguage) {
        const languageQueries = this.buildLanguageSpecificQueries(
          targetLanguage,
          targetGenre
        );
        console.log(
          `🔍 LANGUAGE-BASED Search Queries (TOP PRIORITY):`,
          languageQueries
        );

        for (const query of languageQueries) {
          try {
            console.log(`🔍 Searching LANGUAGE: "${query}"`);
            const tracks = await this.searchTracks(query);
            console.log(
              `📀 Found ${tracks.length} LANGUAGE tracks for: "${query}"`
            );
            smartTracks.push(...tracks);

            if (smartTracks.length >= 50) break;
          } catch (error) {
            console.error(`❌ Language search failed for: ${query}`, error);
            continue;
          }
        }
      }

      // PRIORITY 2: If not enough language-specific tracks, search by genre
      if (smartTracks.length < 20 && targetGenre) {
        console.log(
          `⚠️ Only found ${smartTracks.length} language tracks, adding genre-based tracks...`
        );
        const genreQueries = this.buildGenreSpecificQueries(
          targetGenre,
          targetCountry
        );

        for (const query of genreQueries.slice(0, 3)) {
          try {
            const tracks = await this.searchTracks(query);
            console.log(
              `📀 Found ${tracks.length} genre tracks for: "${query}"`
            );
            smartTracks.push(...tracks);
            if (smartTracks.length >= 50) break;
          } catch (error) {
            console.error(`❌ Genre search failed for: ${query}`, error);
            continue;
          }
        }
      }

      console.log(
        `📊 Total tracks found: ${smartTracks.length}, now filtering with LANGUAGE PRIORITY...`
      );

      // Filter and rank with LANGUAGE as highest priority
      const filteredTracks = this.filterByLanguagePriority(
        smartTracks,
        targetLanguage,
        targetGenre,
        targetCountry,
        durationRange,
        excludeTrackIds
      );

      console.log(
        `✅ Smart Queue Built: ${filteredTracks.length} tracks selected with LANGUAGE PRIORITY`
      );
      return filteredTracks.slice(0, 10);
    } catch (error) {
      console.error("❌ Smart queue building failed:", error);
      return [];
    }
  }

  // Build genre-specific search queries optimized for iTunes metadata matching
  private buildGenreSpecificQueries(
    targetGenre: string,
    targetCountry?: string
  ): string[] {
    const queries: string[] = [];

    // Genre-specific search strategies
    const genreSearchMap: Record<string, string[]> = {
      Punjabi: ["punjabi songs", "punjabi music", "bhangra", "punjabi hits"],
      Bollywood: [
        "bollywood songs",
        "hindi songs",
        "bollywood music",
        "hindi film songs",
      ],
      "Hip-Hop/Rap": ["hip hop", "rap music", "rap songs", "hip hop hits"],
      Pop: ["pop songs", "popular music", "pop hits", "mainstream pop"],
      Rock: ["rock music", "rock songs", "rock hits"],
      Alternative: ["alternative music", "indie music", "alternative rock"],
      Electronic: [
        "electronic music",
        "edm",
        "dance music",
        "electronic dance",
      ],
      "R&B/Soul": ["r&b music", "soul music", "rnb songs"],
      Country: ["country music", "country songs", "country hits"],
      Jazz: ["jazz music", "jazz songs", "smooth jazz"],
      Classical: ["classical music", "orchestra", "symphony"],
      Reggae: ["reggae music", "reggae songs", "jamaican music"],
      Latin: ["latin music", "latin songs", "spanish music"],
      "K-Pop": ["kpop", "korean pop", "k-pop songs"],
      "J-Pop": ["jpop", "japanese pop", "j-pop songs"],
      Tamil: ["tamil songs", "tamil music", "kollywood"],
      Telugu: ["telugu songs", "telugu music", "tollywood"],
      Malayalam: ["malayalam songs", "malayalam music", "mollywood"],
      Kannada: ["kannada songs", "kannada music", "sandalwood"],
      Marathi: ["marathi songs", "marathi music"],
      Bengali: ["bengali songs", "bangla music"],
      Gujarati: ["gujarati songs", "gujarati music"],
    };

    // Get search terms for the target genre
    const searchTerms = genreSearchMap[targetGenre] || [
      targetGenre.toLowerCase(),
    ];

    // Add direct genre searches (most effective)
    queries.push(...searchTerms);

    // Add genre with "music" and "songs" variations if not already included
    if (!searchTerms.some((term) => term.includes("music"))) {
      queries.push(`${targetGenre.toLowerCase()} music`);
    }
    if (!searchTerms.some((term) => term.includes("songs"))) {
      queries.push(`${targetGenre.toLowerCase()} songs`);
    }

    // If we have country information, add country-aware searches for regional genres
    if (targetCountry && this.isRegionalGenre(targetGenre)) {
      const regionMap: Record<string, string[]> = {
        India: ["hindi", "bollywood", "indian"],
        USA: ["american", "us"],
        "United Kingdom": ["british", "uk"],
        Canada: ["canadian"],
        Australia: ["australian"],
        "South Korea": ["korean"],
        Japan: ["japanese"],
        Spain: ["spanish"],
        Mexico: ["mexican"],
        Brazil: ["brazilian"],
        France: ["french"],
      };

      const regionTerms = regionMap[targetCountry] || [];
      for (const regionTerm of regionTerms) {
        queries.push(`${regionTerm} ${targetGenre.toLowerCase()}`);
      }
    }

    return queries.slice(0, 8); // Limit to avoid too many API calls
  }

  // Check if a genre is region-specific
  private isRegionalGenre(genre: string): boolean {
    const regionalGenres = [
      "Punjabi",
      "Bollywood",
      "Tamil",
      "Telugu",
      "Malayalam",
      "Kannada",
      "Marathi",
      "Bengali",
      "Gujarati",
      "K-Pop",
      "J-Pop",
      "Latin",
      "Reggae",
      "Country",
    ];
    return regionalGenres.includes(genre);
  }

  // Detect language from track name and artist - HIGHEST PRIORITY for matching
  private detectTrackLanguage(track: Track): string {
    const trackText = `${track.trackName} ${track.artistName} ${
      track.collectionName || ""
    }`.toLowerCase();

    // Language detection patterns based on script, keywords, and artist names
    const languagePatterns: Record<string, RegExp[]> = {
      punjabi: [
        /\b(punjabi|bhangra|sikh|khalsa|sardar|singh|kaur|pind|gidha|boliyan|desi|jatt|kurta|turban|gurudwara)\b/i,
        /\b(diljit|dosanjh|babbu|maan|gurdas|mann|ammy|virk|ninja|harnoor|jordan|sandhu|karan|aujla|sidhu|moose|wala|jazzy|b|ap|dhillon|badshah|honey|singh|yo|yo)\b/i,
        /[\u0A00-\u0A7F]/, // Gurmukhi script
      ],
      hindi: [
        /\b(hindi|bollywood|bhojpuri|awadhi|braj|magahi|maithili|urdu|hindustani|desi|filmi|qawwali|ghazal|thumri|dadra|bhajan|kirtan|aarti)\b/i,
        /\b(lata|mangeshkar|kishore|kumar|mohammed|rafi|asha|bhosle|mukesh|manna|dey|hemant|kumar|talat|mahmood|geeta|dutt|shamshad|begum|suraiya|noor|jehan|udit|narayan|alka|yagnik|kumar|sanu|abhijeet|kavita|krishnamurthy|sadhana|sargam|anuradha|paudwal|hariharan|shankar|mahadevan|shaan|sonu|nigam|k\.k|kailash|kher|mohit|chauhan|shreya|ghoshal|sunidhi|chauhan|rahat|fateh|ali|khan|arijit|singh|armaan|malik|asees|kaur|dhvani|bhanushali|jubin|nautiyal|darshan|raval|neha|kakkar|mika|singh|guru|randhawa|tony|kakkar|tulsi|kumar|jass|manak|millind|gaba|sachet|tandon|parampara|thakur|b|praak|jaani|hardy|sandhu)\b/i,
        /[\u0900-\u097F]/, // Devanagari script
      ],
      tamil: [
        /\b(tamil|kollywood|chennai|madras|sangam|carnatic|bharatanatyam|thamizh|dravidian)\b/i,
        /\b(a\.r\.rahman|ilaiyaraaja|m\.s\.viswanathan|k\.v\.mahadevan|vidyasagar|deva|yuvan|shankar|raja|harris|jayaraj|d\.imman|anirudh|ravichander|santhosh|narayanan|gv|prakash|kumar|thaman|s|hip|hop|tamizha|vivek|mervin|ranjit|jeyakodi|sean|roldan|justin|prabhakaran|sam|c\.s|ron|ethan|javed|riaz|trend|music|think|music)\b/i,
        /[\u0B80-\u0BFF]/, // Tamil script
      ],
      telugu: [
        /\b(telugu|tollywood|hyderabad|andhra|telangana|carnatic|kuchipudi|bharatanatyam)\b/i,
        /\b(s\.p\.balasubrahmanyam|k\.j\.yesudas|p\.susheela|s\.janaki|ghantasala|m\.m\.keeravani|a\.r\.rahman|ilaiyaraaja|devi|sri|prasad|thaman|s|mickey|j|meyer|anup|rubens|gopi|sundar|manisharma|vandemataram|srinivas|sai|karthik|shreya|ghoshal|kk|udit|narayan|hariharan|shankar|mahadevan|chithra|k\.s|sunitha|mallikarjun|tippu|rahul|nandkumar|ranjith|malavika|hemachandra|ramya|behera|sid|sriram|anurag|kulkarni|armaan|malik|asees|kaur|dhvani|bhanushali)\b/i,
        /[\u0C00-\u0C7F]/, // Telugu script
      ],
      korean: [
        /\b(kpop|k-pop|korean|hangul|seoul|busan|hallyu|oppa|unnie|noona|hyung|aegyo|saranghae|annyeong)\b/i,
        /\b(bts|blackpink|twice|red|velvet|girls|generation|snsd|super|junior|bigbang|2ne1|wonder|girls|kara|shinee|exo|nct|seventeen|stray|kids|itzy|aespa|gidle|mamamoo|oh|my|girl|gfriend|loona|iu|taeyeon|jessica|jung|tiffany|hwang|hyoyeon|yuri|kwon|yoona|im|sooyoung|choi|seohyun|seo|sunny|lee|psy|rain|bi|se7en|lee|hyori|boa|tvxq|jyj|ss501|kara|nicole|jung|hara|goo|seungyeon|han|gyuri|park|jiyoung|kang)\b/i,
        /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/, // Hangul script
      ],
      japanese: [
        /\b(jpop|j-pop|japanese|nihongo|tokyo|osaka|kyoto|anime|manga|kawaii|sugoi)|[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/i,
        /\b(akb48|morning|musume|perfume|babymetal|x|japan|glay|b\'z|southern|all|stars|dreams|come|true|smap|arashi|exile|ayumi|hamasaki|hikaru|utada|koda|kumi|amuro|namie|matsuda|seiko|nakamori|akina|ozaki|yutaka|fukuyama|masaharu|kobukuro|orange|range|one|ok|rock|radwimps|bump|of|chicken|asian|kung|fu|generation|flowerfloweflower|shishamo|yoasobi|lisa|kenshi|yonezu|official|hige|dandism|king|gnu|gen|hoshino|aimyon|chara|ua|cocco|shiina|ringo|椎名林檎)\b/i,
      ],
      english: [
        /\b(english|american|british|australian|canadian|pop|rock|hip|hop|rap|rnb|country|folk|blues|jazz|electronic|dance|house|techno|reggae|ska|punk|metal|alternative|indie|grunge|soul|funk|disco|gospel|bluegrass|ambient|downtempo|drum|bass|garage|dubstep|trap|grime|uk|us|usa|britain|england|scotland|wales|ireland|canada|australia|new|zealand)\b/i,
      ],
    };

    // Check each language pattern
    for (const [language, patterns] of Object.entries(languagePatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(trackText)) {
          console.log(
            `🌍 LANGUAGE DETECTED: "${language}" for track "${track.trackName}" (pattern matched: ${pattern})`
          );
          return language;
        }
      }
    }

    // Default fallback based on genre if no pattern matches
    const genreLanguageMap: Record<string, string> = {
      Punjabi: "punjabi",
      Bollywood: "hindi",
      Tamil: "tamil",
      Telugu: "telugu",
      Malayalam: "malayalam",
      Kannada: "kannada",
      Marathi: "marathi",
      Bengali: "bengali",
      Gujarati: "gujarati",
      "K-Pop": "korean",
      "J-Pop": "japanese",
    };

    if (track.primaryGenreName && genreLanguageMap[track.primaryGenreName]) {
      const detectedLang = genreLanguageMap[track.primaryGenreName];
      console.log(
        `🌍 LANGUAGE DETECTED from genre: "${detectedLang}" for genre "${track.primaryGenreName}"`
      );
      return detectedLang;
    }

    console.log(
      `⚠️ NO LANGUAGE DETECTED for track "${track.trackName}" - defaulting to 'english'`
    );
    return "english"; // Default fallback
  }

  // Build language-specific search queries (HIGHEST PRIORITY)
  private buildLanguageSpecificQueries(
    language: string,
    genre?: string
  ): string[] {
    const queries: string[] = [];

    const languageQueryMap: Record<string, string[]> = {
      punjabi: [
        "punjabi songs",
        "punjabi music",
        "bhangra",
        "punjabi hits",
        "desi punjabi",
        "jatt songs",
      ],
      hindi: [
        "hindi songs",
        "bollywood music",
        "hindi film songs",
        "bollywood hits",
        "desi songs",
        "filmi songs",
      ],
      tamil: [
        "tamil songs",
        "kollywood music",
        "tamil film songs",
        "tamil hits",
        "chennai music",
      ],
      telugu: [
        "telugu songs",
        "tollywood music",
        "telugu film songs",
        "telugu hits",
        "andhra music",
      ],
      malayalam: [
        "malayalam songs",
        "mollywood music",
        "malayalam film songs",
        "kerala music",
      ],
      kannada: [
        "kannada songs",
        "sandalwood music",
        "kannada film songs",
        "karnataka music",
      ],
      marathi: [
        "marathi songs",
        "marathi music",
        "marathi film songs",
        "maharashtra music",
      ],
      bengali: [
        "bengali songs",
        "bangla music",
        "bengali film songs",
        "kolkata music",
      ],
      gujarati: ["gujarati songs", "gujarati music", "gujarat music"],
      korean: ["kpop", "k-pop", "korean pop", "korean music", "hallyu"],
      japanese: [
        "jpop",
        "j-pop",
        "japanese pop",
        "japanese music",
        "anime songs",
      ],
      english: [
        "pop songs",
        "english music",
        "american music",
        "british music",
        "western music",
      ],
    };

    // Get language-specific queries
    const languageQueries = languageQueryMap[language] || [language];
    queries.push(...languageQueries);

    // If we have genre info, combine language with genre
    if (genre) {
      for (const langQuery of languageQueries.slice(0, 3)) {
        queries.push(`${langQuery} ${genre.toLowerCase()}`);
        queries.push(`${genre.toLowerCase()} ${langQuery}`);
      }
    }

    return queries.slice(0, 10); // Limit queries to avoid too many API calls
  }

  // Filter and rank with LANGUAGE as absolute highest priority
  private filterByLanguagePriority(
    tracks: Track[],
    targetLanguage: string,
    targetGenre?: string,
    targetCountry?: string,
    durationRange?: { min: number; max: number } | null,
    excludeTrackIds: number[] = []
  ): Track[] {
    // Remove duplicates and excluded tracks
    const uniqueTracks = tracks.filter((track, index, arr) => {
      return (
        !excludeTrackIds.includes(track.trackId) &&
        track.previewUrl && // Only include tracks with previews
        arr.findIndex((t) => t.trackId === track.trackId) === index
      );
    });

    // Calculate language-priority compatibility score for each track
    const rankedTracks = uniqueTracks.map((track) => {
      let score = 0.1; // Very low base score
      const detectedLanguage = this.detectTrackLanguage(track);

      // LANGUAGE MATCHING (60% weight - ABSOLUTE HIGHEST PRIORITY)
      if (detectedLanguage === targetLanguage) {
        score += 0.6; // Perfect language match - HIGHEST PRIORITY
        console.log(
          `🎯 PERFECT LANGUAGE MATCH: "${track.trackName}" - ${detectedLanguage} === ${targetLanguage}`
        );
      } else {
        // Check for compatible languages
        const compatibleLanguages = this.getCompatibleLanguages(targetLanguage);
        if (compatibleLanguages.includes(detectedLanguage)) {
          score += 0.3; // Compatible language
          console.log(
            `🎯 COMPATIBLE LANGUAGE: "${track.trackName}" - ${detectedLanguage} ~ ${targetLanguage}`
          );
        } else {
          score -= 0.5; // Heavy penalty for different language to prevent English mixing with Punjabi
          console.log(
            `❌ LANGUAGE MISMATCH: "${track.trackName}" - ${detectedLanguage} ≠ ${targetLanguage}`
          );
        }
      }

      // Genre Matching (25% weight)
      if (targetGenre && track.primaryGenreName) {
        if (track.primaryGenreName === targetGenre) {
          score += 0.25; // Perfect genre match
        } else {
          const similarGenres = this.getSimilarGenres(targetGenre);
          if (similarGenres.includes(track.primaryGenreName)) {
            score += 0.125; // Similar genre bonus
          } else {
            score -= 0.1; // Different genre penalty
          }
        }
      }

      // Country Matching (10% weight - lowest priority)
      if (targetCountry && track.country) {
        if (track.country === targetCountry) {
          score += 0.1; // Same country
        } else {
          const compatibleCountries =
            this.getCompatibleCountries(targetCountry);
          if (compatibleCountries.includes(track.country)) {
            score += 0.05; // Regional compatibility
          }
        }
      }

      // Duration Matching (5% weight)
      if (durationRange && track.trackTimeMillis) {
        if (
          track.trackTimeMillis >= durationRange.min &&
          track.trackTimeMillis <= durationRange.max
        ) {
          score += 0.05; // Duration match
        }
      }

      // Ensure score stays within bounds
      const finalScore = Math.max(0, Math.min(1, score));

      return {
        track,
        score: finalScore,
        detectedLanguage,
      };
    });

    // Sort by score and return tracks
    const sortedTracks = rankedTracks
      .sort((a, b) => b.score - a.score)
      .map((item) => {
        console.log(
          `📊 Final Score: ${item.score.toFixed(3)} - "${
            item.track.trackName
          }" (${item.detectedLanguage})`
        );
        return item.track;
      });

    return sortedTracks;
  }

  // Get similar genres for broader matching - Enhanced for regional music
  private getSimilarGenres(primaryGenre: string): string[] {
    const genreMap: Record<string, string[]> = {
      Pop: ["Adult Contemporary", "Top 40", "Dance Pop", "Teen Pop"],
      Rock: ["Alternative", "Indie Rock", "Classic Rock", "Pop Rock"],
      "Hip-Hop/Rap": ["R&B/Soul", "Urban", "Trap", "Contemporary R&B"],
      Electronic: ["Dance", "House", "Techno", "EDM", "Ambient"],
      "R&B/Soul": ["Hip-Hop/Rap", "Contemporary R&B", "Funk", "Neo-Soul"],
      Country: ["Folk", "Americana", "Bluegrass", "Country Pop"],
      Jazz: ["Blues", "Smooth Jazz", "Contemporary Jazz", "Fusion"],
      Classical: ["Instrumental", "Chamber Music", "Symphony", "Opera"],
      Reggae: ["Dancehall", "Ska", "Dub", "Caribbean"],
      Latin: ["Salsa", "Bachata", "Reggaeton", "Merengue", "Latin Pop"],
      World: ["Folk", "Traditional", "Ethnic", "Cultural"],
      Alternative: ["Indie", "Grunge", "Post-Rock", "Experimental"],
      Dance: ["Electronic", "House", "EDM", "Pop"],
      Soundtrack: ["Film Score", "Movie Soundtrack"],
      "World Music": ["Folk", "Traditional", "Ethnic"],

      // Enhanced regional genre mappings
      Punjabi: ["Hip-Hop/Rap", "Pop", "Dance", "World Music", "Folk"], // iTunes labels Punjabi music inconsistently
      Bollywood: ["Hindi", "Indian Pop", "Bhangra", "Punjabi", "Pop", "Dance"],
      Tamil: ["Pop", "World Music", "Folk", "Classical"],
      Telugu: ["Pop", "World Music", "Folk", "Classical"],
      Malayalam: ["Pop", "World Music", "Folk", "Classical"],
      Kannada: ["Pop", "World Music", "Folk", "Classical"],
      Marathi: ["Pop", "World Music", "Folk", "Classical"],
      Bengali: ["Pop", "World Music", "Folk", "Classical"],
      Gujarati: ["Pop", "World Music", "Folk", "Classical"],
      Hindi: ["Bollywood", "Pop", "World Music", "Folk"],
      "K-Pop": ["J-Pop", "Asian Pop", "Dance Pop", "Pop"],
      "J-Pop": ["K-Pop", "Asian Pop", "Dance Pop", "Pop"],
      "Indian Classical": ["Bollywood", "Hindi", "Classical", "World Music"],
      Devotional: ["Spiritual", "World Music", "Classical"],
      "New Age": ["Ambient", "Instrumental", "Electronic"],
    };

    return genreMap[primaryGenre] || [];
  }

  // Build targeted search queries combining language and genre
  private buildLanguageGenreQueries(language: string, genre: string): string[] {
    const queries: string[] = [];

    // Language-specific searches with genre
    const languageTerms: Record<string, string[]> = {
      hindi: ["hindi songs", "bollywood music", "hindi film songs"],
      punjabi: ["punjabi songs", "punjabi music", "bhangra"],
      tamil: ["tamil songs", "kollywood", "tamil film songs"],
      telugu: ["telugu songs", "tollywood", "telugu film songs"],
      kannada: ["kannada songs", "sandalwood", "kannada film songs"],
      malayalam: ["malayalam songs", "mollywood", "malayalam film songs"],
      marathi: ["marathi songs", "marathi film songs"],
      gujarati: ["gujarati songs", "gujarati music"],
      bengali: ["bengali songs", "bangla music"],
      english: ["english songs", "popular music"],
      korean: ["k-pop", "korean music"],
      spanish: ["spanish music", "latin songs"],
      japanese: ["j-pop", "japanese music"],
    };

    const terms = languageTerms[language] || [language];

    // Combine language with genre
    for (const term of terms) {
      queries.push(`${term} ${genre}`);
      queries.push(`${genre} ${term}`);
    }

    // Add pure language searches for fallback
    queries.push(...terms.slice(0, 2));

    return queries;
  }

  // Smart filtering and ranking based on genre, language, and duration
  private filterAndRankBySmartCriteria(
    tracks: Track[],
    targetGenre?: string,
    targetLanguage?: string,
    minDuration?: number | null,
    maxDuration?: number | null,
    excludeTrackIds: number[] = [],
    referenceTrack?: Track
  ): Track[] {
    // Remove duplicates and excluded tracks
    const uniqueTracks = tracks.filter((track, index, arr) => {
      return (
        !excludeTrackIds.includes(track.trackId) &&
        track.previewUrl && // Only include tracks with previews
        arr.findIndex((t) => t.trackId === track.trackId) === index
      );
    });

    // Calculate smart compatibility score for each track
    const rankedTracks = uniqueTracks.map((track) => {
      let score = 0.5; // Base score

      // Language matching (highest priority - 40% weight for language consistency)
      const trackVibe = analyzeTrackVibe(track);
      if (targetLanguage && trackVibe.language) {
        if (trackVibe.language === targetLanguage) {
          score += 0.4; // Same language (perfect language consistency)
        } else {
          // Check for compatible languages (e.g., hindi/punjabi, spanish variations)
          const compatibleLanguages =
            this.getCompatibleLanguages(targetLanguage);
          if (compatibleLanguages.includes(trackVibe.language)) {
            score += 0.2; // Language compatibility
          } else {
            score -= 0.3; // Strong penalty for different language to prevent mix-ups
          }
        }
      }

      // Genre matching (30% weight)
      if (targetGenre && track.primaryGenreName) {
        if (track.primaryGenreName === targetGenre) {
          score += 0.3; // Perfect genre match
        } else if (
          this.getSimilarGenres(targetGenre).includes(track.primaryGenreName)
        ) {
          score += 0.15; // Similar genre match
        } else {
          score -= 0.2; // Different genre penalty
        }
      }

      // Duration matching (20% weight for musical flow)
      if (minDuration && maxDuration && track.trackTimeMillis) {
        if (
          track.trackTimeMillis >= minDuration &&
          track.trackTimeMillis <= maxDuration
        ) {
          score += 0.2; // Perfect duration match
        } else {
          // Calculate penalty based on how far off the duration is
          const targetDuration = (minDuration + maxDuration) / 2;
          const durationDiff = Math.abs(track.trackTimeMillis - targetDuration);
          const penalty = Math.min(
            0.15,
            (durationDiff / targetDuration) * 0.15
          );
          score -= penalty;
        }
      }

      // Prevent conflicting genres (heavy penalty for mixing energetic with calm genres)
      if (targetGenre && track.primaryGenreName) {
        const conflictingGenres = this.getConflictingGenres(targetGenre);
        if (conflictingGenres.includes(track.primaryGenreName.toLowerCase())) {
          score -= 0.5; // Heavy penalty for conflicting genres (e.g., bollywood vs meditation)
        }
      }

      // Energy level matching from track names/artists to avoid mixing high energy with low energy
      if (referenceTrack) {
        const isTargetHighEnergy = this.isHighEnergyTrack(referenceTrack);
        const isTrackHighEnergy = this.isHighEnergyTrack(track);

        if (isTargetHighEnergy !== isTrackHighEnergy) {
          score -= 0.3; // Penalty for energy mismatch
        } else if (isTargetHighEnergy === isTrackHighEnergy) {
          score += 0.1; // Bonus for matching energy levels
        }
      }

      // Bonus for having genre information
      if (track.primaryGenreName) {
        score += 0.05; // Small bonus for tracks with genre information
      }

      // Ensure score stays within bounds
      return {
        track,
        score: Math.max(0, Math.min(1, score)),
      };
    });

    // Sort by score and return tracks
    return rankedTracks
      .sort((a, b) => b.score - a.score)
      .map((item) => item.track);
  }

  // Get languages that are compatible for consistency
  private getCompatibleLanguages(language: string): string[] {
    const languageMap: Record<string, string[]> = {
      hindi: ["punjabi", "marathi", "gujarati", "rajasthani"], // North Indian languages
      punjabi: ["hindi", "rajasthani"], // Related to Hindi
      marathi: ["hindi", "gujarati"], // Western Indian languages
      gujarati: ["hindi", "marathi", "rajasthani"], // Western Indian languages
      rajasthani: ["hindi", "punjabi", "gujarati"], // North/West Indian
      tamil: ["telugu", "kannada", "malayalam"], // South Indian languages
      telugu: ["tamil", "kannada", "malayalam"], // South Indian languages
      kannada: ["tamil", "telugu", "malayalam"], // South Indian languages
      malayalam: ["tamil", "telugu", "kannada"], // South Indian languages
      bengali: [], // Eastern Indian, quite distinct
      spanish: ["portuguese"], // Romance languages
      portuguese: ["spanish"], // Romance languages
      english: [], // Global, often mixed with local languages
      korean: [], // Distinct language family
      japanese: [], // Distinct language family
      arabic: [], // Distinct language family
      french: [], // Romance but typically distinct in music
    };

    return languageMap[language] || [];
  }

  // Filter and rank tracks based on iTunes API metadata (genre, country, duration)
  private filterByiTunesMetadata(
    tracks: Track[],
    targetGenre?: string,
    targetCountry?: string,
    durationRange?: { min: number; max: number } | null,
    excludeTrackIds: number[] = []
  ): Track[] {
    // Remove duplicates and excluded tracks
    const uniqueTracks = tracks.filter((track, index, arr) => {
      return (
        !excludeTrackIds.includes(track.trackId) &&
        track.previewUrl && // Only include tracks with previews
        arr.findIndex((t) => t.trackId === track.trackId) === index
      );
    });

    // Calculate iTunes metadata compatibility score for each track
    const rankedTracks = uniqueTracks.map((track) => {
      let score = 0.5; // Base score

      // Country Matching (highest priority - 40% weight for language/regional consistency)
      if (targetCountry && track.country) {
        if (track.country === targetCountry) {
          score += 0.4; // Same country (perfect match)
        } else {
          // Check for regional compatibility
          const compatibleCountries =
            this.getCompatibleCountries(targetCountry);
          if (compatibleCountries.includes(track.country)) {
            score += 0.2; // Regional compatibility (half points)
          } else {
            score -= 0.35; // Strong penalty for different country to maintain language consistency
          }
        }
      }

      // Genre Matching (30% weight)
      if (targetGenre && track.primaryGenreName) {
        if (track.primaryGenreName === targetGenre) {
          score += 0.3; // Perfect genre match
        } else {
          // Check for similar genres before penalizing
          const similarGenres = this.getSimilarGenres(targetGenre);
          if (similarGenres.includes(track.primaryGenreName)) {
            score += 0.15; // Similar genre bonus
          } else {
            score -= 0.2; // Different genre penalty
          }
        }
      }

      // Duration Matching (20% weight for energy consistency)
      if (durationRange && track.trackTimeMillis) {
        if (
          track.trackTimeMillis >= durationRange.min &&
          track.trackTimeMillis <= durationRange.max
        ) {
          score += 0.2; // Perfect duration match (within ±10%)
        } else {
          // Calculate penalty based on how far off the duration is
          const targetDuration = (durationRange.min + durationRange.max) / 2;
          const durationDiff = Math.abs(track.trackTimeMillis - targetDuration);
          const penalty = Math.min(
            0.15,
            (durationDiff / targetDuration) * 0.15
          );
          score -= penalty;
        }
      }

      // Bonus for complete metadata
      if (track.primaryGenreName && track.country && track.trackTimeMillis) {
        score += 0.1; // Bonus for having all required iTunes metadata
      }

      // Ensure score stays within bounds
      return {
        track,
        score: Math.max(0, Math.min(1, score)),
      };
    });

    // Sort by score and return tracks
    return rankedTracks
      .sort((a, b) => b.score - a.score)
      .map((item) => item.track);
  }

  // Get countries that are compatible for regional consistency
  private getCompatibleCountries(country: string): string[] {
    const countryMap: Record<string, string[]> = {
      USA: ["Canada", "Australia", "New Zealand", "United Kingdom"],
      "United Kingdom": [
        "Ireland",
        "Australia",
        "New Zealand",
        "Canada",
        "USA",
      ],
      Canada: ["USA", "United Kingdom", "Australia", "New Zealand"],
      Australia: ["New Zealand", "United Kingdom", "Canada", "USA"],
      India: ["Pakistan", "Bangladesh", "Sri Lanka", "Nepal"],
      Spain: ["Mexico", "Argentina", "Colombia", "Chile", "Peru"],
      Mexico: ["Spain", "Argentina", "Colombia", "Venezuela", "Peru"],
      Brazil: ["Portugal"],
      Portugal: ["Brazil"],
      France: ["Belgium", "Switzerland", "Monaco"],
      Germany: ["Austria", "Switzerland"],
      "South Korea": ["North Korea"],
      China: ["Taiwan", "Hong Kong", "Singapore"],
      Japan: [],
      Italy: ["Vatican City", "San Marino"],
      Russia: ["Belarus", "Kazakhstan"],
    };

    return countryMap[country] || [];
  }

  // Get genres that conflict and should not be mixed
  private getConflictingGenres(genre: string): string[] {
    const conflictMap: Record<string, string[]> = {
      bollywood: [
        "new age",
        "meditation",
        "ambient",
        "devotional",
        "spiritual",
        "relaxation",
      ],
      pop: ["meditation", "new age", "ambient", "devotional"],
      rock: ["meditation", "new age", "ambient", "devotional", "spiritual"],
      electronic: ["meditation", "devotional", "spiritual"],
      "hip-hop/rap": [
        "meditation",
        "new age",
        "devotional",
        "spiritual",
        "classical",
      ],
      dance: ["meditation", "new age", "ambient", "devotional"],
      punjabi: ["meditation", "new age", "ambient", "devotional", "spiritual"],
      bhangra: ["meditation", "new age", "ambient", "devotional"],
    };

    return conflictMap[genre.toLowerCase()] || [];
  }

  // Detect if a track is high energy based on keywords and patterns
  private isHighEnergyTrack(track: Track): boolean {
    const searchText = `${track.trackName} ${track.artistName}`.toLowerCase();

    // High energy keywords
    const highEnergyKeywords = [
      "dance",
      "party",
      "celebration",
      "festival",
      "beat",
      "pump",
      "energy",
      "power",
      "rock",
      "metal",
      "electronic",
      "edm",
      "remix",
      "club",
      "rave",
      "bounce",
      "thumka",
      "nachle",
      "dance",
      "party",
      "dj",
      "bass",
      "drop",
      "bangers",
    ];

    // Low energy keywords that indicate calm/meditative tracks
    const lowEnergyKeywords = [
      "meditation",
      "peace",
      "calm",
      "relax",
      "spiritual",
      "devotional",
      "prayer",
      "ambient",
      "sleep",
      "healing",
      "therapy",
      "yoga",
      "mindfulness",
      "zen",
      "soulful",
      "peaceful",
      "gentle",
      "soft",
      "whisper",
      "lullaby",
    ];

    // Check for explicit low energy indicators first
    if (lowEnergyKeywords.some((keyword) => searchText.includes(keyword))) {
      return false;
    }

    // Check for high energy indicators
    if (highEnergyKeywords.some((keyword) => searchText.includes(keyword))) {
      return true;
    }

    // Genre-based energy detection
    const genre = track.primaryGenreName?.toLowerCase() || "";
    const highEnergyGenres = [
      "dance",
      "electronic",
      "hip-hop",
      "rap",
      "rock",
      "pop",
      "bollywood",
      "punjabi",
      "bhangra",
    ];
    const lowEnergyGenres = [
      "meditation",
      "new age",
      "ambient",
      "classical",
      "devotional",
      "spiritual",
    ];

    if (lowEnergyGenres.some((g) => genre.includes(g))) {
      return false;
    }

    if (highEnergyGenres.some((g) => genre.includes(g))) {
      return true;
    }

    // Default to medium energy if unclear
    return true; // Assume energetic for uncertain cases to avoid meditation mix-ups
  }

  private async searchTracks(query: string): Promise<Track[]> {
    // Check cache first
    if (this.searchCache.has(query)) {
      return this.searchCache.get(query)!;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/search?q=${encodeURIComponent(
          query
        )}&limit=20`
      );
      const data = await response.json();

      if (data.results) {
        this.searchCache.set(query, data.results);
        return data.results;
      }
    } catch (error) {
      console.error("Search failed for query:", query, error);
    }

    return [];
  }

  private filterAndRankTracks(
    tracks: Track[],
    targetVibe: VibeProfile,
    excludeTrackIds: number[]
  ): Track[] {
    // Remove duplicates and excluded tracks
    const uniqueTracks = tracks.filter((track, index, arr) => {
      return (
        !excludeTrackIds.includes(track.trackId) &&
        track.previewUrl && // Only include tracks with previews
        arr.findIndex((t) => t.trackId === track.trackId) === index
      );
    });

    // Analyze each track and calculate compatibility
    const rankedTracks = uniqueTracks.map((track) => {
      const trackVibe = analyzeTrackVibe(track);
      const compatibility = calculateVibeCompatibility(targetVibe, trackVibe);

      // Film industry priority boost (highest priority)
      let filmIndustryBoost = 0;
      if (targetVibe.filmIndustry && trackVibe.filmIndustry) {
        if (targetVibe.filmIndustry === trackVibe.filmIndustry) {
          filmIndustryBoost = 0.4; // 40% boost for same film industry
        } else if (
          targetVibe.filmIndustry !== "other" &&
          trackVibe.filmIndustry !== "other"
        ) {
          // Check if film industries are compatible
          const compatibleIndustries: Record<string, string[]> = {
            bollywood: ["bhojpuri", "marathi_cinema"],
            tollywood: ["kollywood", "sandalwood", "mollywood"],
            kollywood: ["tollywood", "sandalwood", "mollywood"],
            mollywood: ["kollywood", "tollywood", "sandalwood"],
            sandalwood: ["kollywood", "tollywood", "mollywood"],
            punjabi_cinema: ["bollywood"],
            bhojpuri: ["bollywood"],
            marathi_cinema: ["bollywood"],
            hollywood: ["international"],
            international: ["hollywood"],
          };

          if (
            compatibleIndustries[targetVibe.filmIndustry]?.includes(
              trackVibe.filmIndustry
            )
          ) {
            filmIndustryBoost = 0.2; // 20% boost for compatible film industries
          } else {
            filmIndustryBoost = -0.5; // 50% penalty for different film industries
          }
        }
      }

      // Language priority boost (second priority)
      let languageBoost = 0;
      if (targetVibe.language && trackVibe.language) {
        if (targetVibe.language === trackVibe.language) {
          languageBoost = 0.3; // 30% boost for same language
        } else if (
          targetVibe.language !== "other" &&
          trackVibe.language !== "other"
        ) {
          languageBoost = -0.4; // 40% penalty for different languages
        }
      }

      // Genre priority boost for same primary genre
      let genreBoost = 0;
      if (targetVibe.primaryGenre && trackVibe.primaryGenre) {
        if (targetVibe.primaryGenre === trackVibe.primaryGenre) {
          genreBoost = 0.2; // 20% boost for same primary genre
        }
      }

      const finalScore = Math.max(
        0,
        Math.min(
          1,
          compatibility + filmIndustryBoost + languageBoost + genreBoost
        )
      );

      return {
        track,
        vibe: trackVibe,
        score: finalScore,
      };
    });

    // Sort by final score (language and genre prioritized)
    const sortedTracks = rankedTracks
      .sort((a, b) => b.score - a.score)
      .map((item) => item.track);

    return sortedTracks;
  }

  private blendVibeProfiles(
    current: VibeProfile,
    new_: VibeProfile
  ): VibeProfile {
    // Create a blended vibe profile that slightly adapts to user preferences
    return {
      genre: new_.genre || current.genre,
      energy: this.blendEnergy(current.energy, new_.energy),
      mood: this.blendMood(current.mood, new_.mood),
      tempo: this.blendTempo(current.tempo, new_.tempo),
      language: new_.language || current.language, // Keep language consistent
      primaryGenre: new_.primaryGenre || current.primaryGenre,
      filmIndustry: new_.filmIndustry || current.filmIndustry, // Maintain film industry consistency
    };
  }

  private blendEnergy(
    current?: string,
    new_?: string
  ): "low" | "medium" | "high" | undefined {
    if (!current || !new_) return (current as any) || (new_ as any);

    const energyLevels = { low: 1, medium: 2, high: 3 };
    const currentLevel = energyLevels[current as keyof typeof energyLevels];
    const newLevel = energyLevels[new_ as keyof typeof energyLevels];

    if (!currentLevel || !newLevel) return current as any;

    // Slightly adjust towards new energy level
    const blended = Math.round(currentLevel * 0.7 + newLevel * 0.3);
    const energyKeys = Object.keys(energyLevels) as Array<
      keyof typeof energyLevels
    >;
    return energyKeys[blended - 1];
  }

  private blendMood(
    current?: string,
    new_?: string
  ): "happy" | "sad" | "energetic" | "relaxed" | "party" | "chill" | undefined {
    if (!current || !new_) return (current as any) || (new_ as any);

    // If moods are compatible, keep current, otherwise adapt slightly
    const compatibleMoods: Record<string, string[]> = {
      happy: ["energetic", "party"],
      energetic: ["happy", "party"],
      party: ["happy", "energetic"],
      chill: ["relaxed"],
      relaxed: ["chill"],
    };

    if (compatibleMoods[current]?.includes(new_)) {
      return current as
        | "happy"
        | "sad"
        | "energetic"
        | "relaxed"
        | "party"
        | "chill"; // Keep current mood if compatible
    }

    return new_ as
      | "happy"
      | "sad"
      | "energetic"
      | "relaxed"
      | "party"
      | "chill"; // Adapt to new mood if not compatible
  }

  private blendTempo(
    current?: string,
    new_?: string
  ): "slow" | "medium" | "fast" | undefined {
    if (!current || !new_) return (current as any) || (new_ as any);

    const tempoLevels = { slow: 1, medium: 2, fast: 3 };
    const currentLevel = tempoLevels[current as keyof typeof tempoLevels];
    const newLevel = tempoLevels[new_ as keyof typeof tempoLevels];

    if (!currentLevel || !newLevel) return current as any;

    // Slightly adjust towards new tempo
    const blended = Math.round(currentLevel * 0.7 + newLevel * 0.3);
    const tempoKeys = Object.keys(tempoLevels) as Array<
      keyof typeof tempoLevels
    >;
    return tempoKeys[blended - 1];
  }

  // Clear history and reset
  clearHistory(): void {
    this.setState({
      playedTracks: [],
      nextTracks: [],
    });
  }

  // Get played tracks history
  getPlayedTracks(): Track[] {
    return this.state.playedTracks;
  }

  // Get next tracks preview
  getNextTracks(): Track[] {
    return this.state.nextTracks.slice(0, 5); // Return next 5 tracks
  }
}

// Create a singleton instance
export const djController = new DJController();
