import { Router } from 'express';
// import multer from 'multer';
// import * as XLSX from 'xlsx';
import {uploadInventory} from './inventory.controller';
import { getInventoryCountController } from './inventory.controller';

export const INVENTORY_ROUTER = Router();
// const upload = multer({ storage: multer.memoryStorage() });

// Upload inventory file
// router.post('/upload', upload.single('file'), inventoryController.uploadInventory);
INVENTORY_ROUTER.post('/upload', uploadInventory);
INVENTORY_ROUTER.get('/pharmacy/:pharmacyId',getInventoryCountController);

// legacy: drugcard endpoint removed — frontend loads DrugCard.xlsx from public/