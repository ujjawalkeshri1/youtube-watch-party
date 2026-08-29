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

export function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      (window as any).onYouTubeIframeAPIReady = () => {
        resolve();
      };
    };

    script.onerror = () => reject(new Error('Failed to load YouTube API'));
    document.head.appendChild(script);
  });
}
