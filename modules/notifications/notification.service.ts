import {prismaClient} from "../../utils/prisma-adapter";

export async function getUserNotificationsService(userId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
        prismaClient.notification.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        prismaClient.notification.count({
            where: { user_id: userId },
        }),
        prismaClient.notification.count({
            where: { user_id: userId, is_read: false },
        }),
    ]);

    return {
        notifications,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        unreadCount,
    };
}

export function markNotificationsAsReadService(userId: number) {
    return prismaClient.notification.updateMany({
        where: { user_id: userId, is_read: false },
        data: { is_read: true, read_at: new Date() },
    });
}