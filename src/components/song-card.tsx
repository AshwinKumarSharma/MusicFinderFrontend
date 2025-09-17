import { Play } from "lucide-react";
import { Track } from "@/lib/types";

interface SongCardProps {
  track: Track;
  onPlay: (track: Track) => void;
}

function formatDuration(milliseconds?: number): string {
  if (!milliseconds) return "--:--";
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SongCard({ track, onPlay }: SongCardProps) {
  const artwork = track.artworkUrl100 || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600";
  const hasPreview = !!track.previewUrl;

  return (
    <div 
      className={`rounded-xl overflow-hidden hover:bg-gray-700 transition-all duration-200 group ${hasPreview ? 'cursor-pointer' : 'cursor-default opacity-75'}`}
      style={{ backgroundColor: 'var(--music-gray)' }}
      onClick={() => hasPreview && onPlay(track)}
    >
      {/* Full-size poster area */}
      <div className="relative">
        <img 
          src={artwork} 
          alt={`${track.trackName} artwork`} 
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600";
          }}
        />
        {/* Play button overlay */}
        {hasPreview && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
            <button 
              className="w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform scale-75 group-hover:scale-100"
              style={{ backgroundColor: 'var(--music-purple)' }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(track);
              }}
            >
              <Play className="text-white ml-0.5" size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Track info section */}
      <div className="p-4">
        <h4 className="font-semibold mb-1 truncate text-sm">{track.trackName}</h4>
        <p className="text-xs mb-2 truncate" style={{ color: 'var(--music-light-gray)' }}>
          {track.artistName}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--music-light-gray)' }}>
            {formatDuration(track.trackTimeMillis)}
          </span>
          {!hasPreview && (
            <span className="text-xs text-gray-500">No preview</span>
          )}
        </div>
      </div>
    </div>
  );
}
