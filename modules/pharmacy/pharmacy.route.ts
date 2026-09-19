import express from 'express'
import { createPharamcyController, getAllPharmaciesController, getPharmacyByIdController, updatePharmacyController } from './pharmacy.controller'

export const PHARMACY_ROUTER = express.Router()

PHARMACY_ROUTER.post('/create',createPharamcyController)
PHARMACY_ROUTER.get('/all', getAllPharmaciesController)
PHARMACY_ROUTER.get('/:id', getPharmacyByIdController)
PHARMACY_ROUTER.patch('/update/:id', updatePharmacyController)