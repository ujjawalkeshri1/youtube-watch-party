import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { roomRoutes } from './routes/roomRoutes.js';
import { registerRoomSocketHandlers } from './socket/roomHandlers.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: env.CLIENT_URL } });
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/rooms', roomRoutes);
registerRoomSocketHandlers(io);

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (env.NODE_ENV === 'production' && existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

httpServer.listen(env.PORT, '0.0.0.0', () => console.log(`Watch party server listening on port ${env.PORT}`));
