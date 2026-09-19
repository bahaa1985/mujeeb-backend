import express from 'express';
import { getCurrentUserController } from './login.controller';
import { authenticateToken } from '../../middleware/authenticateToken';

export const AUTH_LOGGED_ROUTER = express.Router();
AUTH_LOGGED_ROUTER.get('/', authenticateToken, getCurrentUserController);