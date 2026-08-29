import { randomUUID } from 'node:crypto';
import { Prisma, type Participant } from '@prisma/client';
import { prisma } from '../config/db.js';
import { createRoomCode } from '../utils/roomCode.js';
import type { CreateRoomResponse, ParticipantDto, RoomDto } from '../types/room.js';

const roomInclude = { participants: { orderBy: { joinedAt: 'asc' as const } } } satisfies Prisma.RoomInclude;
export type RoomWithParticipants = Prisma.RoomGetPayload<{ include: typeof roomInclude }>;

export async function getRoom(code: string): Promise<RoomWithParticipants | null> { return prisma.room.findUnique({ where: { code: code.toUpperCase() }, include: roomInclude }); }
export async function findParticipantBySocket(socketId: string) { return prisma.participant.findUnique({ where: { socketId }, include: { room: true } }); }
export function toParticipantDto(participant: Participant): ParticipantDto { return { id: participant.id, userId: participant.userId, username: participant.username, role: participant.role, joinedAt: participant.joinedAt.toISOString() }; }
export function toRoomDto(room: RoomWithParticipants): RoomDto { return { code: room.code, hostUserId: room.hostUserId, videoId: room.videoId, playState: room.playState, currentTime: room.currentTime, participants: room.participants.map(toParticipantDto) }; }
export async function createRoom(username: string): Promise<{ room: RoomWithParticipants; response: CreateRoomResponse }> { const userId = randomUUID(); let code = createRoomCode(); while (await prisma.room.findUnique({ where: { code } })) code = createRoomCode(); const room = await prisma.room.create({ data: { code, hostUserId: userId, participants: { create: { userId, username, role: 'HOST' } } }, include: roomInclude }); return { room, response: { roomId: room.id, code: room.code, userId, role: 'HOST' } }; }
export async function joinRoom(code: string, username: string, socketId: string) { const room = await getRoom(code); if (!room) return null; const participant = await prisma.participant.create({ data: { userId: randomUUID(), roomId: room.id, username, socketId } }); return { room: await getRoom(room.code), participant }; }
export async function updatePlayback(roomId: string, data: Prisma.RoomUpdateInput) { return prisma.room.update({ where: { id: roomId }, data, include: roomInclude }); }
export async function deleteRoom(code: string, userId: string): Promise<'NOT_FOUND' | 'FORBIDDEN' | 'DELETED'> { const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() }, select: { id: true, hostUserId: true } }); if (!room) return 'NOT_FOUND'; if (room.hostUserId !== userId) return 'FORBIDDEN'; await prisma.room.delete({ where: { id: room.id } }); return 'DELETED'; }
