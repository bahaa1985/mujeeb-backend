import { prismaClient } from '../../utils/prisma-adapter';
import { getInventoryCountByPharmacyId, getInventoryPage, updateInventoryItem, type InventoryUpdateData } from './inventory.service';
import { logAndNotify } from '../logs/log.service';

// Extend Express Request type to include `user` set by authentication middleware
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
const serializeInventory=(inventory:any)=>{
  return{
    ...inventory,
    id: inventory.id?.toString(),
    pharmacy_id: Number(inventory.pharmacy_id),
    price: inventory.price !== null ? parseFloat(String(inventory.price)) : null,
    units_count: inventory.units_count !== null ? parseFloat(String(inventory.units_count)) : null,
    quantity: inventory.quantity !== null ? parseFloat(String(inventory.quantity)) : null,
  }
}
// interface DrugCardEntry {
//   a_name?: string;
//   e_name?: string;
//   dosage_form: string;
// }

// Upload and process inventory file
export const uploadInventory = async (req: any, res: any) => {
  try {
    // Mode 1: JSON payload from frontend after it performs validation and fuzzy matching
    if (req.body && Array.isArray((req.body as any).rows)) {
      const body: any = req.body;
      const pharmacyId = Number(req.user?.role_id) === 1
        ? Number(body.pharmacy_id || req.user?.pharmacy_id)
        : Number(req.user?.pharmacy_id);
      if (!pharmacyId) {
        return res.status(400).json({ success: false, message: 'pharmacy_id not provided' });
      }

      const rows = body.rows as any[];
      console.log("roes back",rows);
      
      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No rows provided' });
      }


      // Normalize rows to match DB fields — only include columns present in Prisma model
      const rowsToInsert = rows.map(r => {
        const ar_name = (r.ar_name ?? r.a_name ?? null) as string | null;
        const en_name = (r.en_name ?? r.e_name ?? null) as string | null;
        const price = r.price !== undefined && r.price !== null && r.price !== '' ? parseFloat(String(r.price)) : null;
        const units_count = r.units_count !== undefined && r.units_count !== null && r.units_count !== '' ? parseFloat(String(r.units_count)) : null;
        const parsedQuantity = r.quantity !== undefined && r.quantity !== null && r.quantity !== ''
          ? parseFloat(String(r.quantity))
          : null;
        const active = r.active ?? r.active_material ?? null;
        const drug_type = r.drug_type ?? r.type ?? r.unit ?? null;
        const dosage_form = r.dosage_form ?? null;

        return {
          pharmacy_id: pharmacyId,
          ar_name: ar_name ? String(ar_name) : null,
          en_name: en_name ? String(en_name) : null,
          price: price === null ? null : price,
          units_count: units_count === null ? null : units_count,
          quantity: parsedQuantity !== null && Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? 1 : 0,
          active_material: active ? String(active) : null,
          dosage_form: dosage_form ? String(dosage_form) : null,
          drug_type: drug_type ? String(drug_type) : null,

        };
      });
      // console.log(rowsToInsert[0])
            await prismaClient.$transaction([
        prismaClient.inventory.deleteMany({ where: { pharmacy_id: pharmacyId } }),
        prismaClient.inventory.createMany({ data: rowsToInsert })
      ]);

      logAndNotify({
        userId: req.user?.id ,
        pharmacyId: pharmacyId,
        action: "INVENTORY_UPDATED",
        username: req.user?.username || "System",
        metadata: { count: rowsToInsert.length }
      }).catch(e => console.error(e));

      return res.json({ success: true, message: 'Inventory saved successfully', inserted: rowsToInsert.length });
    }

    // If we reached here, the request did not include the expected `rows` array
    return res.status(400).json({ success: false, message: 'Invalid request payload: expected `rows` array in body' });
  }
    catch (dbError: any) {
    console.error("NAME:", dbError?.name);
    console.error("MESSAGE:", dbError?.message);
    console.error("STACK:", dbError?.stack);
    logAndNotify({
      userId: req.user?.id ,
      pharmacyId: req.user?.pharmacy_id,
      action: "APP_ERROR",
      metadata: { error: dbError.message, context: "uploadInventory" }
    }).catch(e => console.error(e));
    return res.status(500).json({ success: false, message: 'Failed to save inventory', error: String(dbError) });
  }

  // Fallback: ensure a response is always returned
  // (should not be reached because above either returns success or a 4xx/5xx response)
  return res.status(400).json({ success: false, message: 'Invalid request' });
}

