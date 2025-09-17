import { Track } from './types';

export interface TransitionSettings {
  crossfadeDuration: number; // in seconds
  gapDuration: number; // gap between tracks in seconds  
  volumeCurve: 'linear' | 'exponential' | 'smooth';
  transitionType: 'crossfade' | 'cut' | 'beatmatch';
}

export interface DJTransitionEngine {
  currentAudio: HTMLAudioElement | null;
  nextAudio: HTMLAudioElement | null;
  isTransitioning: boolean;
  transitionSettings: TransitionSettings;
}

export class DJTransitionController {
  private primaryAudio: HTMLAudioElement;
  private secondaryAudio: HTMLAudioElement;
  private currentChannel: 'primary' | 'secondary' = 'primary';
  private isTransitioning = false;
  private transitionSettings: TransitionSettings = {
    crossfadeDuration: 3.0, // 3 seconds crossfade
    gapDuration: 0.5, // minimal gap
    volumeCurve: 'smooth',
    transitionType: 'crossfade'
  };

  private listeners: Set<(event: TransitionEvent) => void> = new Set();

  constructor() {
    this.primaryAudio = new Audio();
    this.secondaryAudio = new Audio();
    this.setupAudioElements();
  }

  private setupAudioElements() {
    [this.primaryAudio, this.secondaryAudio].forEach(audio => {
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
      audio.volume = 0;
    });
  }

