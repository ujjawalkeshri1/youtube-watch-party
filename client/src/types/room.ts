export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';
export type PlayState = 'playing' | 'paused';
export interface Participant { id: string; username: string; role: Role; }
export interface Room { code: string; hostId: string; videoId: string; playState: PlayState; currentTime: number; participants: Participant[]; }
export interface ChatMessage { userId: string; username: string; message: string; sentAt: string; }
