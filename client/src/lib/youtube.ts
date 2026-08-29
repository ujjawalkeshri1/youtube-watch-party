export interface YouTubePlayerAPI {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  destroy(): void;
  getVideoData(): { video_id: string };
}

export enum YT_PLAYER_STATE {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (VIDEO_ID.test(value)) return value;

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();

    if (
      host === 'youtu.be' ||
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const shorts = url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/);
      if (shorts) return shorts[1];

      const embed = url.pathname.match(/^\/(?:embed|live|v|e)\/([A-Za-z0-9_-]{11})/);
      if (embed) return embed[1];

      const fromPath = url.pathname.match(/^\/([A-Za-z0-9_-]{11})$/);
      if (host === 'youtu.be' && fromPath) return fromPath[1];

      const v = url.searchParams.get('v');
      if (v && VIDEO_ID.test(v)) return v;
    }
  } catch {
    return null;
  }

  return null;
}

export function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = window as Window & {
      YT?: { Player?: unknown };
      onYouTubeIframeAPIReady?: () => void;
    };

    if (win.YT?.Player) {
      resolve();
      return;
    }

    const previous = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load YouTube API'));
    document.head.appendChild(script);
  });
}