  subscribe(listener: (event: TransitionEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: TransitionEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  getCurrentAudio(): HTMLAudioElement {
    return this.currentChannel === 'primary' ? this.primaryAudio : this.secondaryAudio;
  }

  getInactiveAudio(): HTMLAudioElement {
    return this.currentChannel === 'primary' ? this.secondaryAudio : this.primaryAudio;
  }

  async loadTrack(track: Track, preload = false): Promise<void> {
    if (!track.previewUrl) throw new Error('No preview URL available');

    const targetAudio = preload ? this.getInactiveAudio() : this.getCurrentAudio();
    
    return new Promise((resolve, reject) => {
      const onLoad = () => {
        targetAudio.removeEventListener('loadeddata', onLoad);
        targetAudio.removeEventListener('error', onError);
        this.emit({ type: 'trackLoaded', track, preloaded: preload });
        resolve();
      };

      const onError = () => {
        targetAudio.removeEventListener('loadeddata', onLoad);
        targetAudio.removeEventListener('error', onError);
        reject(new Error(`Failed to load: ${track.trackName}`));
      };

      targetAudio.addEventListener('loadeddata', onLoad);
      targetAudio.addEventListener('error', onError);
      
      targetAudio.src = track.previewUrl!;
      targetAudio.load();
    });
  }

  async playTrack(track: Track, volume = 0.7): Promise<void> {
    if (this.isTransitioning) {
      console.warn('Transition already in progress');
      return;
    }

    try {
      await this.loadTrack(track, false);
      const currentAudio = this.getCurrentAudio();
      currentAudio.volume = volume;
      await currentAudio.play();
      this.emit({ type: 'trackStarted', track });
    } catch (error) {
      this.emit({ type: 'error', error: error as Error, track });
      throw error;
    }
  }

  async transitionToTrack(nextTrack: Track, volume = 0.7): Promise<void> {
    if (this.isTransitioning) {
      console.warn('Transition already in progress');
      return;
    }

    this.isTransitioning = true;
    this.emit({ type: 'transitionStarted', track: nextTrack });

    try {
      const currentAudio = this.getCurrentAudio();
      const nextAudio = this.getInactiveAudio();

      // Load the next track
      await this.loadTrack(nextTrack, true);

      // Start crossfade transition
      await this.performCrossfade(currentAudio, nextAudio, volume);

      // Switch active channel
      this.currentChannel = this.currentChannel === 'primary' ? 'secondary' : 'primary';
      
      this.emit({ type: 'transitionCompleted', track: nextTrack });
    } catch (error) {
      this.emit({ type: 'error', error: error as Error, track: nextTrack });
      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  private async performCrossfade(
    outgoingAudio: HTMLAudioElement, 
    incomingAudio: HTMLAudioElement, 
    targetVolume: number
  ): Promise<void> {
    const { crossfadeDuration, volumeCurve } = this.transitionSettings;
    const steps = 60; // 60 steps for smooth transition
    const stepDuration = (crossfadeDuration * 1000) / steps;

    // Start the incoming track at 0 volume
    incomingAudio.volume = 0;
    await incomingAudio.play();

    return new Promise((resolve) => {
      let step = 0;
      
      const crossfadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        // Calculate volume curves for smooth transition
        const outgoingVolume = this.calculateVolumeCurve(1 - progress, volumeCurve) * targetVolume;
        const incomingVolume = this.calculateVolumeCurve(progress, volumeCurve) * targetVolume;

        outgoingAudio.volume = Math.max(0, outgoingVolume);
        incomingAudio.volume = Math.min(targetVolume, incomingVolume);

        if (step >= steps) {
          clearInterval(crossfadeInterval);
          // Ensure final volumes
          outgoingAudio.volume = 0;
          incomingAudio.volume = targetVolume;
          outgoingAudio.pause();
          outgoingAudio.currentTime = 0;
          resolve();
        }
      }, stepDuration);
    });
  }

  private calculateVolumeCurve(progress: number, curve: 'linear' | 'exponential' | 'smooth'): number {
    switch (curve) {
      case 'linear':
        return progress;
      case 'exponential':
        return Math.pow(progress, 2);
      case 'smooth':
        // Smooth S-curve for natural feeling transitions
        return progress * progress * (3 - 2 * progress);
      default:
        return progress;
    }
  }

  // Smart transition timing - starts crossfade before current track ends
  async scheduleTransition(nextTrack: Track, currentAudio: HTMLAudioElement, volume = 0.7): Promise<void> {
    if (!currentAudio.duration) return;

    const { crossfadeDuration } = this.transitionSettings;
    const timeToEnd = currentAudio.duration - currentAudio.currentTime;
    
    // If track is close to ending, start transition
    if (timeToEnd <= crossfadeDuration + 1) {
      await this.transitionToTrack(nextTrack, volume);
    } else {
      // Schedule transition to start before track ends
      const delay = (timeToEnd - crossfadeDuration) * 1000;
      setTimeout(() => {
        this.transitionToTrack(nextTrack, volume).catch(console.error);
      }, delay);
    }
  }

  pause(): void {
    this.getCurrentAudio().pause();
    this.emit({ type: 'paused' });
  }

  resume(): void {
    this.getCurrentAudio().play().catch(console.error);
    this.emit({ type: 'resumed' });
  }

  stop(): void {
    [this.primaryAudio, this.secondaryAudio].forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    });
    this.isTransitioning = false;
    this.emit({ type: 'stopped' });
  }

  setVolume(volume: number): void {
    const currentAudio = this.getCurrentAudio();
    if (!this.isTransitioning) {
      currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  updateTransitionSettings(settings: Partial<TransitionSettings>): void {
    this.transitionSettings = { ...this.transitionSettings, ...settings };
    this.emit({ type: 'settingsUpdated', settings: this.transitionSettings });
  }

  getTransitionSettings(): TransitionSettings {
    return { ...this.transitionSettings };
  }

  getCurrentTime(): number {
    return this.getCurrentAudio().currentTime;
  }

  getDuration(): number {
    return this.getCurrentAudio().duration || 0;
  }

  setCurrentTime(time: number): void {
    if (!this.isTransitioning) {
      this.getCurrentAudio().currentTime = time;
    }
  }

  isPlaying(): boolean {
    return !this.getCurrentAudio().paused;
  }

  getIsTransitioning(): boolean {
    return this.isTransitioning;
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

export type TransitionEvent = 
  | { type: 'trackLoaded'; track: Track; preloaded: boolean }
  | { type: 'trackStarted'; track: Track }
  | { type: 'transitionStarted'; track: Track }
  | { type: 'transitionCompleted'; track: Track }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'stopped' }
  | { type: 'error'; error: Error; track?: Track }
  | { type: 'settingsUpdated'; settings: TransitionSettings };