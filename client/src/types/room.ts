export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';
export type PlayState = 'playing' | 'paused';

export interface Participant {
  id: string;
  userId: string;
  username: string;
  role: Role;
  joinedAt: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostUserId: string;
  videoId: string;
  playState: PlayState;
  currentTime: number;
  participants: Participant[];
}

export interface RoomMutationResponse {
  room: Room;
  userId: string;
  role: Role;
}

export interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  sentAt: string;
}

export interface ApiErrorBody {
  error?: { code?: string; message?: string } | string;
}
