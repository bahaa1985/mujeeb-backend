import {getUserNotificationsController,markNotificationsAsReadController} from "./notification.controller";
import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken";

export const NOTIFICATION_ROUTER = express.Router();

NOTIFICATION_ROUTER.use(authenticateToken);

// Route to get user notifications
NOTIFICATION_ROUTER.get("/", getUserNotificationsController);

// Route to mark notifications as read
NOTIFICATION_ROUTER.patch("/read", markNotificationsAsReadController);