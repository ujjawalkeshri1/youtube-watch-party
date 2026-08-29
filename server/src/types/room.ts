export type Role = 'HOST' | 'MODERATOR' | 'PARTICIPANT';
export type PlayState = 'playing' | 'paused';

export interface ParticipantDto {
  id: string;
  userId: string;
  username: string;
  role: Role;
  joinedAt: string;
}

export interface RoomDto {
  code: string;
  hostUserId: string;
  videoId: string;
  playState: PlayState;
  currentTime: number;
  participants: ParticipantDto[];
}

export interface CreateRoomResponse {
  roomId: string;
  code: string;
  userId: string;
  role: 'HOST';
}
