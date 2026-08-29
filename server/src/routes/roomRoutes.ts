import { Router } from 'express';
import { createRoomController, deleteRoomController, getRoomController } from '../controllers/roomController.js';

export const roomRoutes = Router();
roomRoutes.post('/', createRoomController);
roomRoutes.get('/:code', getRoomController);
roomRoutes.delete('/:code', deleteRoomController);
