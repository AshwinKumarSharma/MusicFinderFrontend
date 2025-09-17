import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Music, Radio, Search } from "lucide-react";
import Header from "@/components/header";
import SearchSection from "@/components/search-section";
import SearchResults from "@/components/search-results";
import VirtualDJPlayer from "@/components/virtual-dj-player";
import DJModeCards from "@/components/dj-mode-cards";
import { Track, SearchResponse, DJMode } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { djController } from "@/lib/dj-controller";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDJModeView, setShowDJModeView] = useState(false);
  const [selectedDJMode, setSelectedDJMode] = useState<DJMode | null>(null);

  const { data: searchResults, isLoading, error } = useQuery<SearchResponse>({
    queryKey: [`/api/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: !!searchQuery,
  });

  const saveSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/search-history", { query });
      return response.json();
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
    saveSearchMutation.mutate(query);
  };

  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
  };

  const handleDJModeSelect = (mode: DJMode) => {
    setSelectedDJMode(mode);
    setShowDJModeView(true);
    
    // Add a small delay to allow the queue to be built, then check for tracks
    setTimeout(() => {
      const djState = djController.getState();
      if (djState.currentQueue && djState.currentQueue.tracks.length > 0) {
        const firstTrack = djState.currentQueue.tracks[0];
        console.log(`🎵 Setting current track for playback: ${firstTrack.trackName}`);
        setCurrentTrack(firstTrack);
      } else {
        console.warn('⚠️ No tracks available in DJ queue after mode selection');
      }
    }, 500); // 500ms delay to allow queue building
  };

  const handleDJModeToggle = () => {
    setShowDJModeView(!showDJModeView);
  };

  const showEmptyState = !hasSearched && !searchQuery;
  const showResults = hasSearched || isLoading || error;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--music-dark)' }}>
      <Header onDJModeClick={handleDJModeToggle} />
      
      <main className="max-w-6xl mx-auto px-4 py-8 pb-32">
        <SearchSection onSearch={handleSearch} isLoading={isLoading} />
        
        {/* DJ Mode Cards - Always visible below search */}
        <div id="dj-modes-section">
          <DJModeCards onModeSelect={handleDJModeSelect} />
        </div>

        {/* Toggle between Search Results and DJ Mode View */}
        {(showResults || showDJModeView) && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 p-4 rounded-2xl border border-gray-600" style={{ backgroundColor: 'var(--music-gray)' }}>
              <div className="flex items-center gap-3">
                <Search className={`${!showDJModeView ? 'text-purple-400' : 'text-gray-400'}`} size={20} />
                <span className={`font-medium ${!showDJModeView ? 'text-white' : 'text-gray-400'}`}>
                  Search Results
                </span>
              </div>
              
              <Switch
                checked={showDJModeView}
                onCheckedChange={setShowDJModeView}
                className="data-[state=checked]:bg-purple-600"
                data-testid="dj-mode-toggle"
              />
              
              <div className="flex items-center gap-3">
                <Radio className={`${showDJModeView ? 'text-purple-400' : 'text-gray-400'}`} size={20} />
                <span className={`font-medium ${showDJModeView ? 'text-white' : 'text-gray-400'}`}>
                  DJ Mode {selectedDJMode ? `- ${selectedDJMode.name}` : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Search Results View */}
        {showResults && !showDJModeView && (
          <SearchResults 
            results={searchResults?.results || []}
            isLoading={isLoading}
            error={error instanceof Error ? error.message : null}
            onPlay={handlePlayTrack}
          />
        )}

        {/* DJ Mode View */}
        {showDJModeView && selectedDJMode && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-6">{selectedDJMode.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{selectedDJMode.name} Active</h3>
              <p className="mb-6" style={{ color: 'var(--music-light-gray)' }}>
                {selectedDJMode.description}
              </p>
              <div className="text-sm text-green-400 mb-4">
                🎵 DJ Mode is curating your playlist continuously
              </div>
              <Button 
                className="gradient-bg px-6 py-3 rounded-xl text-white font-medium hover:scale-105 transition-transform duration-200"
                onClick={() => setShowDJModeView(false)}
              >
                View Search Results
              </Button>
            </div>
          </div>
        )}

        {showEmptyState && (
          <section className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="text-white text-2xl" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Start Your Musical Journey</h3>
              <p className="mb-6" style={{ color: 'var(--music-light-gray)' }}>
                Choose a DJ mode above or search for your favorite songs
              </p>
              <Button 
                className="gradient-bg px-6 py-3 rounded-xl text-white font-medium hover:scale-105 transition-transform duration-200"
                onClick={() => document.querySelector('input')?.focus()}
              >
                Search Music
              </Button>
            </div>
          </section>
        )}
      </main>

      <VirtualDJPlayer 
        currentTrack={currentTrack}
        isVisible={!!currentTrack}
        onTrackChange={setCurrentTrack}
      />
    </div>
  );
}
