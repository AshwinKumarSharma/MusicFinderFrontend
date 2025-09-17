import { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Shuffle,
  RotateCcw,
  Music,
  Zap,
  Radio,
  Clock,
  List,
  TrendingUp,
  Settings
} from "lucide-react";
import { Track, DJState, VibeProfile, DJMode } from "@/lib/types";
import { djController } from "@/lib/dj-controller";
import { DJTransitionController, TransitionEvent, TransitionSettings } from "@/lib/dj-transition-engine";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DJModeSelector } from "./dj-mode-selector";

interface VirtualDJPlayerProps {
  currentTrack: Track | null;
  isVisible: boolean;
  onTrackChange?: (track: Track) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getVibeColor(vibe: VibeProfile | null): string {
  if (!vibe) return 'var(--music-light-gray)';
  
  const moodColors = {
    'party': '#ff6b6b',
    'energetic': '#ff8e53',
    'happy': '#ffd93d',
    'chill': '#6bcf7f',
    'relaxed': '#4ecdc4',
    'sad': '#a8dadc',
  };
  
  return moodColors[vibe.mood as keyof typeof moodColors] || 'var(--music-light-gray)';
}

function getEnergyIcon(energy?: string) {
  switch (energy) {
    case 'high': return <Zap size={16} className="text-red-400" />;
    case 'medium': return <TrendingUp size={16} className="text-yellow-400" />;
    case 'low': return <Clock size={16} className="text-blue-400" />;
    default: return <Music size={16} />;
  }
}

export default function VirtualDJPlayer({ currentTrack, isVisible, onTrackChange }: VirtualDJPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isLoading, setIsLoading] = useState(false);
  const [djState, setDjState] = useState<DJState>(djController.getState());
  const [showQueue, setShowQueue] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSettings, setTransitionSettings] = useState<TransitionSettings>({
    crossfadeDuration: 7.0,
    gapDuration: 0.5,
    volumeCurve: 'smooth',
    transitionType: 'crossfade'
  });
  
  const transitionEngine = useRef<DJTransitionController | null>(null);
  const trackEndedRef = useRef(false);
  const nextTrackScheduled = useRef(false);

  // Initialize transition engine
  useEffect(() => {
    if (!transitionEngine.current) {
      transitionEngine.current = new DJTransitionController();
      transitionEngine.current.updateTransitionSettings(transitionSettings);
    }

    return () => {
      if (transitionEngine.current) {
        transitionEngine.current.destroy();
      }
    };
  }, []);

  // Subscribe to DJ state changes
  useEffect(() => {
    const unsubscribe = djController.subscribe(setDjState);
    return () => {
      unsubscribe();
    };
  }, []);

  // Subscribe to transition engine events
  useEffect(() => {
    if (!transitionEngine.current) return;

    const handleTransitionEvent = (event: TransitionEvent) => {
      switch (event.type) {
        case 'trackLoaded':
          setIsLoading(false);
          setDuration(transitionEngine.current!.getDuration());
          break;
        case 'trackStarted':
          setIsPlaying(true);
          setIsLoading(false);
          break;
        case 'transitionStarted':
          setIsTransitioning(true);
          break;
        case 'transitionCompleted':
          setIsTransitioning(false);
          if (currentTrack && djState.isActive) {
            djController.markTrackPlayed(currentTrack);
          }
          break;
        case 'paused':
          setIsPlaying(false);
          break;
        case 'resumed':
          setIsPlaying(true);
          break;
        case 'stopped':
          setIsPlaying(false);
          setCurrentTime(0);
          break;
        case 'error':
          console.error('Transition engine error:', event.error);
          setIsLoading(false);
          setIsTransitioning(false);
          break;
      }
    };

    const unsubscribe = transitionEngine.current.subscribe(handleTransitionEvent);
    return () => {
      unsubscribe();
    };
  }, [currentTrack, djState.isActive]);

  // Handle track changes with DJ transitions
  useEffect(() => {
    if (!currentTrack?.previewUrl || !transitionEngine.current) return;

    const engine = transitionEngine.current;
    setIsLoading(true);
    nextTrackScheduled.current = false;

    const loadAndPlay = async () => {
      try {
        if (engine.isPlaying()) {
          // Use transition for smoother DJ-style mixing
          await engine.transitionToTrack(currentTrack, volume / 100);
        } else {
          // First track or stopped state - play directly
          await engine.playTrack(currentTrack, volume / 100);
        }
      } catch (error) {
        console.error('Failed to play track:', error);
        setIsLoading(false);
      }
    };

    loadAndPlay();
  }, [currentTrack]); // Remove volume from dependencies to prevent crossfade on volume change

  // Update time and handle track ending/transitions
  useEffect(() => {
    if (!transitionEngine.current) return;

    const updateTime = () => {
      const engine = transitionEngine.current!;
      setCurrentTime(engine.getCurrentTime());
      
      // Handle automatic transitions in DJ mode
      if (djState.isActive && autoPlayNext && !nextTrackScheduled.current && !isTransitioning) {
        const timeRemaining = engine.getDuration() - engine.getCurrentTime();
        const { crossfadeDuration } = transitionSettings;
        
        // Schedule next track when approaching end
        if (timeRemaining <= crossfadeDuration + 2 && timeRemaining > 0) {
          const nextTrack = djController.getNextTrack();
          if (nextTrack && onTrackChange) {
            nextTrackScheduled.current = true;
            // Start transition before current track ends
            setTimeout(() => {
              onTrackChange(nextTrack);
            }, (timeRemaining - crossfadeDuration) * 1000);
          }
        }
      }
    };

    const interval = setInterval(updateTime, 100); // Update every 100ms for smooth progress
    return () => clearInterval(interval);
  }, [djState.isActive, autoPlayNext, isTransitioning, transitionSettings, onTrackChange]);

  // Set volume
  useEffect(() => {
    if (transitionEngine.current) {
      transitionEngine.current.setVolume(volume / 100);
    }
  }, [volume]);

  const togglePlayPause = async () => {
    if (!transitionEngine.current || !currentTrack?.previewUrl) return;

    try {
      if (isPlaying) {
        transitionEngine.current.pause();
      } else {
        transitionEngine.current.resume();
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const replay = async () => {
    if (!transitionEngine.current || !currentTrack) return;

    try {
      transitionEngine.current.setCurrentTime(0);
      if (!isPlaying) {
        transitionEngine.current.resume();
      }
    } catch (error) {
      console.error('Replay error:', error);
    }
  };

  const playNextTrack = () => {
    if (djState.isActive) {
      const nextTrack = djController.getNextTrack();
      if (nextTrack && onTrackChange) {
        onTrackChange(nextTrack);
      }
    }
  };

  const startDJMode = async () => {
    if (currentTrack) {
      await djController.startDJMode(currentTrack);
    }
  };

  const stopDJMode = () => {
    djController.stopDJMode();
  };

  // DJ Mode Selection Handlers
  const handleModeSelect = (mode: DJMode) => {
    djController.setDJMode(mode.id);
  };

  const handleStartDJMode = async (modeId: string) => {
    setShowModeSelector(false);
    await djController.startDJModeWithMode(modeId);
  };

  const toggleAutoQueue = () => {
    djController.toggleAutoQueue();
  };

  const handleProgressChange = (value: number[]) => {
    if (!transitionEngine.current || !duration) return;
    
    const newTime = (value[0] / 100) * duration;
    transitionEngine.current.setCurrentTime(newTime);
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
  
  const nextTracks = djController.getNextTracks();
  const queueStatus = djController.getQueueStatus();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 shadow-2xl" style={{ backgroundColor: 'var(--music-gray)' }}>
      {/* Queue Display */}
      {showQueue && djState.isActive && (
        <div className="border-b border-gray-700 p-4 max-h-48 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Radio size={16} />
                Virtual DJ Queue
                {djState.currentVibeProfile && (
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: getVibeColor(djState.currentVibeProfile) }}
                  >
                    {djState.currentVibeProfile.mood} • {djState.currentVibeProfile.energy}
                  </Badge>
                )}
              </h3>
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => setShowQueue(false)}
                className="text-gray-400 hover:text-white"
              >
                Hide Queue
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">
                Next up: {queueStatus.nextCount} tracks • Played: {queueStatus.playedCount} tracks
              </div>
              
              {nextTracks.length > 0 ? (
                <div className="grid gap-2">
                  {nextTracks.map((track, index) => (
                    <div key={track.trackId} className="flex items-center gap-3 p-2 rounded bg-gray-800/50">
                      <div className="w-6 h-6 rounded bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <img 
                        src={track.artworkUrl100} 
                        alt={track.trackName}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{track.trackName}</div>
                        <div className="text-xs text-gray-400 truncate">{track.artistName}</div>
                      </div>
                      {getEnergyIcon(djState.currentVibeProfile?.energy)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <Music className="mx-auto mb-2" size={24} />
                  <div className="text-sm">Building your perfect playlist...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Player */}
      <div className="p-4">
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">30-second preview</p>
                  {djState.isActive && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: getVibeColor(djState.currentVibeProfile) }}
                    >
                      <Radio size={12} className="mr-1" />
                      DJ Mode
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4 mx-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={replay}
                    className="transition-colors duration-200 hover:text-white" 
                    style={{ color: 'var(--music-light-gray)' }}
                  >
                    <RotateCcw size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Replay preview</TooltipContent>
              </Tooltip>
              
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
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={playNextTrack}
                    disabled={!djState.isActive || nextTracks.length === 0}
                    className="transition-colors duration-200 hover:text-white disabled:opacity-50" 
                    style={{ color: 'var(--music-light-gray)' }}
                  >
                    <SkipForward size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Next track</TooltipContent>
              </Tooltip>
            </div>

            {/* DJ Controls & Volume */}
            <div className="flex items-center space-x-3 flex-1 justify-end">
              {/* DJ Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={djState.isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={djState.isActive ? stopDJMode : () => setShowModeSelector(true)}
                    className={djState.isActive ? "gradient-bg" : "hover:bg-gray-700"}
                  >
                    <Radio size={16} className="mr-2" />
                    {djState.isActive ? (
                      djState.selectedMode ? `DJ: ${djState.selectedMode.name}` : "Stop DJ"
                    ) : "DJ Modes"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {djState.isActive ? "Stop virtual DJ mode" : "Choose DJ party mode"}
                </TooltipContent>
              </Tooltip>
              
              {/* Auto Queue Toggle */}
              {djState.isActive && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={toggleAutoQueue}
                      className={`transition-colors duration-200 hover:text-white ${djState.autoQueue ? 'text-purple-400' : ''}`}
                      style={{ color: djState.autoQueue ? undefined : 'var(--music-light-gray)' }}
                    >
                      <Shuffle size={18} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {djState.autoQueue ? "Auto-queue enabled" : "Auto-queue disabled"}
                  </TooltipContent>
                </Tooltip>
              )}

              
              {/* Queue Toggle */}
              {djState.isActive && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => setShowQueue(!showQueue)}
                      className="transition-colors duration-200 hover:text-white" 
                      style={{ color: 'var(--music-light-gray)' }}
                    >
                      <List size={18} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Show queue ({queueStatus.nextCount})</TooltipContent>
                </Tooltip>
              )}
              
              {/* Volume */}
              <div className="hidden md:flex items-center space-x-3">
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
            
            {/* Transition indicator */}
            {isTransitioning && (
              <div className="text-xs text-purple-400 animate-pulse flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                Crossfading...
              </div>
            )}
            
            {/* Auto-advance indicator */}
            {djState.isActive && autoPlayNext && !isTransitioning && currentTime > duration - transitionSettings.crossfadeDuration - 2 && (
              <div className="text-xs text-purple-400 animate-pulse">
                Next track ready...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DJ Mode Selection Modal */}
      {showModeSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Select DJ Mode</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModeSelector(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              
              <DJModeSelector
                selectedMode={djState.selectedMode}
                onModeSelect={handleModeSelect}
                onStartDJ={handleStartDJMode}
                isActive={djState.isActive}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}