import { Maximize2 } from 'lucide-react';
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

function youtubeErrorMessage(code: number) {
  switch (code) {
    case 2: return 'YouTube rejected the video ID. Please choose another video.';
    case 5: return 'YouTube could not play this video in the embedded player.';
    case 100: return 'This YouTube video is unavailable, private, or has been removed.';
    case 101:
    case 150: return 'This video does not allow playback on external websites. Please choose another embeddable video.';
    case 153: return 'YouTube could not verify the embedding page. Check the browser connection/referrer settings and reload.';
    default: return `YouTube player error (${code}).`;
  }
}

export function VideoPlayer({ videoId, isPlaying, currentTime, canControl, onPlay, onPause, onSeek, onTimeUpdate, onDuration, onError }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const applyingRemoteRef = useRef(false);
  const canControlRef = useRef(canControl);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef = useRef(onSeek);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onDurationRef = useRef(onDuration);
  const onErrorRef = useRef(onError);
  const lastEmittedSeekRef = useRef(0);

  canControlRef.current = canControl;
  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;
  onSeekRef.current = onSeek;
  onTimeUpdateRef.current = onTimeUpdate;
  onDurationRef.current = onDuration;
  onErrorRef.current = onError;

  const handleFullscreen = async () => {
    const element = containerRef.current?.parentElement;
    if (!element) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch {
      onErrorRef.current?.('Fullscreen is not available in this browser.');
    }
  };

  useEffect(() => {
    let destroyed = false;
    const initPlayer = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadYouTubeAPI();
        if (destroyed || !containerRef.current) return;
        const YT = (window as unknown as { YT: { Player: new (el: HTMLElement, opts: object) => YouTubePlayerAPI } }).YT;
        playerRef.current = new YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId,
          playerVars: {
            autoplay: 0,
            // The host is the ONLY person who receives YouTube playback controls.
            // Participants get a completely non-interactive player surface.
            controls: canControlRef.current ? 1 : 0,
            disablekb: canControlRef.current ? 0 : 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (destroyed || !playerRef.current) return;
              setPlayerReady(true);
              setLoading(false);
              setError(null);
              playerRef.current.cueVideoById(videoId);
              const duration = playerRef.current.getDuration?.() || 0;
              if (duration) onDurationRef.current?.(duration);
            },
            onStateChange: (event: { data: number }) => {
              // ONLY a host-originated native YouTube action can become a
              // playback command. Participant state changes are never emitted.
              if (destroyed || applyingRemoteRef.current || !canControlRef.current) return;
              const player = playerRef.current;
              if (!player) return;
              const time = player.getCurrentTime?.() || 0;
              const duration = player.getDuration?.() || 0;
              if (duration) onDurationRef.current?.(duration);
              if (event.data === YT_PLAYER_STATE.PLAYING) onPlayRef.current?.(time);
              else if (event.data === YT_PLAYER_STATE.PAUSED) onPauseRef.current?.(time);
            },
            onError: (event: { data: number }) => {
              const message = youtubeErrorMessage(event.data);
              setLoading(false);
              setError(message);
              onErrorRef.current?.(message);
            },
            onAutoplayBlocked: () => {
              setError('Browser blocked automatic playback. Press Play on the host screen to continue.');
              setLoading(false);
            },
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load YouTube player';
        setLoading(false);
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
  }, []);

  useEffect(() => {
    if (!playerReady || !playerRef.current || !videoId) return;
    const currentVideoId = playerRef.current.getVideoData?.()?.video_id;
    if (currentVideoId === videoId) return;
    applyingRemoteRef.current = true;
    setError(null);
    playerRef.current.cueVideoById(videoId);
    const timer = window.setTimeout(() => { applyingRemoteRef.current = false; }, 500);
    return () => window.clearTimeout(timer);
  }, [videoId, playerReady]);

  // The server room state is authoritative. This effect is deliberately
  // unconditional for participants: when the room says PAUSED we call
  // pauseVideo() even if YouTube reports BUFFERING/CUED instead of PLAYING.
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const player = playerRef.current;
    applyingRemoteRef.current = true;

    const enforceRoomState = () => {
      if (!playerRef.current) return;
      const state = playerRef.current.getPlayerState?.();
      if (isPlaying) {
        if (state !== YT_PLAYER_STATE.PLAYING) playerRef.current.playVideo?.();
      } else {
        playerRef.current.pauseVideo?.();
      }

      const playerTime = playerRef.current.getCurrentTime?.() || 0;
      if (Math.abs(playerTime - currentTime) > 1.25) {
        playerRef.current.seekTo?.(Math.max(0, currentTime), true);
      }
    };

    enforceRoomState();
    const interval = window.setInterval(enforceRoomState, canControlRef.current ? 1000 : 250);
    const timer = window.setTimeout(() => { applyingRemoteRef.current = false; }, 300);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [isPlaying, currentTime, playerReady, videoId]);

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
    <div className={`video-container ${canControl ? 'video-host' : 'video-participant'}`}>
      {loading && <div className="video-loading"><div className="spinner" /><span>Loading YouTube video…</span></div>}
      {error && <div className="video-error" role="alert"><strong>Video unavailable</strong><span>{error}</span><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noreferrer">Open on YouTube</a></div>}
      <div ref={containerRef} className="youtube-frame" style={{ width: '100%', height: '100%', display: 'block' }} />
      {canControl && <button type="button" className="custom-fullscreen-btn" onClick={handleFullscreen} title="Fullscreen" aria-label="Fullscreen"><Maximize2 size={17} /></button>}
    </div>
  );
}
