import { userLogoutService } from "./logout.service"

const serializeUser = (user: any) => {
    return {
        ...user,
        id: user.id?.toString(),
        role_id: user.role_id?.toString(),
        pharmacy_id: user.pharmacy_id?.toString()
    }
}

export const userLogoutController = async (req:any,res:any) =>{
    try{
        const user_id = req.user.id
        const loggedout_user = await userLogoutService(user_id)
        if(loggedout_user){
            const token = req.cookies.token || null
            if (!token) {
                return res.status(400).json({ success: false, message: 'No token provided.' })
            }
            res.clearCookie('token')
            res.status(200).json({ success: true, message: 'Logged out successfully.' })
        }
        else{
            res.status(400).json({ success: false, message: 'Error logging out.' })
        }
    }
    catch(error){
        res.status(500).json({ success: false, message: 'Error logging out.' })
    }
}