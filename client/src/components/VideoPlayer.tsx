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
  const syncAnchorRef = useRef({ time: 0, at: 0 });

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
              const duration = playerRef.current.getDuration?.() || 0;
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
    const timer = window.setTimeout(() => { applyingRemoteRef.current = false; }, 700);
    return () => window.clearTimeout(timer);
  }, [videoId, playerReady]);

  // Every authoritative room timestamp becomes a new synchronization anchor.
  // We do not seek on every timestamp update while playing; the local player
  // is allowed to advance naturally between corrections.
  useEffect(() => {
    syncAnchorRef.current = { time: currentTime, at: performance.now() };
  }, [currentTime]);

  // The server's currentTime is the position at the moment of the last
  // playback command. While playing, time naturally advances on the client;
  // it must NOT be treated as a fixed timestamp or the player will jump back
  // every few seconds. We anchor the server time once and only correct drift.
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const player = playerRef.current;
    applyingRemoteRef.current = true;
    syncAnchorRef.current = { time: currentTime, at: performance.now() };

    if (isPlaying) player.playVideo?.();
    else player.pauseVideo?.();

    const playerTime = player.getCurrentTime?.() || 0;
    if (!isPlaying && Math.abs(playerTime - currentTime) > 0.75) {
      player.seekTo?.(Math.max(0, currentTime), true);
    } else if (isPlaying && Math.abs(playerTime - currentTime) > 1.5) {
      player.seekTo?.(Math.max(0, currentTime), true);
    }

    const timer = window.setTimeout(() => { applyingRemoteRef.current = false; }, 350);
    return () => window.clearTimeout(timer);
  }, [isPlaying, playerReady, videoId]);

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

  // Participants follow a moving timeline. This avoids the old bug where a
  // participant was repeatedly seeking to the original play timestamp.
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
      {canControl && <button type="button" className="custom-fullscreen-btn" onClick={handleFullscreen} title="Fullscreen" aria-label="Fullscreen"><Maximize2 size={17} /></button>}
    </div>
  );
}