export const getInventoryCountController = async (req: any, res: any) => {
  try {
    const pharmacyId = Number(req.user?.role_id) === 1
      ? Number(req.params.pharmacyId || req.user?.pharmacy_id)
      : Number(req.user?.pharmacy_id);
    if (!pharmacyId) return res.status(401).json({ message: 'Unauthorized' });
    const inventoryCount = await getInventoryCountByPharmacyId(Number(pharmacyId))
    res.status(200).json(inventoryCount)
  }
  catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error });
  }
}

export const getInventoryListController = async (req: any, res: any) => {
  try {
    const pharmacyId = Number(req.user?.pharmacy_id);
    if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const requestedLimit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    const stock = req.query.stock === undefined ? 'all' : String(req.query.stock);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return res.status(400).json({ message: 'Page and limit must be positive integers' });
    }
    if (stock !== 'all' && stock !== 'in' && stock !== 'out') {
      return res.status(400).json({ message: 'Stock filter must be all, in, or out' });
    }

    const result = await getInventoryPage(
      pharmacyId,
      page,
      Math.min(requestedLimit, 100),
      typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '',
      stock,
    );
    return res.status(200).json({
      ...result,
      data: result.data.map(serializeInventory),
    });
  } catch (error) {
    console.error('Error fetching inventory list:', error);
    return res.status(500).json({ message: 'Error fetching inventory' });
  }
};

const inventoryUpdateFields = [
  'en_name',
  'ar_name',
  'price',
  'units_count',
  'dosage_form',
  'drug_type',
  'active_material',
  'quantity',
] as const;

export const updateInventoryItemController = async (req: any, res: any) => {
  const pharmacyId = Number(req.user?.pharmacy_id);
  if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const idText = String(req.params.id ?? '');
  if (!/^\d{1,19}$/.test(idText)) {
    return res.status(400).json({ message: 'Inventory item id must be a positive integer' });
  }
  const inventoryId = BigInt(idText);
  if (inventoryId <= 0n || inventoryId > 9223372036854775807n) {
    return res.status(400).json({ message: 'Inventory item id must be a positive integer' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'A valid inventory update body is required' });
  }

  const unsupportedFields = Object.keys(body).filter(
    (field) => !inventoryUpdateFields.includes(field as typeof inventoryUpdateFields[number]),
  );
  if (unsupportedFields.length) {
    return res.status(400).json({
      message: `Unsupported or immutable inventory fields: ${unsupportedFields.join(', ')}`,
    });
  }

  const updates: InventoryUpdateData = {};
  for (const field of inventoryUpdateFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];

    if (field === 'price' || field === 'units_count') {
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) {
        return res.status(400).json({ message: `${field} must be a finite number or null` });
      }
      updates[field] = value;
      continue;
    }

    if (field === 'quantity') {
      if (value !== 0 && value !== 1) {
        return res.status(400).json({ message: 'quantity must be 1 (available) or 0 (not available)' });
      }
      updates.quantity = value;
      continue;
    }

    if (value !== null && typeof value !== 'string') {
      return res.status(400).json({ message: `${field} must be a string or null` });
    }
    updates[field] = value === null ? null : value.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'At least one editable inventory field is required' });
  }

  try {
    const updatedInventory = await updateInventoryItem(inventoryId, pharmacyId, updates);
    if (!updatedInventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    logAndNotify({
      userId: req.user?.id,
      pharmacyId,
      action: 'INVENTORY_UPDATED',
      username: req.user?.username || 'System',
      metadata: { count: 1, inventoryId: idText, updatedFields: Object.keys(updates) },
    }).catch((error) => console.error(error));

    return res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: serializeInventory(updatedInventory),
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    logAndNotify({
      userId: req.user?.id,
      pharmacyId,
      action: 'APP_ERROR',
      metadata: { error: error instanceof Error ? error.message : String(error), context: 'updateInventoryItem' },
    }).catch((logError) => console.error(logError));
    return res.status(500).json({ message: 'Failed to update inventory item' });
  }
};