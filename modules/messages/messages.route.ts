import { authenticateToken } from "../../middleware/authenticateToken";
import {
  createMessageController,
  deleteMessageController,
  getMessagesByPharmacyIdController,
    getMessagesByUserNumberController,
  getUserMessagesCountController,
  getPharmacyMessagesCountController,
  getOrderMessageCountByUserMobileController,
  getOrderMessageCountByPharmacyController,
  updateMessageController,
  checkOrderMessageController,
  handleWebhookController,
} from "./messages.controller";

import express from "express";

export const MESSAGES_ROUTER = express.Router();

MESSAGES_ROUTER.post('/webhook', handleWebhookController);

MESSAGES_ROUTER.use(authenticateToken);

MESSAGES_ROUTER.get('/user/:userNumber', getMessagesByUserNumberController);
MESSAGES_ROUTER.get('/pharmacy/:pharmacyId', getMessagesByPharmacyIdController);
MESSAGES_ROUTER.get('/count/user/:userNumber', getUserMessagesCountController);
MESSAGES_ROUTER.get('/count/pharmacy/:pharmacyId', getPharmacyMessagesCountController);
MESSAGES_ROUTER.get('/orders/count/user/:mobile', getOrderMessageCountByUserMobileController);
MESSAGES_ROUTER.get('/orders/count/pharmacy/:pharmacyId', getOrderMessageCountByPharmacyController);
MESSAGES_ROUTER.post('/new', createMessageController);
MESSAGES_ROUTER.post('/order-message', checkOrderMessageController);
MESSAGES_ROUTER.patch('/:id', updateMessageController);

MESSAGES_ROUTER.delete('/:id', deleteMessageController);