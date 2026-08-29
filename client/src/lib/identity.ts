const USER_KEY = 'watch-party-user';
export interface Identity { userId: string; username: string; }
export function getIdentity(): Identity | null { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; }
export function saveIdentity(identity: Identity) { localStorage.setItem(USER_KEY, JSON.stringify(identity)); }
export function createIdentity(username: string): Identity { const identity = { username: username.trim(), userId: crypto.randomUUID() }; saveIdentity(identity); return identity; }
