import { createEvolutionInstanceService, getPairingCodeEvolutionService, updateEvolutionInstanceStatusService, setWebhookEvolutionService, getConnectionStateService } from '../evolution_instance/instance.service'

import express from 'express'

export const EVOLUTION_INSTANCE_ROUTER = express.Router()

export const createInstanceController = async (req: any, res: any) => {
    const { user_id,instance_name,mobile } = req.body
    try {
        const result = await createEvolutionInstanceService(user_id,instance_name,mobile)
        await setWebhookEvolutionService(instance_name)
        res.status(201).json(result)
    } catch (error: any) {
        res.status(500).json({ message: "Error creating instance", error: error })
    }
}

export const getPairingCodeController = async (req: any, res: any) => {
    const { instance_name } = req.query
    try {
        const result = await getPairingCodeEvolutionService(instance_name as string)
        res.status(200).json(result)

    } catch (error: any) {
        res.status(500).json({ message: "Error getting pairing code", error: error.message })
    }
}

export const evolutionWebhookController = async (req: any, res: any) => {
    const { event, data } = req.body
    if (event === "CONNECTION_UPDATE" || event === "connection.update") {
        const { instance, state } = data
        // if (state === "open") {
            await updateEvolutionInstanceStatusService(instance, state)
        // } else if (state === "connecting") {
        //     await updateEvolutionInstanceStatusService(instance, "connecting")
        // } else if (state === "close" || state === "refused") {
        //     await updateEvolutionInstanceStatusService(instance, "close")
        // }
    }
    res.status(200).send("Webhook received")
}

export const getConnectionStateController = async (req: any, res: any) => {
    const { instance_name } = req.query
    if(!instance_name || typeof instance_name !== 'string' || instance_name === undefined || instance_name.trim() === '') {
        return res.status(400).json({ message: "instance_name query parameter is required and must be a string" })
    }
    try {
        const state = await getConnectionStateService(instance_name as string)
        res.status(200).json({ state })
    }
    catch (error: any) {
        res.status(500).json({ message: "Error getting connection state", error: error.message })
    }
}

