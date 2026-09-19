import 'dotenv/config'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy-dev-secret'

export const generateToken = (user: any) => {
    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            mobile: user.mobile,
            pharmacy_id: user.pharmacy_id ?? user.pharmacyId,
            pharmacyId: user.pharmacy_id ?? user.pharmacyId,
            role_id: user.role_id ?? user.roleId,
            roleId: user.role_id ?? user.roleId,
            is_active: user.is_active ?? user.isActive,
            isActive: user.is_active ?? user.isActive,
            last_login_at: user.last_login_at ?? user.lastLogging,
            lastLogging: user.last_login_at ?? user.lastLogging,
            ai_mode: user.ai_mode ?? user.aiMode,
            aiMode: user.ai_mode ?? user.aiMode,
            instance_name: user.instance_name ?? user.instanceName ?? '',
            instanceName: user.instance_name ?? user.instanceName ?? '',
            avatar:user.avatar ?? user.avatar ?? ''
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    )
    return token
}