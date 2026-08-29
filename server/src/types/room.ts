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
  id: string;
  code: string;
  name: string;
  hostUserId: string;
  videoId: string;
  playState: PlayState;
  currentTime: number;
  participants: ParticipantDto[];
}

export interface RoomMutationResponse {
  room: RoomDto;
  userId: string;
  role: Role;
}

export type CreateRoomResponse = RoomMutationResponse;
export type JoinRoomResponse = RoomMutationResponse;
