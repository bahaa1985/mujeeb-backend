import express from 'express';
import { userLoginController } from './login.controller';
import bodyParser from 'body-parser';

export const AUTH_LOGIN_ROUTER = express.Router();

AUTH_LOGIN_ROUTER.post(
  '/',
  bodyParser.json(),
  bodyParser.urlencoded({ extended: false }),
  userLoginController
);