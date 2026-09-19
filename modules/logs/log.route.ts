import { Router } from 'express';
import * as logController from './log.controller';

export const LOGS_ROUTER = Router();

// GET /api/logs
LOGS_ROUTER.get('/', logController.getLogs);
