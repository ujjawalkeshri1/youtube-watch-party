import { randomBytes } from 'node:crypto';

export function createRoomCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}
