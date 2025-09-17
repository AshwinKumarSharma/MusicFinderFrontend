import { useState, useEffect } from "react";
import { Track, DJState } from "@/lib/types";
import SongCard from "./song-card";
import DJTrackCard from "./dj-track-card";
import { djController } from "@/lib/dj-controller";
import { Loader2, AlertCircle, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SearchResultsProps {
  results: Track[];
  isLoading: boolean;
  error: string | null;
  onPlay: (track: Track) => void;
}

export default function SearchResults({ results, isLoading, error, onPlay }: SearchResultsProps) {
  const [djState, setDjState] = useState<DJState>(djController.getState());
  const [showVibeMode, setShowVibeMode] = useState(false);

  useEffect(() => {
    const unsubscribe = djController.subscribe(setDjState);
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin h-12 w-12 mb-4" style={{ color: 'var(--music-purple)' }} />
          <p style={{ color: 'var(--music-light-gray)' }}>Searching for music...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertCircle className="text-red-400 text-2xl mb-3 mx-auto" size={24} />
          <h3 className="text-red-400 font-semibold mb-2">Search Failed</h3>
          <p className="text-red-300">{error}</p>
        </div>
      </section>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Search Results</h3>
          {djState.isActive && (
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              <Radio size={14} className="mr-1" />
              DJ Mode
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--music-light-gray)' }}>
            {results.length} songs found
          </span>
          
          {djState.isActive && djState.currentVibeProfile && (
            <Button
              variant={showVibeMode ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVibeMode(!showVibeMode)}
              className={showVibeMode ? "gradient-bg" : ""}
            >
              <Sparkles size={16} className="mr-2" />
              Vibe Analysis
            </Button>
          )}
        </div>
      </div>

      {djState.isActive && djState.currentVibeProfile && showVibeMode && (
        <div className="mb-6 p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={16} className="text-purple-400" />
            <h3 className="font-semibold text-purple-300">Current DJ Vibe</h3>
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              {djState.currentVibeProfile.mood}
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              {djState.currentVibeProfile.energy} energy
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              {djState.currentVibeProfile.genre}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Tracks are analyzed for compatibility with your party vibe. Look for the percentage match!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        {results.map((track) => (
          showVibeMode && djState.isActive ? (
            <DJTrackCard 
              key={track.trackId} 
              track={track} 
              onPlay={onPlay}
              currentVibeProfile={djState.currentVibeProfile}
              showVibeInfo={true}
            />
          ) : (
            <SongCard key={track.trackId} track={track} onPlay={onPlay} />
          )
        ))}
      </div>
    </section>
  );
}
