import { LoginError, userLoginService } from "./login.service";
import { generateToken } from "../../utils/jwt";

const serializeUser = (user: any) => {
    const {
        password: _password,
        failed_attempts: _failedAttempts,
        lockout_until: _lockoutUntil,
        ...safeUser
    } = user;
    const roleId = user.role_id ?? user.roleId;
    const pharmacyId = user.pharmacy_id ?? user.pharmacyId;
    const instanceName = user.instance_name ?? user.instanceName ?? '';
    const isActive = user.is_active ?? user.isActive;
    const lastLoginAt = user.last_login_at ?? user.lastLogging;
    const createdAt = user.createdAt ?? user.createdAt;

    return {
        ...safeUser,
        id: Number(user.id),
        role_id: Number(roleId),
        pharmacy_id: Number(pharmacyId),
        instance_name: instanceName,
        is_active: Boolean(isActive),
        last_login_at: lastLoginAt ? new Date(lastLoginAt).toISOString() : null,
        createdAt: createdAt ? new Date(createdAt).toISOString() : null,
    }
}

export const userLoginController = async (req: any, res: any) => {
    try {
        const { mobile, password } = req.body
        if (typeof mobile !== "string" || typeof password !== "string" || !mobile || !password) {
            return res.status(401).json({ success: false, message: "Invalid credentials" })
        }

        // console.log("Received login request:", { mobile, password });
        const user = await userLoginService(mobile, password)
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" })
        }
        const serializedUser = serializeUser(user)
        const token = generateToken(serializedUser)
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 يوم بالميللي ثانية,
        })
        return res.status(200).json({
            success: true,
            user: serializedUser,
            ...(req.get('x-client-platform') === 'mobile' ? { token } : {}),
        })
    }
    catch (error) {
        if (error instanceof LoginError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Error in userLoginController:", error);
        return res.status(500).json({ success: false, message: "Unable to log in" });
    }
}

export const getCurrentUserController = async (req: any, res: any) => {
    try {
        const user = req.user
        console.log("Current user from token:", user);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        res.status(200).json(serializeUser(user))
    }
    
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching user data' })
    }
}