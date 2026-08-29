import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import {
  findParticipantBySocket,
  getRoom,
  toRoomDto,
  updatePlayback,
} from '../services/roomService.js';
import type { Role } from '../types/room.js';

const joinPayload = z.object({
  roomCode: z
    .string()
    .trim()
    .length(8)
    .transform((value) => value.toUpperCase()),
  username: z.string().trim().min(1).max(32),
  userId: z.string().uuid(),
});

const timePayload = z
  .object({
    currentTime: z.number().finite().min(0).optional(),
    time: z.number().finite().min(0).optional(),
  })
  .refine((value) => value.currentTime !== undefined || value.time !== undefined, {
    message: 'A valid playback time is required.',
  })
  .transform((value) => ({ currentTime: value.currentTime ?? value.time ?? 0 }));

const videoPayload = z.object({
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'A valid YouTube video ID is required.'),
});
const messagePayload = z.object({ text: z.string().trim().min(1).max(500) });
const targetPayload = z.object({ participantId: z.string().cuid() });
const rolePayload = targetPayload.extend({ role: z.enum(['MODERATOR', 'PARTICIPANT']) });

const errorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

const roomMessages = new Map<string, Array<{ userId: string; username: string; message: string; sentAt: string }>>();

function sendError(socket: Socket, code: ErrorCode, message: string) {
  socket.emit('error', { code, message });
}

async function currentParticipant(socket: Socket) {
  return findParticipantBySocket(socket.id);
}

async function authorized(
  socket: Socket,
  roles: Role[],
  message = 'You do not have permission to perform this action.'
) {
  const participant = await currentParticipant(socket);
  if (!participant) {
    sendError(socket, errorCodes.FORBIDDEN, 'You are not in this room.');
    return null;
  }
  if (!roles.includes(participant.role)) {
    sendError(socket, errorCodes.FORBIDDEN, message);
    return null;
  }
  return participant;
}

