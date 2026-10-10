import {prismaClient} from "../../utils/prisma-adapter";

export async function getUserNotificationsService(pharmacyId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = { pharmacy_id: pharmacyId };
    const [notifications, total, unreadCount] = await Promise.all([
        prismaClient.notification.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        }),
        prismaClient.notification.count({ where }),
        prismaClient.notification.count({ where: { ...where, is_read: false } }),
    ]);

    return {
        data: notifications,
        meta: {
            total,
            page,
            limit,
            lastPage: Math.ceil(total / limit),
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