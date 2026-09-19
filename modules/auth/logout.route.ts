import express from "express";
import { userLogoutController } from "./logout.controller";
import { authenticateToken } from "../../middleware/authenticateToken";

export const AUTH_LOGOUT_ROUTER = express.Router()

AUTH_LOGOUT_ROUTER.post('/',authenticateToken, userLogoutController)