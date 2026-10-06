import 'dotenv/config'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy-dev-secret'

export const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies?.token || null
    
    if (!token) {
        return res.status(401).json({ success: false, message: ' No token provided.' })
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET as string)
        const user = decoded as any
        const pharmacyId = Number(user?.pharmacy_id ?? user?.pharmacyId)
        if (!user || typeof user !== 'object' || !Number.isInteger(pharmacyId) || pharmacyId <= 0) {
            return res.status(401).json({ success: false, message: 'Invalid token.' })
        }
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token.' })
    }
}


