import express from 'express';
import { userLoginController } from './login.controller';
import bodyParser from 'body-parser';
import { rateLimit } from 'express-rate-limit';

export const AUTH_LOGIN_ROUTER = express.Router();

const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in a minute.',
    });
  },
});

AUTH_LOGIN_ROUTER.post(
  '/',
  loginRateLimiter,
  bodyParser.json(),
  bodyParser.urlencoded({ extended: false }),
  userLoginController
);