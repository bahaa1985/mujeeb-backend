import {getUserNotificationsService,markNotificationsAsReadService} from "./notification.service";

const serializeNotification = (notification: any) => ({
    ...notification,
    id: notification.id?.toString(),
});

export const getUserNotificationsController = async (req: any, res: any) => {
    try {
        const userId = Number(req.user?.id);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const result = await getUserNotificationsService(userId, page, limit);
        res.json({
            ...result,
            notifications: result.notifications.map(serializeNotification),
        });
    } catch (error) {
        console.error("Error fetching user notifications:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const markNotificationsAsReadController = async (req: any, res: any) => {
    try {
        const userId = Number(req.user?.id);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        await markNotificationsAsReadService(userId);
        res.json({ message: "Notifications marked as read" });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};