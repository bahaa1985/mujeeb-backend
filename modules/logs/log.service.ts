import { prismaClient } from '../../utils/prisma-adapter';
import { TargetRole, NotificationType } from '@prisma/client';
import { sendPushNotification } from '../../utils/notificationService';

export interface LogFilter {
  pharmacyId?: number;
  userId?: number;
  action?: string;
  page?: number;
  limit?: number;
}

export const createLog = async (data: {
  userId: number;
  pharmacyId?: number | null;
  action: string;
  metadata?: any;
}) => {
  return await prismaClient.system_log.create({
    data: {
      user_id: data.userId,
      pharmacy_id:Number(data.pharmacyId),
      action: data.action,
      metadata: data.metadata || {}
    },
  });
};

export const getLogs = async (filter: LogFilter) => {
  const { pharmacyId, userId, action, page = 1, limit = 20 } = filter;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (pharmacyId) where.pharmacy_id = pharmacyId;
  if (userId) where.user_id = userId;
  if (action) where.action = action;

  const [total, logs] = await Promise.all([
    prismaClient.system_log.count({ where }),
    prismaClient.system_log.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      // include: {
      //   user: { select: { first_name: true, last_name: true, username: true } }
      // }
    }),
  ]);

  return {
    data: logs,
    meta: {
      total,
      page,
      lastPage: Math.ceil(total / limit),
    },
  };
};

/**
 * Task 2 Implementation: logAndNotify
 */

const translations: Record<string, any> = {
  en: {
    USER_LOGIN: { title: "Login Alert", body: "User {username} ({mobile}) signed in successfully at {pharmacy}" },
    USER_LOGOUT: { title: "Logout Alert", body: "User {username} ({mobile}) signed out from {pharmacy}" },
    AI_MODE_TOGGLED: { title: "AI Mode Changed", body: "AI mode has been updated by {username} ({mobile}) at {pharmacy}" },
    SUBSCRIPTION_RENEWED: { title: "Subscription Renewed", body: "Pharmacy subscription renewed successfully" },
    SUBSCRIPTION_SUSPENDED: { title: "Subscription Suspended", body: "Pharmacy subscription has been suspended" },
    ORDER_REQUEST: { title: "New Order", body: "New order request from {contactName} ({contactNumber}) has been received" },
    INVENTORY_UPDATED: { title: "Inventory Update", body: "Inventory has been updated by {username} at {pharmacy}" },
    CREATE_NEW_USER: { title: "Security Alert", body: "A new user {username} was created" },
    APP_ERROR: { title: "System Error", body: "An application error occurred: {details}" },
    CREATE_EVOLUTION_INSTANCE: { title: "WhatsApp Connected", body: "A new WhatsApp instance was created for {username}" },
  },
  ar: {
    USER_LOGIN: { title: "تنبيه دخول", body: "قام المستخدم {username} ({mobile}) بتسجيل الدخول إلى {pharmacy} بنجاح" },
    USER_LOGOUT: { title: "تنبيه خروج", body: "قام المستخدم {username} ({mobile}) بتسجيل الخروج من {pharmacy}" },
    AI_MODE_TOGGLED: { title: "تغيير وضع الذكاء الاصطناعي", body: "تم تحديث وضع الرد الآلي بواسطة {username} ({mobile}) في {pharmacy}" },
    SUBSCRIPTION_RENEWED: { title: "تجديد الاشتراك", body: "تم تجديد اشتراك الصيدلية بنجاح" },
    SUBSCRIPTION_SUSPENDED: { title: "إيقاف الاشتراك", body: "تم إيقاف اشتراك الصيدلية" },
    ORDER_REQUEST: { title: "طلب جديد", body: "تم استلام طلب جديد من {contactName} ({contactNumber})" },
    INVENTORY_UPDATED: { title: "تحديث المخزون", body: "تم تحديث المخزون بواسطة {username} في {pharmacy}" },
    CREATE_NEW_USER: { title: "تنبيه أمني", body: "تم إنشاء مستخدم جديد: {username}" },
    APP_ERROR: { title: "خطأ في النظام", body: "حدث خطأ في التطبيق: {details}" },
    CREATE_EVOLUTION_INSTANCE: { title: "ربط واتساب", body: "تم إنشاء مثيل واتساب جديد للمستخدم {username}" },
  }
};

