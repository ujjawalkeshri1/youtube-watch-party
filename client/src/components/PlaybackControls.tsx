import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  canControl: boolean;
}

export function PlaybackControls({ isPlaying, currentTime, duration, onPlay, onPause, onSeek, canControl }: PlaybackControlsProps) {
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playback-controls">
      <div className="progress-bar-container">
        <input
          type="range"
          min="0"
          max={duration > 0 ? duration : 0}
          step="0.1"
          value={Math.min(currentTime || 0, duration || 0)}
          onChange={(event) => onSeek?.(parseFloat(event.target.value))}
          disabled={!canControl || duration <= 0}
          className="progress-bar"
          aria-label="Playback position"
        />
      </div>

      <div className="time-display">
        <span>{formatTime(currentTime)}</span>
        <span className="divider">/</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="controls-row">
        <button type="button" onClick={() => onSeek?.(Math.max(0, currentTime - 10))} disabled={!canControl} title="Back 10 seconds" className="control-btn">
          <SkipBack size={20} />
        </button>

        {isPlaying ? (
          <button type="button" onClick={onPause} disabled={!canControl} title="Pause" className="control-btn play-btn">
            <Pause size={24} fill="currentColor" />
          </button>
        ) : (
          <button type="button" onClick={onPlay} disabled={!canControl} title="Play" className="control-btn play-btn">
            <Play size={24} fill="currentColor" />
          </button>
        )}

        <button type="button" onClick={() => onSeek?.(duration > 0 ? Math.min(duration, currentTime + 10) : currentTime + 10)} disabled={!canControl} title="Forward 10 seconds" className="control-btn">
          <SkipForward size={20} />
        </button>
      </div>
    </div>
  );
}
