import bcrypt from "bcrypt";
import { prismaClient } from "../../utils/prisma-adapter"
import { logAndNotify } from "../logs/log.service";

export class LoginError extends Error {
    constructor(
        message: string,
        public readonly statusCode: 401 | 429
    ) {
        super(message);
        this.name = "LoginError";
    }
}

const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000;

export const userLoginService = async (mobile: string, password: string) => {
    try {
        const user_data = await prismaClient.users.findUnique({
            where: { mobile }
        })

        if (!user_data) {
            throw new LoginError(INVALID_CREDENTIALS_MESSAGE, 401);
        }

        if (user_data.lockout_until && user_data.lockout_until > new Date()) {
            throw new LoginError(
                "Account temporarily locked due to multiple failed attempts.",
                429
            );
        }

        if (user_data.is_active === false) {
            throw new LoginError(INVALID_CREDENTIALS_MESSAGE, 401);
        }

        const isMatch = await bcrypt.compare(password, user_data.password);

        if (!isMatch) {
            const updatedUser = await prismaClient.users.update({
                where: { id: user_data.id },
                data: { failed_attempts: { increment: 1 } },
                select: { failed_attempts: true },
            });

            if (updatedUser.failed_attempts >= MAX_FAILED_ATTEMPTS) {
                await prismaClient.users.update({
                    where: { id: user_data.id },
                    data: {
                        lockout_until: new Date(Date.now() + LOCKOUT_DURATION_MS),
                    },
                });
            }

            throw new LoginError(INVALID_CREDENTIALS_MESSAGE, 401);
        }

        const logged_user = await prismaClient.users.update({
            where: { id: user_data.id },
            data: {
                failed_attempts: 0,
                lockout_until: null,
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
        return logged_user;
    }
    catch (error: any) {
        if (error instanceof LoginError) {
            throw error;
        }

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
            metadata: { error_title: "Error in login", error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, context: "userLoginService" },
            username: mobile || "",
        }).catch(e => console.error("Critical: Failed to log error", e));

        throw error
    }
}