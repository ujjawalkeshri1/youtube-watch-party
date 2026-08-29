import { Prisma, type Participant, type PlayState } from '@prisma/client';
import { prisma } from '../config/db.js';
import { createRoomCode } from '../utils/roomCode.js';
import type { ParticipantDto, RoomDto, RoomMutationResponse } from '../types/room.js';

const roomInclude = { participants: { orderBy: { joinedAt: 'asc' as const } } } satisfies Prisma.RoomInclude;
export type RoomWithParticipants = Prisma.RoomGetPayload<{ include: typeof roomInclude }>;

export async function getRoom(code: string): Promise<RoomWithParticipants | null> {
  return prisma.room.findUnique({ where: { code: code.toUpperCase() }, include: roomInclude });
}

export async function findParticipantBySocket(socketId: string) {
  return prisma.participant.findUnique({ where: { socketId }, include: { room: true } });
}

export function toParticipantDto(participant: Participant): ParticipantDto {
  return {
    id: participant.id,
    userId: participant.userId,
    username: participant.username,
    role: participant.role,
    joinedAt: participant.joinedAt.toISOString(),
  };
}

export function effectiveCurrentTime(room: {
  playState: PlayState;
  currentTime: number;
  playbackUpdatedAt: Date;
}): number {
  if (room.playState !== 'playing') return room.currentTime;
  const elapsed = (Date.now() - room.playbackUpdatedAt.getTime()) / 1000;
  return Math.max(0, room.currentTime + elapsed);
}

export function toRoomDto(room: RoomWithParticipants): RoomDto {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    hostUserId: room.hostUserId,
    videoId: room.videoId,
    playState: room.playState,
    currentTime: effectiveCurrentTime(room),
    participants: room.participants.map(toParticipantDto),
  };
}

export async function createRoom(input: {
  username: string;
  userId: string;
  name: string;
  videoId: string;
}): Promise<RoomMutationResponse> {
  let code = createRoomCode();
  while (await prisma.room.findUnique({ where: { code } })) {
    code = createRoomCode();
  }

  const room = await prisma.room.create({
    data: {
      code,
      name: input.name,
      hostUserId: input.userId,
      videoId: input.videoId,
      playState: 'paused',
      currentTime: 0,
      playbackUpdatedAt: new Date(),
      participants: {
        create: { userId: input.userId, username: input.username, role: 'HOST' },
      },
    },
    include: roomInclude,
  });

  return { room: toRoomDto(room), userId: input.userId, role: 'HOST' };
}

export async function joinRoom(input: {
  code: string;
  username: string;
  userId: string;
}): Promise<{ status: 'NOT_FOUND' } | { status: 'OK'; response: RoomMutationResponse }> {
  const room = await getRoom(input.code);
  if (!room) return { status: 'NOT_FOUND' };

  const existing = room.participants.find((participant) => participant.userId === input.userId);
  const participant = existing
    ? await prisma.participant.update({
        where: { id: existing.id },
        data: { username: input.username },
      })
    : await prisma.participant.create({
        data: {
          userId: input.userId,
          roomId: room.id,
          username: input.username,
          role: 'PARTICIPANT',
        },
      });

  const updated = await getRoom(room.code);
  if (!updated) return { status: 'NOT_FOUND' };

  return {
    status: 'OK',
    response: {
      room: toRoomDto(updated),
      userId: input.userId,
      role: participant.role,
    },
  };
}

export async function updatePlayback(
  roomId: string,
  data: { videoId?: string; playState?: PlayState; currentTime?: number }
) {
  return prisma.room.update({
    where: { id: roomId },
    data: {
      ...data,
      playbackUpdatedAt: new Date(),
    },
    include: roomInclude,
  });
}

export async function deleteRoom(code: string, userId: string): Promise<'NOT_FOUND' | 'FORBIDDEN' | 'DELETED'> {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, hostUserId: true },
  });
  if (!room) return 'NOT_FOUND';
  if (room.hostUserId !== userId) return 'FORBIDDEN';
  await prisma.room.delete({ where: { id: room.id } });
  return 'DELETED';
}

export async function deleteRoom(code: string, userId: string): Promise<'NOT_FOUND' | 'FORBIDDEN' | 'DELETED'> {