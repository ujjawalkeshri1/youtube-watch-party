import { Play, Pause, SkipBack, SkipForward, Volume2, AlertCircle } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  onChangeVideo?: () => void;
  canControl: boolean;
}

export function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  canControl,
}: PlaybackControlsProps) {
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek?.(time);
  };

  return (
    <div className="playback-controls">
      {!canControl && (
        <div className="control-notice">
          <AlertCircle size={14} />
          <span>Only host and moderator can control playback</span>
        </div>
      )}

      <div className="progress-bar-container">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime || 0}
          onChange={handleSeek}
          disabled={!canControl}
          className="progress-bar"
        />
      </div>

      <div className="time-display">
        <span>{formatTime(currentTime)}</span>
        <span className="divider">/</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="controls-row">
        <button
          onClick={() => onSeek?.(Math.max(0, currentTime - 10))}
          disabled={!canControl}
          title="Back 10s"
          className="control-btn"
        >
          <SkipBack size={20} />
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            disabled={!canControl}
            title="Pause"
            className="control-btn play-btn"
          >
            <Pause size={24} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={!canControl}
            title="Play"
            className="control-btn play-btn"
          >
            <Play size={24} fill="currentColor" />
          </button>
        )}

        <button
          onClick={() => onSeek?.(Math.min(duration, currentTime + 10))}
          disabled={!canControl}
          title="Forward 10s"
          className="control-btn"
        >
          <SkipForward size={20} />
        </button>

        <button
          onClick={onChangeVideo}
          disabled={!canControl}
          title="Change video"
          className="control-btn"
        >
          <Volume2 size={20} />
        </button>
      </div>
    </div>
  );
}
