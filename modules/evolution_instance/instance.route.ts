import express from 'express'
import {createInstanceController,getPairingCodeController,evolutionWebhookController ,getConnectionStateController} from './instance.controller'

export const EVOLUTION_INSTANCE_ROUTER = express.Router();

EVOLUTION_INSTANCE_ROUTER.post('/create', createInstanceController)
EVOLUTION_INSTANCE_ROUTER.get('/pairing-code', getPairingCodeController)
EVOLUTION_INSTANCE_ROUTER.post('/webhook', evolutionWebhookController)
EVOLUTION_INSTANCE_ROUTER.get('/connection-state', getConnectionStateController)