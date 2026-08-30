import { useEffect, useState } from 'react';
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
  const [draftTime, setDraftTime] = useState(currentTime || 0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) setDraftTime(currentTime || 0);
  }, [currentTime, dragging]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const commitSeek = (value: number) => {
    if (!canControl || duration <= 0) return;
    const next = Math.max(0, Math.min(duration, value));
    setDraftTime(next);
    setDragging(false);
    onSeek?.(next);
  };

  const seekRelative = (amount: number) => {
    if (!canControl) return;
    const base = dragging ? draftTime : currentTime;
    commitSeek(base + amount);
  };

  return (
    <div className="playback-controls" aria-label="Host playback controls">
      <div className="progress-bar-container">
        <input
          type="range"
          min="0"
          max={duration > 0 ? duration : 0}
          step="0.1"
          value={Math.min(draftTime || 0, duration || 0)}
          onPointerDown={() => setDragging(true)}
          onChange={(event) => setDraftTime(parseFloat(event.target.value))}
          onPointerUp={(event) => commitSeek(parseFloat((event.currentTarget as HTMLInputElement).value))}
          onKeyUp={(event) => {
            if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
              commitSeek(parseFloat((event.currentTarget as HTMLInputElement).value));
            }
          }}
          disabled={!canControl || duration <= 0}
          className="progress-bar"
          aria-label="Playback position"
        />
      </div>

      <div className="time-display">
        <span>{formatTime(dragging ? draftTime : currentTime)}</span>
        <span className="divider">/</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="controls-row">
        <button type="button" onClick={() => seekRelative(-10)} disabled={!canControl || duration <= 0} title="Back 10 seconds" className="control-btn">
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

        <button type="button" onClick={() => seekRelative(10)} disabled={!canControl || duration <= 0} title="Forward 10 seconds" className="control-btn">
          <SkipForward size={20} />
        </button>
      </div>
    </div>
  );
}
