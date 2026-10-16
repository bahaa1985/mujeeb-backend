import { PrismaClient } from "@prisma/client/extension";
import { prismaClient } from "../../utils/prisma-adapter";
import { logAndNotify } from "../logs/log.service";

export const getInventoryCountByPharmacyId= async(pharmacyId:number)=>{
    try{
        return await prismaClient.inventory.count({
            where:{
                pharmacy_id : pharmacyId
            }
        })
    }
    catch(error: any){
    console.error('Error fetching inventory count:', error);
    logAndNotify({
        userId: 0,
        pharmacyId: pharmacyId,
        action: "APP_ERROR",
        metadata: { error_title: "Error fetching inventory count", error: error.message, stack: error.stack, context: "getInventoryCountByPharmacyId" }
    }).catch(e => console.error(e));
    throw error;
    }
}

export const getInventoryPage = async (
    pharmacyId: number,
    page: number,
    limit: number,
    search: string,
    stock: "in" | "out" | "all",
) => {
    const where = {
        pharmacy_id: pharmacyId,
        ...(search
            ? {
                OR: [
                    { en_name: { contains: search, mode: "insensitive" as const } },
                    { ar_name: { contains: search, mode: "insensitive" as const } },
                    { active_material: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {}),
        ...(stock === "in" ? { quantity: { gt: 0 } } : {}),
        ...(stock === "out" ? { quantity: { lte: 0 } } : {}),
    };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        prismaClient.inventory.findMany({
            where,
            orderBy: [{ en_name: "asc" }, { ar_name: "asc" }],
            skip,
            take: limit,
        }),
        prismaClient.inventory.count({ where }),
    ]);

    return {
        data: items,
        meta: {
            total,
            page,
            limit,
            lastPage: Math.max(1, Math.ceil(total / limit)),
        },
    };
};