import bcrypt from "bcrypt";
import { prismaClient } from "../../utils/prisma-adapter"
import { sendPushNotification } from "../../utils/notificationService";
import { logAndNotify } from "../logs/log.service";

export const userLoginService = async (mobile: string, password: string) => {
    debugger
    try {
        const user_data = await prismaClient.users.findUnique({

            where: { mobile: mobile }
        })
        // console.log("Fetched user data:", user_data);
        if (!user_data) {
            throw new Error("User not found")
        }

        if (user_data.is_active !== false) {
            const isMatch = bcrypt.compareSync(password, user_data.password)

            if (isMatch) {
                const logged_user = await prismaClient.users.update({
                    where: { id: user_data.id },
                    data: {
                        is_logging_in: true,
                        last_login_at: new Date()
                    }
                })

                logAndNotify({
                    userId: user_data.id,
                    pharmacyId: user_data.pharmacy_id,
                    action: "USER_LOGIN",
                    username: user_data.username || "",
                    metadata: {
                        ip_address: '', username: user_data.username,
                        user_mobile: user_data.mobile
                    }
                }).catch(e => console.error(e));
                return logged_user
            }
            // Password did not match
            throw new Error("Invalid credentials")
        }
        else {
            throw new Error("User is not active")
        }
    }
    catch (error: any) {
        console.error("Error during user login: check login data", error)
        const failedUser = await prismaClient.users.findUnique({
            where: { mobile },
            select: { id: true, pharmacy_id: true }
        });
        // Log application error
        logAndNotify({
            userId: failedUser?.id || 2,
            pharmacyId: failedUser?.pharmacy_id ?? null,
            action: "APP_ERROR",
            metadata: { error_title: "Error in login", error: error.message, stack: error.stack, context: "userLoginService" },
            username: mobile || "",
        }).catch(e => console.error("Critical: Failed to log error", e));

        throw error
    }
}