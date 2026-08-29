import { useEffect, useRef, useState } from 'react';
import { loadYouTubeAPI, YT_PLAYER_STATE, type YouTubePlayerAPI } from '../lib/youtube';

interface VideoPlayerProps {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  canControl: boolean;
  onPlay?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  onDuration?: (duration: number) => void;
  onError?: (error: string) => void;
}

export function VideoPlayer({
  videoId,
  isPlaying,
  currentTime,
  canControl,
  onPlay,
  onPause,
  onSeek,
  onTimeUpdate,
  onDuration,
  onError,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const applyingRemoteRef = useRef(false);
  const canControlRef = useRef(canControl);
  const lastEmittedSeekRef = useRef(0);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef = useRef(onSeek);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onDurationRef = useRef(onDuration);
  const onErrorRef = useRef(onError);

  canControlRef.current = canControl;
  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;
  onSeekRef.current = onSeek;
  onTimeUpdateRef.current = onTimeUpdate;
  onDurationRef.current = onDuration;
  onErrorRef.current = onError;

  useEffect(() => {
    let destroyed = false;

    const initPlayer = async () => {
      try {
        setLoading(true);
        await loadYouTubeAPI();
        if (destroyed || !containerRef.current) return;

        const YT = (window as unknown as { YT: { Player: new (el: HTMLElement, opts: object) => YouTubePlayerAPI } }).YT;
        playerRef.current = new YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              if (destroyed) return;
              setPlayerReady(true);
              setLoading(false);
              const duration = playerRef.current?.getDuration?.() || 0;
              onDurationRef.current?.(duration);
            },
            onStateChange: (event: { data: number }) => {
              if (applyingRemoteRef.current) return;
              const player = playerRef.current;
              if (!player || !canControlRef.current) return;
              const time = player.getCurrentTime?.() || 0;
              if (event.data === YT_PLAYER_STATE.PLAYING) {
                onPlayRef.current?.(time);
              } else if (event.data === YT_PLAYER_STATE.PAUSED) {
                onPauseRef.current?.(time);
              }
            },
            onError: (event: { data: number }) => {
              const errorMsg = `YouTube error: ${event.data}`;
              setError(errorMsg);
              onErrorRef.current?.(errorMsg);
            },
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load player';
        setError(msg);
        onErrorRef.current?.(msg);
      }
    };

    void initPlayer();

    return () => {
      destroyed = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      setPlayerReady(false);
    };
    // videoId is applied after ready via cue/load to avoid tearing down the iframe on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const currentVideoId = playerRef.current.getVideoData?.()?.video_id;
    if (currentVideoId !== videoId) {
      applyingRemoteRef.current = true;
      playerRef.current.cueVideoById(videoId);
      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 600);
    }
  }, [videoId, playerReady]);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    applyingRemoteRef.current = true;
    const state = playerRef.current.getPlayerState?.();
    const isPlayerPlaying = state === YT_PLAYER_STATE.PLAYING;
    if (isPlaying && !isPlayerPlaying) {
      playerRef.current.playVideo?.();
    } else if (!isPlaying && isPlayerPlaying) {
      playerRef.current.pauseVideo?.();
    }
    const timer = window.setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 500);
    return () => window.clearTimeout(timer);
  }, [isPlaying, playerReady, videoId]);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const playerTime = playerRef.current.getCurrentTime?.() || 0;
    if (Math.abs(playerTime - currentTime) > 1.25) {
      applyingRemoteRef.current = true;
      playerRef.current.seekTo?.(currentTime, true);
      window.setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 500);
    }
  }, [currentTime, playerReady, videoId]);

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    let previousTime = playerRef.current.getCurrentTime?.() || 0;

    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const time = player.getCurrentTime?.() || 0;
      const duration = player.getDuration?.() || 0;
      onTimeUpdateRef.current?.(time);
      if (duration) onDurationRef.current?.(duration);

      const jumped = Math.abs(time - previousTime) > 2;
      previousTime = time;
      if (!canControlRef.current || applyingRemoteRef.current || !jumped) return;
      if (Math.abs(time - lastEmittedSeekRef.current) > 1) {
        lastEmittedSeekRef.current = time;
        onSeekRef.current?.(time);
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [playerReady]);

  return (
    <div className="video-container" style={{ pointerEvents: canControl ? 'auto' : 'none' }}>
      {error && <div className="video-error">{error}</div>}
      {loading && (
        <div className="video-loading">
          <div className="spinner" />
        </div>
      )}
      <div
        ref={containerRef}
        className="youtube-frame"
        style={{ width: '100%', height: '100%', display: loading ? 'none' : 'block' }}
      />
    </div>
  );
}
