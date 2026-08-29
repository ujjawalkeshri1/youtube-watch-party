import type { Request, Response } from 'express';
import { z } from 'zod';
import { createRoom, deleteRoom, getRoom, toRoomDto } from '../services/roomService.js';

const usernameSchema = z.object({ username: z.string().trim().min(1).max(32) });
const userIdSchema = z.string().uuid();
export async function createRoomController(req: Request, res: Response) { const input = usernameSchema.safeParse(req.body); if (!input.success) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'A username between 1 and 32 characters is required.' } }); const created = await createRoom(input.data.username); return res.status(201).json(created.response); }
export async function getRoomController(req: Request, res: Response) { const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code; const room = await getRoom(code); if (!room) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Room not found.' } }); return res.json(toRoomDto(room)); }
export async function deleteRoomController(req: Request, res: Response) { const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code; const userId = userIdSchema.safeParse(req.header('x-user-id')); if (!userId.success) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid x-user-id header is required.' } }); const result = await deleteRoom(code, userId.data); if (result === 'NOT_FOUND') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Room not found.' } }); if (result === 'FORBIDDEN') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only the host can delete this room.' } }); return res.status(204).send(); }
