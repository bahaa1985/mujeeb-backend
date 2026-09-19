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