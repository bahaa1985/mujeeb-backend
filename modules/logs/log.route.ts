import { Router } from 'express';
import * as logController from './log.controller';
import { authenticateToken } from '../../middleware/authenticateToken';

export const LOGS_ROUTER = Router();
LOGS_ROUTER.use(authenticateToken);

// GET /api/logs
LOGS_ROUTER.get('/', logController.getLogs);
