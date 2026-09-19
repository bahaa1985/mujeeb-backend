import { prismaClient } from "../../utils/prisma-adapter";
import bcrypt from 'bcrypt';
import { logAndNotify } from "../logs/log.service";

export const createUserService = async (username: string, password:string, mobile:string,
    role_id: number, pharmacy_id: number,avatar:string) => {
        try{
            const saltRounds=10
            const hashedPassword:string = await bcrypt.hash(password,saltRounds)
            const newUser = await prismaClient.users.create({
                data:{
                    username, password:hashedPassword, mobile, role_id, pharmacy_id,avatar
                }
            })

            logAndNotify({
                userId: newUser.id,
                pharmacyId: newUser.pharmacy_id,
                action: "CREATE_NEW_USER",
                username: newUser.username || "",
                metadata: { role_id: role_id.toString() }
            })

            return newUser
        }
        catch(error: any){ 
            console.error("Error creating user:", error)
            logAndNotify({
                userId: 0,
                    action: "APP_ERROR",
                    pharmacyId: pharmacy_id,
                    metadata: { error_title: "Error creating user", error: error.message, stack: error.stack, context: "createUserService" }
            }).catch(e => console.error(e));
            throw error
        }
    }

export const updateUserService = async (userId: number, updateData: any) => {
    try {
        if (updateData.password?.length >=8) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(updateData.password as string, saltRounds);
        }
        const updatedUser = await prismaClient.users.update({
            where: { id: Number(userId) },
            data: updateData,
        });
        return updatedUser;
        } catch (error: any) {
        console.error("Error updating user:", error);
        logAndNotify({
            userId: userId,
                action: "APP_ERROR",
                pharmacyId: null,
                metadata: { error_title: "Error updating user", error: error.message, stack: error.stack, context: "updateUserService" }
        }).catch(e => console.error(e));
        throw error;
    }
}

export const getAllUsersService = async (pharmacyId:number)=>{
    // console.log("get all users")
    try{
        const users = await prismaClient.users.findMany({
            where:{pharmacy_id:pharmacyId}
        })
        return users
    }
    catch(error: any){
        console.error("Error fetching users:", error)
        logAndNotify({
            userId: 0,
            pharmacyId: pharmacyId,
                action: "APP_ERROR",
                metadata: { error_title: "Error fetching users", error: error.message, stack: error.stack, context: "getAllUsersService" }
        }).catch(e => console.error(e));
        throw error
    }
}

export const deactivateUserService = async (userId: number) => {
    try{
        const user = await prismaClient.users.update({
            where :{id :userId},
            data:{is_active:false}
        })
        return user
    }
    catch(error: any){
        console.error("Error deactivating users:", error)
        logAndNotify({
            userId: userId,
            pharmacyId: null,
            action: "APP_ERROR",
            metadata: { error_title: "Error deactivating user", error: error.message, stack: error.stack, context: "deactivateUserService" }
        }).catch(e => console.error(e));
        throw error
    }
}

export const updateUserFCMTokenService = async(userId:number,fcmToken:string)=>{
    try{
        // هنجيب بيانات المستخدم الأول عشان نتأكد إن التوكن مش متسجل قبل كده
    const user = await prismaClient.users.findUnique({
      where: { id: userId },
      select: { fcm_token: true }
    });
    // لو التوكن موجود بالفعل في المصفوفة، مش محتاجين نضيفه تاني
    if (!user?.fcm_token.includes(fcmToken)) {
      await prismaClient.users.update({
        where: { id: userId },
        data: { 
          fcm_token: {
            push: fcmToken // بنضيف التوكن الجديد على التوكنز القديمة
          } 
        }
      });
    }
    return user
        }
    catch(error: any){
        // console.log("Error updating fcm token",error)
        logAndNotify({
            userId: userId,
            pharmacyId: null,
            action: "APP_ERROR",
            metadata: { error_title: "Error updating notification token", error: error.message, stack: error.stack, context: "updateUserFCMTokenService" }
        }).catch(e => console.error(e));
        throw error
    }
}
