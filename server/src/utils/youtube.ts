const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (VIDEO_ID.test(value)) return value;

  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
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

export function isYouTubeVideoId(value: string): boolean {
  return VIDEO_ID.test(value);
}
