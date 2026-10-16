import { prismaClient } from './prisma-adapter'; // مسار الداتابيز بتاعك
import { sendPushToTokens } from './sendPushToTokens';

// تأكد من استدعاء الـ Types الصحيحة اللي عملتها في Prisma
import { NotificationType, TargetRole } from '@prisma/client'; 

interface SendNotificationParams {
  userId: number;
  pharmacyId?: number | number | null;
  title: string;
  body: string;
  type: NotificationType;
  targetRole: TargetRole;
  data?: any; // أي بيانات إضافية زي رقم الطلب
}

export const sendPushNotification = async (params: SendNotificationParams) => {
  try {
    const { userId, pharmacyId, title, body, type, targetRole, data } = params;
    // console.log("sendPushNotification is fired!",params)
        // 1. تسجيل الإشعار في قاعدة البيانات
    await prismaClient.notification.create({
      data: {
        user_id: userId,
        pharmacy_id: pharmacyId||1,
        title,
        body,
        type,
        target_role: targetRole,
        data: type === NotificationType.SYSTEM_ERROR
          ? (typeof data === 'string' ? data : data?.error || '')
          : data || {},
      },
    });

    // 2. جلب أجهزة المستخدم (الـ Tokens) من قاعدة البيانات
    const user = await prismaClient.users.findUnique({
      where: { id: userId },
      select: { fcm_token: true },
    });

    // لو المستخدم معندوش أجهزة مسجلة، بنكتفي بالحفظ في الداتابيز ونخرج
    if (!user || !user.fcm_token || user.fcm_token.length === 0) {
      return { success: true, message: "Saved to DB, no FCM tokens found" };
    }

    const response = await sendPushToTokens(user.fcm_token, { title, body }, {
      payload: data ? JSON.stringify(data) : "",
      type: String(type),
    });
    
    return { success: true, pushResponse: response };

  } catch (error) {
    console.error("Error in sendPushNotification:", error);
    return { success: false, error };
  }
};