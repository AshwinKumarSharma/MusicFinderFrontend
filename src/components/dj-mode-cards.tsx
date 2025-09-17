import { useState } from "react";
import { Play, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { DJMode } from "@/lib/types";
import { getAllDJModes } from "@/lib/dj-modes";
import { djController } from "@/lib/dj-controller";

interface DJModeCardsProps {
  onModeSelect?: (mode: DJMode) => void;
  className?: string;
}

function getEnergyColor(energy: string): string {
  switch (energy) {
    case 'high': return 'bg-blue-500 text-white'; // Blue for high energy
    case 'medium': return 'bg-green-500 text-white'; // Green for medium energy  
    case 'low': return 'bg-yellow-500 text-black'; // Yellow for low energy
    default: return 'bg-gray-500 text-white';
  }
}

function EnergyBadge({ energy }: { energy: string }) {
  return (
    <Badge className={`${getEnergyColor(energy)} font-medium`}>
      {energy.charAt(0).toUpperCase() + energy.slice(1)} Energy
    </Badge>
  );
}

function DJModeCard({ mode, onSelect }: { mode: DJMode; onSelect?: (mode: DJMode) => void }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(mode);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleSelect}
            data-testid={`dj-mode-card-${mode.id}`}
          >
            <div 
              className="p-6 rounded-2xl border border-gray-600 hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-2xl"
              style={{ backgroundColor: 'var(--music-gray)' }}
            >
              {/* Header with Icon and Energy */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl mb-2">{mode.icon}</div>
                <EnergyBadge energy={mode.energy} />
              </div>

              {/* Title and Description */}
              <h3 className="text-xl font-bold mb-2 text-white">{mode.name}</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--music-light-gray)' }}>
                {mode.description}
              </p>

              {/* Genres */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {mode.genres.slice(0, 3).map((genre, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-xs border-gray-500 text-gray-300"
                    >
                      {genre}
                    </Badge>
                  ))}
                  {mode.genres.length > 3 && (
                    <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                      +{mode.genres.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Hover Overlay */}
              {isHovered && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center transition-all duration-300">
                  <Button 
                    className="gradient-bg text-white rounded-full p-4 shadow-lg transform scale-110"
                    data-testid={`play-mode-${mode.id}`}
                  >
                    <Play size={24} fill="white" />
                  </Button>
                </div>
              )}

              {/* Language Indicator */}
              <div className="absolute top-3 left-3">
                <Badge className="bg-purple-600 text-white text-xs">
                  {mode.language.charAt(0).toUpperCase() + mode.language.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="p-2">
            <p className="font-semibold">{mode.name}</p>
            <p className="text-sm text-gray-300 mb-2">{mode.description}</p>
            <p className="text-xs text-gray-400">
              Languages: {mode.language} • Energy: {mode.energy} • Genres: {mode.genres.join(', ')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DJModeCards({ onModeSelect, className = "" }: DJModeCardsProps) {
  const djModes = getAllDJModes();

  const handleModeSelect = async (mode: DJMode) => {
    try {
      // Start DJ mode with the selected mode ID
      await djController.startDJModeWithMode(mode.id);
      
      // Get the current DJ state to check if we have a queue
      const djState = djController.getState();
      
      // If we have a queue with tracks, get the first track
      if (djState.currentQueue && djState.currentQueue.tracks.length > 0) {
        const firstTrack = djState.currentQueue.tracks[0];
        console.log(`🎵 Starting playback for DJ mode: ${mode.name} with track: ${firstTrack.trackName}`);
        
        // Pass the first track to the parent component for playback
        if (onModeSelect) {
          onModeSelect(mode);
        }
        
        // We need to trigger the track change in the parent
        // This will be handled by the VirtualDJPlayer monitoring DJ state changes
      } else {
        console.warn('⚠️ No tracks available in DJ queue');
      }
    } catch (error) {
      console.error('Failed to start DJ mode:', error);
    }
  };

  return (
    <section className={`mb-12 ${className}`}>
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="text-purple-400" size={24} />
          <h2 className="text-3xl font-bold gradient-text">Choose Your Vibe</h2>
          <Sparkles className="text-purple-400" size={24} />
        </div>
        <p className="text-lg" style={{ color: 'var(--music-light-gray)' }}>
          Pick a DJ mode and let our AI curate the perfect playlist for your mood
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {djModes.map((mode) => (
          <DJModeCard 
            key={mode.id} 
            mode={mode} 
            onSelect={handleModeSelect}
          />
        ))}
      </div>
    </section>
  );
}