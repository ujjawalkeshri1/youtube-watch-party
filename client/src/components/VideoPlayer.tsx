import { useEffect, useRef, useState } from 'react';
import { loadYouTubeAPI, YT_PLAYER_STATE, type YouTubePlayerAPI } from '../lib/youtube';

interface VideoPlayerProps {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate?: (time: number) => void;
  onStateChange?: (state: 'playing' | 'paused' | 'ended') => void;
  onError?: (error: string) => void;
  canControl: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

export function VideoPlayer({
  videoId,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onStateChange,
  onError,
  canControl,
  onPlay,
  onPause,
  onSeek,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const localStateRef = useRef<{ isPlaying: boolean; isSeeking: boolean }>({
    isPlaying: false,
    isSeeking: false,
  });

  // Initialize YouTube player
  useEffect(() => {
    const initPlayer = async () => {
      try {
        setLoading(true);
        await loadYouTubeAPI();

        if (!containerRef.current) return;

        const YT = (window as any).YT;
        playerRef.current = new YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId,
          playerVars: {
            autoplay: 0,
            controls: canControl ? 1 : 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              setPlayerReady(true);
              setLoading(false);
            },
            onStateChange: (event: any) => {
              const state = event.data;
              if (state === YT_PLAYER_STATE.PLAYING) {
                localStateRef.current.isPlaying = true;
                onStateChange?.('playing');
              } else if (state === YT_PLAYER_STATE.PAUSED) {
                localStateRef.current.isPlaying = false;
                onStateChange?.('paused');
              } else if (state === YT_PLAYER_STATE.ENDED) {
                onStateChange?.('ended');
              }
            },
            onError: (event: any) => {
              const errorMsg = `YouTube error: ${event.data}`;
              setError(errorMsg);
              onError?.(errorMsg);
            },
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load player';
        setError(msg);
        onError?.(msg);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy?.();
      }
    };
  }, [canControl, onError]);

  // Handle video change
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;

    const currentVideoId = playerRef.current.getVideoData?.()?.video_id;
    if (currentVideoId !== videoId) {
      playerRef.current.cueVideoById(videoId);
    }
  }, [videoId, playerReady]);

  // Handle play/pause sync
  useEffect(() => {
    if (!playerReady || !playerRef.current || localStateRef.current.isSeeking) return;

    const state = playerRef.current.getPlayerState?.();
    const isPlayerPlaying = state === YT_PLAYER_STATE.PLAYING;

    if (isPlaying && !isPlayerPlaying) {
      playerRef.current.playVideo?.();
    } else if (!isPlaying && isPlayerPlaying) {
      playerRef.current.pauseVideo?.();
    }
  }, [isPlaying, playerReady]);

  // Handle currentTime sync
  useEffect(() => {
    if (!playerReady || !playerRef.current || localStateRef.current.isSeeking) return;

    const playerTime = playerRef.current.getCurrentTime?.() || 0;
    const diff = Math.abs(playerTime - currentTime);

    // Only seek if difference is significant (>2 seconds)
    if (diff > 2) {
      localStateRef.current.isSeeking = true;
      playerRef.current.seekTo?.(currentTime, true);
      setTimeout(() => {
        localStateRef.current.isSeeking = false;
      }, 500);
    }
  }, [currentTime, playerReady]);

  // Track time updates
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;

    const interval = setInterval(() => {
      if (playerRef.current && !localStateRef.current.isSeeking) {
        const time = playerRef.current.getCurrentTime?.() || 0;
        onTimeUpdate?.(time);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [playerReady, onTimeUpdate]);

  return (
    <div className="video-container">
      {error && <div className="video-error">{error}</div>}
      {loading && (
        <div className="video-loading">
          <div className="spinner" />
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: loading ? 'none' : 'block',
        }}
      />
    </div>
  );
}
