import {prismaClient} from "../../utils/prisma-adapter"
import { logAndNotify } from "../logs/log.service"

export const userLogoutService  = async(user_id:number)=>{
    try{
        const loggedout_user = await prismaClient.users.update({
            where:{id:user_id},
            data:{
                is_logging_in:false
            }
        })

        logAndNotify({
            userId: user_id,
            pharmacyId: loggedout_user.pharmacy_id,
            action: "USER_LOGOUT",
            username: loggedout_user.username || "",
        })

        return loggedout_user
    }
    catch(error: any){
        console.error("Error during user logout: check logout data", error)
        logAndNotify({
            userId: user_id,
            pharmacyId: null,
            action: "APP_ERROR",
            metadata: { error_title: "Error in logout", error: error.message, stack: error.stack, context: "userLogoutService" }
        }).catch(e => console.error(e));
        throw error
    }
}