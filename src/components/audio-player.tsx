import { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Shuffle,
  Repeat,
  RotateCcw
} from "lucide-react";
import { Track, PlayerState } from "@/lib/types";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  currentTrack: Track | null;
  isVisible: boolean;
  onClose?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ currentTrack, isVisible }: AudioPlayerProps) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 70,
    isLoading: false,
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (currentTrack && currentTrack !== playerState.currentTrack) {
      setPlayerState(prev => ({
        ...prev,
        currentTrack,
        isLoading: true,
        isPlaying: false,
      }));
      
      if (audioRef.current && currentTrack.previewUrl) {
        audioRef.current.src = currentTrack.previewUrl;
        audioRef.current.load();
      }
    }
  }, [currentTrack, playerState.currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial volume
    audio.volume = playerState.volume / 100;

    const handleLoadedMetadata = () => {
      setPlayerState(prev => ({
        ...prev,
        duration: audio.duration,
        isLoading: false,
      }));
    };

    const handleTimeUpdate = () => {
      setPlayerState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handleEnded = () => {
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false,
      }));
    };

    const handleCanPlay = () => {
      setPlayerState(prev => ({
        ...prev,
        isLoading: false,
      }));
    };

    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      setPlayerState(prev => ({
        ...prev,
        isLoading: false,
      }));
    };

    const handleLoadStart = () => {
      setPlayerState(prev => ({
        ...prev,
        isLoading: true,
      }));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.previewUrl) {
      console.error('No audio element or preview URL');
      return;
    }

    try {
      if (playerState.isPlaying) {
        audio.pause();
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      } else {
        setPlayerState(prev => ({ ...prev, isLoading: true }));
        await audio.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setPlayerState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
    }
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !playerState.duration) return;
    
    const newTime = (value[0] / 100) * playerState.duration;
    audio.currentTime = newTime;
    setPlayerState(prev => ({ ...prev, currentTime: newTime }));
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    const volume = value[0];
    
    if (audio) {
      audio.volume = volume / 100;
    }
    
    setPlayerState(prev => ({ ...prev, volume }));
  };

  const replayTrack = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.previewUrl) {
      console.error('No audio element or preview URL for replay');
      return;
    }

    try {
      audio.currentTime = 0;
      setPlayerState(prev => ({ ...prev, isLoading: true }));
      await audio.play();
      setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
    } catch (error) {
      console.error('Replay failed:', error);
      setPlayerState(prev => ({ ...prev, isLoading: false, isPlaying: false }));
    }
  };

  if (!currentTrack || !isVisible) {
    return null;
  }

  const progressPercentage = playerState.duration ? (playerState.currentTime / playerState.duration) * 100 : 0;
  const artwork = currentTrack.artworkUrl100 || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80";

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 p-4 shadow-2xl" style={{ backgroundColor: 'var(--music-gray)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          {/* Current Song Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <img 
              src={artwork} 
              alt={currentTrack.trackName} 
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80";
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

          {/* Playback Controls */}
          <div className="flex items-center space-x-4 mx-8">
            <button 
              onClick={replayTrack}
              className="transition-colors duration-200 hover:text-white" 
              style={{ color: 'var(--music-light-gray)' }}
              title="Replay preview"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={togglePlayPause}
              disabled={playerState.isLoading || !currentTrack.previewUrl}
              className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200 disabled:opacity-50"
            >
              {playerState.isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : playerState.isPlaying ? (
                <Pause className="text-white" size={20} />
              ) : (
                <Play className="text-white ml-0.5" size={20} />
              )}
            </button>
            <button 
              className="transition-colors duration-200 hover:text-white" 
              style={{ color: 'var(--music-light-gray)' }}
              title="30-second preview only"
              disabled
            >
              <Repeat size={20} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center space-x-3 flex-1 justify-end">
            {playerState.volume === 0 ? (
              <VolumeX style={{ color: 'var(--music-light-gray)' }} size={20} />
            ) : (
              <Volume2 style={{ color: 'var(--music-light-gray)' }} size={20} />
            )}
            <div className="w-24">
              <Slider
                value={[playerState.volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="slider"
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-xs min-w-[40px]" style={{ color: 'var(--music-light-gray)' }}>
            {formatTime(playerState.currentTime)}
          </span>
          <div className="flex-1">
            <Slider
              value={[progressPercentage]}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="slider"
            />
          </div>
          <span className="text-xs min-w-[40px]" style={{ color: 'var(--music-light-gray)' }}>
            {formatTime(playerState.duration)}
          </span>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        preload="auto" 
        crossOrigin="anonymous"
        controls={false}
      />
    </div>
  );
}
