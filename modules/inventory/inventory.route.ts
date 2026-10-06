import { Router } from 'express';
// import multer from 'multer';
// import * as XLSX from 'xlsx';
import {uploadInventory} from './inventory.controller';
import { getInventoryCountController } from './inventory.controller';
import { authenticateToken } from '../../middleware/authenticateToken';

export const INVENTORY_ROUTER = Router();
INVENTORY_ROUTER.use(authenticateToken);
// const upload = multer({ storage: multer.memoryStorage() });

// Upload inventory file
// router.post('/upload', upload.single('file'), inventoryController.uploadInventory);
INVENTORY_ROUTER.post('/upload', uploadInventory);
INVENTORY_ROUTER.get('/pharmacy', getInventoryCountController);
INVENTORY_ROUTER.get('/pharmacy/:pharmacyId',getInventoryCountController);

// legacy: drugcard endpoint removed — frontend loads DrugCard.xlsx from public/