const USER_KEY = 'watch-party-user';

export interface Identity {
  userId: string;
  username: string;
}

export function getIdentity(): Identity | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Identity>;
    if (typeof parsed.userId === 'string' && parsed.userId.length > 0) {
      return { userId: parsed.userId, username: typeof parsed.username === 'string' ? parsed.username : '' };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveIdentity(identity: Identity) {
  localStorage.setItem(USER_KEY, JSON.stringify(identity));
}

export function upsertIdentity(username: string): Identity {
  const existing = getIdentity();
  const identity: Identity = {
    userId: existing?.userId ?? crypto.randomUUID(),
    username: username.trim(),
  };
  saveIdentity(identity);
  return identity;
}

export function createIdentity(username: string): Identity {
  return upsertIdentity(username);
}
