import {getUserNotificationsService,markNotificationsAsReadService} from "./notification.service";

const serializeNotification = (notification: any) => ({
    ...notification,
    id: notification.id?.toString(),
});

export const getUserNotificationsController = async (req: any, res: any) => {
    try {
        const authenticatedUser = req.user;
        if (!authenticatedUser) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const pharmacyId = Number(authenticatedUser?.role_id) === 1
            ? Number(req.query.pharmacyId)
            : Number(authenticatedUser?.pharmacy_id);
        if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
            return res.status(400).json({ error: "Valid pharmacy ID is required" });
        }

        const page = req.query.page === undefined ? 1 : Number(req.query.page);
        const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
        if (!Number.isInteger(page) || page <= 0 || !Number.isInteger(limit) || limit <= 0) {
            return res.status(400).json({ error: "Page and limit must be positive integers" });
        }

        const result = await getUserNotificationsService(pharmacyId, page, limit);
        res.json({
            ...result,
            data: result.data.map(serializeNotification),
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