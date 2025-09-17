import { Track, VibeProfile } from "@/lib/types";
import { analyzeTrackVibe, calculateVibeCompatibility } from "@/lib/vibe-analyzer";
import { djController } from "@/lib/dj-controller";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Plus, Radio, Zap, TrendingUp, Clock } from "lucide-react";

interface DJTrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  currentVibeProfile?: VibeProfile | null;
  showVibeInfo?: boolean;
}

function getVibeColor(vibe: VibeProfile): string {
  const moodColors = {
    'party': '#ff6b6b',
    'energetic': '#ff8e53', 
    'happy': '#ffd93d',
    'chill': '#6bcf7f',
    'relaxed': '#4ecdc4',
    'sad': '#a8dadc',
  };
  
  return moodColors[vibe.mood as keyof typeof moodColors] || '#9ca3af';
}

function getEnergyIcon(energy?: string) {
  switch (energy) {
    case 'high': return <Zap size={14} className="text-red-400" />;
    case 'medium': return <TrendingUp size={14} className="text-yellow-400" />;
    case 'low': return <Clock size={14} className="text-blue-400" />;
    default: return null;
  }
}

export default function DJTrackCard({ track, onPlay, currentVibeProfile, showVibeInfo = false }: DJTrackCardProps) {
  const trackVibe = analyzeTrackVibe(track);
  const compatibility = currentVibeProfile ? calculateVibeCompatibility(currentVibeProfile, trackVibe) : 0;
  
  const artwork = track.artworkUrl100 || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600";

  const handleAddToQueue = async () => {
    await djController.addTrackToQueue(track);
  };

  const compatibilityScore = Math.round(compatibility * 100);
  const isHighCompatibility = compatibility > 0.7;
  const isMediumCompatibility = compatibility > 0.4;

  return (
    <div className="group relative">
      <div className="aspect-square rounded-lg overflow-hidden relative bg-gray-800">
        <img 
          src={artwork}
          alt={track.trackName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600";
          }}
        />
        
        {/* Vibe compatibility indicator */}
        {showVibeInfo && currentVibeProfile && (
          <div className="absolute top-2 left-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${isHighCompatibility ? 'border-green-400 text-green-400' : 
                                    isMediumCompatibility ? 'border-yellow-400 text-yellow-400' : 
                                    'border-gray-400 text-gray-400'}`}
            >
              {compatibilityScore}% match
            </Badge>
          </div>
        )}

        {/* Vibe indicator */}
        {showVibeInfo && (
          <div className="absolute top-2 right-2">
            <div 
              className="w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: getVibeColor(trackVibe) }}
              title={`${trackVibe.mood} • ${trackVibe.energy}`}
            />
          </div>
        )}

        {/* Preview availability indicator */}
        {!track.previewUrl && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="outline" className="text-xs border-red-400 text-red-400">
              No preview
            </Badge>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              onClick={() => onPlay(track)}
              disabled={!track.previewUrl}
              className="w-10 h-10 rounded-full gradient-bg p-0 hover:scale-110 transition-transform"
            >
              <Play size={16} className="text-white ml-0.5" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToQueue}
              className="w-10 h-10 rounded-full p-0 border-white/20 hover:border-white hover:bg-white/10"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Track info */}
      <div className="mt-3 space-y-1">
        <h3 className="font-medium text-white truncate text-sm">{track.trackName}</h3>
        <p className="text-gray-400 text-xs truncate">{track.artistName}</p>
        
        {/* Vibe info */}
        {showVibeInfo && (
          <div className="flex items-center gap-2 mt-2">
            {getEnergyIcon(trackVibe.energy)}
            <div className="flex gap-1">
              {trackVibe.mood && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: getVibeColor(trackVibe),
                    color: getVibeColor(trackVibe)
                  }}
                >
                  {trackVibe.mood}
                </Badge>
              )}
              {trackVibe.genre && (
                <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                  {trackVibe.genre}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}