import { Router } from 'express';
// import multer from 'multer';
// import * as XLSX from 'xlsx';
import { getInventoryCountController, getInventoryListController, uploadInventory } from './inventory.controller';
import { authenticateToken } from '../../middleware/authenticateToken';
import { rateLimit } from 'express-rate-limit';

export const INVENTORY_ROUTER = Router();
INVENTORY_ROUTER.use(authenticateToken);
const uploadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too many inventory upload attempts. Please try again when the 10-minute rate-limit window resets.',
    });
  },
});
// const upload = multer({ storage: multer.memoryStorage() });

// Upload inventory file
// router.post('/upload', upload.single('file'), inventoryController.uploadInventory);
INVENTORY_ROUTER.post('/upload', uploadRateLimiter, uploadInventory);
INVENTORY_ROUTER.get('/', getInventoryListController);
INVENTORY_ROUTER.get('/pharmacy', getInventoryCountController);
INVENTORY_ROUTER.get('/pharmacy/:pharmacyId',getInventoryCountController);

// legacy: drugcard endpoint removed — frontend loads DrugCard.xlsx from public/