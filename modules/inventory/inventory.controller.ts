import { prismaClient } from '../../utils/prisma-adapter';
import { getInventoryCountByPharmacyId } from './inventory.service';
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
      const pharmacyId = body.pharmacy_id || req.user?.pharmacyId;
      if (!pharmacyId) {
        return res.status(400).json({ success: false, message: 'pharmacy_id not provided' });
      }

      const rows = body.rows as any[];
      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No rows provided' });
      }


      // Normalize rows to match DB fields — only include columns present in Prisma model
      const rowsToInsert = rows.map(r => {
        const ar_name = (r.ar_name ?? r.a_name ?? null) as string | null;
        const en_name = (r.en_name ?? r.e_name ?? null) as string | null;
        const price = r.price !== undefined && r.price !== null && r.price !== '' ? parseFloat(String(r.price)) : null;
        const units_count = r.units_count !== undefined && r.units_count !== null && r.units_count !== '' ? parseFloat(String(r.units_count)) : null;
        const quantity = r.quantity !== undefined && r.quantity !== null && r.quantity !== '' ? parseFloat(String(r.quantity)) : null;
        const active = r.active ?? r.active_material ?? null;
        const drug_type = r.drug_type ?? r.type ?? r.unit ?? null;
        const dosage_form = r.dosage_form ?? null;

        return {
          pharmacy_id: pharmacyId,
          ar_name: ar_name ? String(ar_name) : null,
          en_name: en_name ? String(en_name) : null,
          price: price === null ? null : price,
          units_count: units_count === null ? null : units_count,
          quantity: quantity === null ? null : quantity,
          active_material: active ? String(active) : null,
          dosage_form: dosage_form ? String(dosage_form) : null,
          drug_type: drug_type ? String(drug_type) : null,

        };
      });
      console.log(rowsToInsert[0])
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
      pharmacyId: req.body?.pharmacy_id ,
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
    const {pharmacyId} = req.params   
    if (!pharmacyId) return res.status(401).json({ message: 'Unauthorized' });
    const inventoryCount = await getInventoryCountByPharmacyId(Number(pharmacyId))
    res.status(200).json(inventoryCount)
  }
  catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error });
  }
}