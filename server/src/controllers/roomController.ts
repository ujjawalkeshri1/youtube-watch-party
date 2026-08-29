import type { Request, Response } from 'express';
import { z } from 'zod';
import { createRoom, deleteRoom, getRoom, joinRoom, toRoomDto } from '../services/roomService.js';
import { parseYouTubeVideoId } from '../utils/youtube.js';

const usernameSchema = z.string().trim().min(1).max(32);
const userIdSchema = z.string().uuid();

const createBodySchema = z.object({
  username: usernameSchema,
  userId: userIdSchema,
  name: z.string().trim().min(1).max(80),
  videoUrl: z.string().trim().min(1),
});

const joinBodySchema = z.object({
  username: usernameSchema,
  userId: userIdSchema,
});

function sendError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

export async function createRoomController(req: Request, res: Response) {
  const input = createBodySchema.safeParse(req.body);
  if (!input.success) {
    return sendError(res, 400, 'INVALID_INPUT', 'A display name, party name, and YouTube URL are required.');
  }

  const videoId = parseYouTubeVideoId(input.data.videoUrl);
  if (!videoId) {
    return sendError(res, 400, 'INVALID_VIDEO', 'Invalid YouTube URL.');
  }

  const created = await createRoom({
    username: input.data.username,
    userId: input.data.userId,
    name: input.data.name,
    videoId,
  });
  return res.status(201).json(created);
}

export async function joinRoomController(req: Request, res: Response) {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const input = joinBodySchema.safeParse(req.body);
  if (!input.success) {
    return sendError(res, 400, 'INVALID_INPUT', 'A display name and valid user ID are required.');
  }

  const result = await joinRoom({
    code: code ?? '',
    username: input.data.username,
    userId: input.data.userId,
  });
  if (result.status === 'NOT_FOUND') {
    return sendError(res, 404, 'NOT_FOUND', 'Room not found.');
  }
  return res.json(result.response);
}

export async function getRoomController(req: Request, res: Response) {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const room = await getRoom(code ?? '');
  if (!room) return sendError(res, 404, 'NOT_FOUND', 'Room not found.');
  return res.json(toRoomDto(room));
}

export async function deleteRoomController(req: Request, res: Response) {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const userId = userIdSchema.safeParse(req.header('x-user-id'));
  if (!userId.success) {
    return sendError(res, 401, 'UNAUTHORIZED', 'A valid x-user-id header is required.');
  }
  const result = await deleteRoom(code ?? '', userId.data);
  if (result === 'NOT_FOUND') return sendError(res, 404, 'NOT_FOUND', 'Room not found.');
  if (result === 'FORBIDDEN') return sendError(res, 403, 'FORBIDDEN', 'Only the host can delete this room.');
  return res.status(204).send();
}