export function registerRoomSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on('join_room', async (payload: unknown) => {
      const input = joinPayload.safeParse(payload);
      if (!input.success) {
        return sendError(socket, errorCodes.INVALID_INPUT, 'Room code, username, and a valid user ID are required.');
      }

      const room = await getRoom(input.data.roomCode);
      if (!room) return sendError(socket, errorCodes.NOT_FOUND, 'Room not found.');

      try {
        const previous = room.participants.find((participant) => participant.userId === input.data.userId);
        if (previous?.socketId && previous.socketId !== socket.id) {
          const oldSocket = io.sockets.sockets.get(previous.socketId);
          oldSocket?.emit('session_replaced', { roomCode: room.code });
          oldSocket?.leave(room.code);
        }

        await prisma.participant.upsert({
          where: { userId_roomId: { userId: input.data.userId, roomId: room.id } },
          update: { username: input.data.username, socketId: socket.id },
          create: {
            userId: input.data.userId,
            roomId: room.id,
            username: input.data.username,
            socketId: socket.id,
          },
        });

        socket.join(room.code);
        const updatedRoom = await getRoom(room.code);
        if (!updatedRoom) return sendError(socket, errorCodes.NOT_FOUND, 'Room no longer exists.');

        const joinedRoomDto = toRoomDto(updatedRoom);
        socket.emit('sync_state', joinedRoomDto);
        socket.emit('chat_history', roomMessages.get(room.code) ?? []);
        socket.to(room.code).emit('user_joined', joinedRoomDto);
      } catch {
        sendError(socket, errorCodes.INTERNAL_ERROR, 'Unable to join the room.');
      }
    });

    socket.on('leave_room', async (_payload, ack?: () => void) => {
      await handleLeave(io, socket, { deleteParticipant: true });
      ack?.();
    });

    socket.on('play', (payload: unknown) => handlePlayback(io, socket, payload, 'playing'));
    socket.on('pause', (payload: unknown) => handlePlayback(io, socket, payload, 'paused'));
    socket.on('seek', (payload: unknown) => handlePlayback(io, socket, payload));

    socket.on('change_video', async (payload: unknown) => {
      const input = videoPayload.safeParse(payload);
      if (!input.success) {
        return sendError(socket, errorCodes.INVALID_INPUT, input.error.issues[0]?.message ?? 'Invalid video ID.');
      }
      const participant = await authorized(
        socket,
        ['HOST', 'MODERATOR'],
        'You are not authorized to control playback.'
      );
      if (!participant) return;
      const room = await updatePlayback(participant.roomId, {
        videoId: input.data.videoId,
        currentTime: 0,
        playState: 'paused',
      });
      io.to(participant.room.code).emit('sync_state', toRoomDto(room));
    });

    socket.on('assign_role', async (payload: unknown) => {
      const input = rolePayload.safeParse(payload);
      if (!input.success) {
        return sendError(socket, errorCodes.INVALID_INPUT, 'A participant ID and valid role are required.');
      }
      const actor = await authorized(socket, ['HOST']);
      if (!actor) return;
      const target = await prisma.participant.findFirst({
        where: { id: input.data.participantId, roomId: actor.roomId },
      });
      if (!target || target.role === 'HOST') {
        return sendError(socket, errorCodes.NOT_FOUND, 'That participant cannot be assigned this role.');
      }
      await prisma.participant.update({ where: { id: target.id }, data: { role: input.data.role } });
      const room = await getRoom(actor.room.code);
      if (room) io.to(actor.room.code).emit('sync_state', toRoomDto(room));
    });

    socket.on('remove_participant', async (payload: unknown) => {
      const input = targetPayload.safeParse(payload);
      if (!input.success) {
        return sendError(socket, errorCodes.INVALID_INPUT, 'A valid participant ID is required.');
      }
      const actor = await authorized(socket, ['HOST']);
      if (!actor) return;
      const target = await prisma.participant.findFirst({
        where: { id: input.data.participantId, roomId: actor.roomId },
      });
      if (!target || target.id === actor.id || target.role === 'HOST') {
        return sendError(socket, errorCodes.FORBIDDEN, 'You cannot remove yourself or the host.');
      }
      await prisma.participant.delete({ where: { id: target.id } });
      const targetSocket = target.socketId ? io.sockets.sockets.get(target.socketId) : undefined;
      targetSocket?.leave(actor.room.code);
      targetSocket?.emit('participant_removed', {
        participantId: target.id,
        userId: target.userId,
      });
      const room = await getRoom(actor.room.code);
      if (room) io.to(actor.room.code).emit('sync_state', toRoomDto(room));
    });

    socket.on('send_message', async (payload: unknown) => {
      const input = messagePayload.safeParse(payload);
      if (!input.success) {
        return sendError(socket, errorCodes.INVALID_INPUT, 'A message between 1 and 500 characters is required.');
      }

      const participant = await authorized(socket, ['HOST', 'MODERATOR', 'PARTICIPANT']);
      if (!participant) return;

      const entry = {
        userId: participant.userId,
        username: participant.username,
        message: input.data.text,
        sentAt: new Date().toISOString(),
      };

      const history = roomMessages.get(participant.room.code) ?? [];
      roomMessages.set(participant.room.code, [...history, entry].slice(-200));
      io.to(participant.room.code).emit('message', entry);
    });

    socket.on('transfer_host', async (payload: unknown) => {
      const input = targetPayload.safeParse(payload);
      if (!input.success) {
        return sendError(socket, errorCodes.INVALID_INPUT, 'A valid participant ID is required.');
      }
      const actor = await authorized(socket, ['HOST']);
      if (!actor) return;
      const target = await prisma.participant.findFirst({
        where: { id: input.data.participantId, roomId: actor.roomId },
      });
      if (!target) return sendError(socket, errorCodes.NOT_FOUND, 'Participant not found in this room.');

      await prisma.$transaction([
        prisma.room.update({ where: { id: actor.roomId }, data: { hostUserId: target.userId } }),
        prisma.participant.update({ where: { id: actor.id }, data: { role: 'MODERATOR' } }),
        prisma.participant.update({ where: { id: target.id }, data: { role: 'HOST' } }),
      ]);
      const room = await getRoom(actor.room.code);
      if (room) io.to(actor.room.code).emit('sync_state', toRoomDto(room));
    });

    socket.on('disconnect', async () => {
      await handleLeave(io, socket, { deleteParticipant: false });
    });
  });
}

async function handleLeave(io: Server, socket: Socket, options: { deleteParticipant: boolean }) {
  const participant = await currentParticipant(socket);
  if (!participant) return;

  if (options.deleteParticipant) {
    await prisma.participant.delete({ where: { id: participant.id } }).catch(() => undefined);
  } else {
    await prisma.participant.updateMany({
      where: { socketId: socket.id },
      data: { socketId: null },
    });
  }

  socket.leave(participant.room.code);
  const room = await getRoom(participant.room.code);
  if (room) io.to(participant.room.code).emit('user_left', toRoomDto(room));
}

async function handlePlayback(
  io: Server,
  socket: Socket,
  payload: unknown,
  playState?: 'playing' | 'paused'
) {
  const input = timePayload.safeParse(payload);
  if (!input.success) {
    return sendError(socket, errorCodes.INVALID_INPUT, 'currentTime must be a non-negative number.');
  }
  const participant = await authorized(
    socket,
    ['HOST', 'MODERATOR'],
    'You are not authorized to control playback.'
  );
  if (!participant) return;
  const room = await updatePlayback(participant.roomId, {
    playState,
    currentTime: input.data.currentTime,
  });
  io.to(participant.room.code).emit('sync_state', toRoomDto(room));
}