export const logAndNotify = async (params: {
  userId: number;
  pharmacyId: number | null;
  action: string;
  metadata?: any;
  locale?: 'en' | 'ar';
  username?: string;
}) => {
  const { userId, pharmacyId, action, metadata, locale = 'ar', username = '' } = params;

  let resolvedPharmacyId = pharmacyId;
  if (resolvedPharmacyId == null && userId > 0) {
    const user = await prismaClient.users.findUnique({
      where: { id: userId },
      select: { pharmacy_id: true }
    });
    resolvedPharmacyId = user?.pharmacy_id ?? null;
  }

  // 1. Create System Log
  await createLog({ userId, pharmacyId: resolvedPharmacyId, action, metadata });

  // Application errors are stored for diagnostics but are not user notifications.
  if (action === "APP_ERROR") return;

  // 2. Determine Target Roles
  let targetRoles: TargetRole[] = [];
  let notification_type:NotificationType;
  switch (action) {
    case "USER_LOGIN":
    case "USER_LOGOUT":
        targetRoles=[TargetRole.ADMIN]
        notification_type=NotificationType.USER_AUTH
        break
    case "AI_MODE_TOGGLED":
        targetRoles=[TargetRole.ADMIN]
        notification_type=NotificationType.AI_TOGGLED
        break
    case "SUBSCRIPTION_RENEWED":
      targetRoles=[TargetRole.ADMIN,TargetRole.USER]
      notification_type=NotificationType.SUBSCRIPTION_RENEWED
      break
    case "SUBSCRIPTION_SUSPENDED":
      targetRoles = [TargetRole.ADMIN,TargetRole.USER]; // Role 2
      notification_type=NotificationType.SUBSCRIPTION_SUSPENDED
      break;
    case "ORDER_REQUEST":
      targetRoles = [TargetRole.USER]; // Role 3
      notification_type=NotificationType.ORDER_REQUEST
      break
    case "INVENTORY_UPDATED":
      targetRoles = [TargetRole.ADMIN, TargetRole.USER];
      notification_type=NotificationType.INVENTORY_UPDATED
      break
    case "CREATE_NEW_USER":
      targetRoles=[TargetRole.SUPER_ADMIN]
      notification_type=NotificationType.NEW_USER
      break
    case "APP_ERROR":
      targetRoles = [TargetRole.SUPER_ADMIN]; // Role 1
      notification_type=NotificationType.SYSTEM_ERROR
      break;
    case "CREATE_EVOLUTION_INSTANCE":
      targetRoles = [TargetRole.SUPER_ADMIN, TargetRole.ADMIN, TargetRole.USER];
      notification_type=NotificationType.NEW_INSTANCE
      break;
    default:
      return; // No notification defined for this action
  }

  const actor = ["USER_LOGIN", "USER_LOGOUT", "AI_MODE_TOGGLED","INVENTORY_UPDATED","CREATE_EVOLUTION_INSTANCE"].includes(action)
    ? await prismaClient.users.findUnique({
        where: { id: userId },
          select: {
            username: true,
            mobile: true,
            pharmacies: { select: { pharmacy_name: true } },
          }
      })
    : null;
  const notificationUsername = actor?.username || username;
  const notificationMobile = actor?.mobile || metadata?.user_mobile || "";
    const notificationPharmacy = actor?.pharmacies?.pharmacy_name || metadata?.pharmacy_name || "";

  // 3. Process Notifications for each role
  const t = translations[locale][action] || { title: action, body: JSON.stringify(metadata) };
  const localizedTitle = t.title;
  const localizedBody = t.body
    .replace('{username}', notificationUsername)
    .replace('{mobile}', notificationMobile)
    .replace('{pharmacy}', notificationPharmacy)
    .replace('{contactName}', metadata?.contact_name || metadata?.from || '')
    .replace('{contactNumber}', metadata?.contact_number || metadata?.from || '')
    .replace('{details}', typeof metadata === 'string' ? metadata : JSON.stringify(metadata));

  for (const role of targetRoles) {
    // Map TargetRole enum to numeric role_id
    const roleIdMap: Record<TargetRole, number> = {
      SUPER_ADMIN: 1,
      ADMIN: 2,
      USER: 3
    };

    // Find users with this role in this pharmacy (or all users if role is SUPER_ADMIN)
    const targetUsers = await prismaClient.users.findMany({
      where: {
        role_id: roleIdMap[role],
        ...(role !== TargetRole.SUPER_ADMIN && resolvedPharmacyId ? { pharmacy_id: resolvedPharmacyId } : {})
      },
      select: { id: true }
    });

    // Send to each user
    for (const user of targetUsers) {
      await sendPushNotification({
        userId: user.id,
        pharmacyId: resolvedPharmacyId,
        title: localizedTitle,
        body: localizedBody,
        type: notification_type,
        targetRole: role,
        data: notification_type === NotificationType.SYSTEM_ERROR
          ? (typeof metadata === 'string' ? metadata : metadata?.error || '')
          : { action, ...(metadata && typeof metadata === 'object' ? metadata : {}) }
      });
    }
  }
};