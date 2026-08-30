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
  const syncAnchorRef = useRef({ time: 0, at: 0 });
  const observedRef = useRef({ time: 0, at: 0 });
  const lastEmittedSeekRef = useRef(0);

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
            controls: canControlRef.current ? 1 : 0,
            disablekb: canControlRef.current ? 0 : 1,
            fs: 0,
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

              const iframe = playerRef.current.getIframe?.();
              iframe?.removeAttribute('allowfullscreen');
              iframe?.setAttribute('donotallowfullscreen', '');

              const duration = playerRef.current.getDuration?.() || 0;
              const time = playerRef.current.getCurrentTime?.() || 0;
              observedRef.current = { time, at: performance.now() };
              if (duration) onDurationRef.current?.(duration);
            },
            onStateChange: (event: { data: number }) => {
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
    syncAnchorRef.current = { time: currentTime, at: performance.now() };
    observedRef.current = { time: 0, at: performance.now() };
    const timer = window.setTimeout(() => { applyingRemoteRef.current = false; }, 700);
    return () => window.clearTimeout(timer);
  }, [videoId, playerReady, currentTime]);

  useEffect(() => {
    syncAnchorRef.current = { time: currentTime, at: performance.now() };
  }, [currentTime]);

  // Apply every authoritative server playback update, including seeks.
  // currentTime is intentionally part of this dependency list; without it,
  // a host seek changed the database/socket state but did not move the iframe.
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const player = playerRef.current;
    applyingRemoteRef.current = true;
    syncAnchorRef.current = { time: currentTime, at: performance.now() };

    const playerTime = player.getCurrentTime?.() || 0;
    const difference = Math.abs(playerTime - currentTime);

    if (isPlaying) {
      if (player.getPlayerState?.() !== YT_PLAYER_STATE.PLAYING) player.playVideo?.();
      if (difference > 1.0) player.seekTo?.(Math.max(0, currentTime), true);
    } else {
      if (player.getPlayerState?.() === YT_PLAYER_STATE.PLAYING) player.pauseVideo?.();
      if (difference > 0.35) player.seekTo?.(Math.max(0, currentTime), true);
    }

    const now = performance.now();
    observedRef.current = { time: currentTime, at: now };
    const timer = window.setTimeout(() => { applyingRemoteRef.current = false; }, 350);
    return () => window.clearTimeout(timer);
  }, [currentTime, isPlaying, playerReady]);

  // Polling is used because the IFrame API exposes player-state events but does
  // not expose a dedicated seek event. A large discontinuity from the expected
  // clock movement therefore represents a native YouTube seek/skip operation.
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const now = performance.now();
      const time = player.getCurrentTime?.() || 0;
      const duration = player.getDuration?.() || 0;
      const state = player.getPlayerState?.();
      const previous = observedRef.current;
      const elapsed = Math.max(0, (now - previous.at) / 1000);
      const expectedDelta = state === YT_PLAYER_STATE.PLAYING ? elapsed : 0;
      const actualDelta = time - previous.time;

      onTimeUpdateRef.current?.(time);
      if (duration) onDurationRef.current?.(duration);

      const discontinuity = Math.abs(actualDelta - expectedDelta) > 0.75;
      const meaningfulSeek = Math.abs(time - lastEmittedSeekRef.current) > 0.5;
      if (
        canControlRef.current &&
        !applyingRemoteRef.current &&
        state !== YT_PLAYER_STATE.BUFFERING &&
        discontinuity &&
        meaningfulSeek
      ) {
        lastEmittedSeekRef.current = time;
        onSeekRef.current?.(time);
      }

      observedRef.current = { time, at: now };
    }, 200);
    return () => window.clearInterval(interval);
  }, [playerReady]);

  // Participants follow the server's moving playback clock and cannot issue
  // player commands. Their player is also shielded from pointer/keyboard input.
  useEffect(() => {
    if (!playerReady || !playerRef.current || canControl) return;
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const expected = isPlaying
        ? syncAnchorRef.current.time + (performance.now() - syncAnchorRef.current.at) / 1000
        : currentTime;
      const actual = player.getCurrentTime?.() || 0;
      const drift = Math.abs(actual - expected);
      if (isPlaying) {
        if (player.getPlayerState?.() !== YT_PLAYER_STATE.PLAYING) player.playVideo?.();
        if (drift > 2.5) player.seekTo?.(Math.max(0, expected), true);
      } else {
        if (player.getPlayerState?.() === YT_PLAYER_STATE.PLAYING) player.pauseVideo?.();
        if (drift > 0.75) player.seekTo?.(Math.max(0, currentTime), true);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [canControl, currentTime, isPlaying, playerReady, videoId]);

  return (
    <div className={`video-container ${canControl ? 'video-host' : 'video-participant'}`}>
      {loading && <div className="video-loading"><div className="spinner" /><span>Loading YouTube video…</span></div>}
      {error && <div className="video-error" role="alert"><strong>Video unavailable</strong><span>{error}</span><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noreferrer">Open on YouTube</a></div>}
      <div ref={containerRef} className="youtube-frame" style={{ width: '100%', height: '100%', display: 'block' }} />
      <div className="youtube-fullscreen-blocker" aria-hidden="true" />
      {!canControl && <div className="participant-interaction-shield" aria-hidden="true" />}
    </div>
  );
}
