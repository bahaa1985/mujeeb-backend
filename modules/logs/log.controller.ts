import { Request, Response } from 'express';
import * as logService from './log.service';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const { pharmacyId, userId, action, page, limit } = req.query;
    const authenticatedUser = (req as any).user;
    const tenantPharmacyId = Number(authenticatedUser.role_id) === 1
      ? Number(pharmacyId)
      : Number(authenticatedUser.pharmacy_id);
    const parsedPage = page === undefined ? 1 : Number(page);
    const parsedLimit = limit === undefined ? 20 : Number(limit);

    if (!Number.isInteger(tenantPharmacyId) || tenantPharmacyId <= 0) {
      return res.status(400).json({ error: "Valid pharmacy ID is required" });
    }
    if (!Number.isInteger(parsedPage) || parsedPage <= 0 || !Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: "Page and limit must be positive integers" });
    }

    const logs = await logService.getLogs({
      pharmacyId: tenantPharmacyId,
      userId: Number(userId),
      action: action as string,
      page: parsedPage,
      limit: parsedLimit,
    });

    // Convert BigInt to string for JSON serialization
    const result = JSON.parse(JSON.stringify(logs, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return res.json(result);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

