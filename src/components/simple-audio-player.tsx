import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Track } from "@/lib/types";
import { Slider } from "@/components/ui/slider";

interface SimpleAudioPlayerProps {
  currentTrack: Track | null;
  isVisible: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function SimpleAudioPlayer({ currentTrack, isVisible }: SimpleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load new track and auto-play
  useEffect(() => {
    if (currentTrack?.previewUrl && audioRef.current) {
      const audio = audioRef.current;
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      
      audio.src = currentTrack.previewUrl;
      audio.load();
      
      const handleLoadedData = () => {
        setDuration(audio.duration);
        setIsLoading(false);
        
        // Auto-play when track loads
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Auto-play failed:', error);
          // If auto-play fails, that's okay - user can manually play
        });
      };
      
      const handleError = () => {
        console.error('Audio loading error for:', currentTrack.previewUrl);
        setIsLoading(false);
      };
      
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [currentTrack]);

  // Audio event listeners - re-attach when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentTrack]);

  // Set volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.previewUrl) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const replay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.currentTime = 0;
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Replay error:', error);
    }
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  if (!currentTrack || !isVisible) {
    return null;
  }

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;
  const artwork = currentTrack.artworkUrl100 || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200";

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 p-4 shadow-2xl" style={{ backgroundColor: 'var(--music-gray)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          {/* Track Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <img 
              src={artwork} 
              alt={currentTrack.trackName} 
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200";
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold truncate">{currentTrack.trackName}</h4>
              <p className="text-sm truncate" style={{ color: 'var(--music-light-gray)' }}>
                {currentTrack.artistName}
              </p>
              <p className="text-xs text-gray-500">30-second preview</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4 mx-8">
            <button 
              onClick={replay}
              className="transition-colors duration-200 hover:text-white" 
              style={{ color: 'var(--music-light-gray)' }}
              title="Replay preview"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={togglePlayPause}
              disabled={isLoading || !currentTrack.previewUrl}
              className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="text-white" size={20} />
              ) : (
                <Play className="text-white ml-0.5" size={20} />
              )}
            </button>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center space-x-3 flex-1 justify-end">
            {volume === 0 ? (
              <VolumeX style={{ color: 'var(--music-light-gray)' }} size={20} />
            ) : (
              <Volume2 style={{ color: 'var(--music-light-gray)' }} size={20} />
            )}
            <div className="w-24">
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="slider"
              />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center space-x-3">
          <span className="text-xs min-w-[40px]" style={{ color: 'var(--music-light-gray)' }}>
            {formatTime(currentTime)}
          </span>
          <div className="flex-1">
            <Slider
              key={`progress-${currentTrack?.trackId || 'none'}`}
              value={[Math.max(0, Math.min(100, progressPercentage))]}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="slider"
            />
          </div>
          <span className="text-xs min-w-[40px]" style={{ color: 'var(--music-light-gray)' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}