import { Router } from 'express';
import {
  createRoomController,
  deleteRoomController,
  getRoomController,
  joinRoomController,
} from '../controllers/roomController.js';

export const roomRoutes = Router();
roomRoutes.post('/', createRoomController);
roomRoutes.post('/:code/join', joinRoomController);
roomRoutes.get('/:code', getRoomController);
roomRoutes.delete('/:code', deleteRoomController);
