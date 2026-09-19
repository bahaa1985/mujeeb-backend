import { Request, Response } from 'express';
import * as logService from './log.service';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const { pharmacyId, userId, action, page, limit } = req.query;

    const logs = await logService.getLogs({
      pharmacyId: Number(pharmacyId) || undefined,
      userId: Number(userId),
      action: action as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    // Convert BigInt to string for JSON serialization
    const result = JSON.parse(JSON.stringify(logs, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    res.json(result);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

