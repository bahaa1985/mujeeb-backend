import { prismaClient } from '../../utils/prisma-adapter';
import { logAndNotify } from '../logs/log.service';

export class SubscriptionService {
  private async getPharmacyId(subscriptionId: number): Promise<number | null> {
    try {
      const subscription = await prismaClient.subscriptions.findUnique({
        where: { id: subscriptionId },
        select: { pharmacy_id: true },
      });
      return subscription?.pharmacy_id ?? null;
    } catch {
      return null;
    }
  }

  private reportError(error: any, errorTitle: string, pharmacyId: number | null = null) {
    logAndNotify({
      userId: 0,
      pharmacyId,
      action: 'APP_ERROR',
      metadata: {
        error_title: errorTitle,
        error: error?.message || String(error),
        stack: error?.stack,
        context: 'SubscriptionService',
      },
    }).catch((loggingError) => console.error('Failed to log subscription error:', loggingError));
  }

  // 1. إنشاء اشتراك جديد (التريجر في الداتابيز سيتولى إنهاء القديم وتصفير العدادات)
  async createSubscription(pharmacyId: number, planId: number) {
    try {
      const billDue = new Date();
      if(planId === 1){
      billDue.setDate(billDue.getDate() + 7);
      }
      else{
      billDue.setMonth(billDue.getMonth() + 1);
      }
      // console.log("billDue",billDue);

      return prismaClient.subscriptions.create({
        data: {
          pharmacy_id: pharmacyId,
          plan_id: planId,
          bill_due: billDue,
          subscription_state: 'ACTIVE',
          messages_used: 0,
          images_used: 0,
          next_month_paid: false,
        },
      });
    } catch (error: any) {
      this.reportError(error, 'Error creating subscription', pharmacyId);
      throw error;
    }
  }

  // 2. تجديد الاشتراك يدوياً وأرشفة الشهر القديم
  async renewSubscription(subscriptionId: number, pharmacyId?: number) {
    try {
      const sub = await prismaClient.subscriptions.findFirst({
        where: { id: subscriptionId, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) },
      });

      if (!sub) throw new Error('Subscription not found');

    // نقل بيانات الشهر الحالي إلى سجلات الأرشيف
    await prismaClient.monthly_subscription_logs.create({
      data: {
        pharmacy_plan_id: sub.id,
        billing_month: sub.bill_due,
        messages_used: sub.messages_used,
        images_used: sub.images_used,
        amount_paid: 0, // يمكن تعديلها حسب نظام الدفع لديك
        discount: 0,
      },
    });

    // تحديث تاريخ الاستحقاق وتصفير العدادات وتفعيل الاشتراك
      return prismaClient.subscriptions.update({
        where: { id: subscriptionId, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) },
        data: {
          bill_due: new Date(new Date(sub.bill_due).setMonth(new Date(sub.bill_due).getMonth() + 1)),
          messages_used: 0,
          images_used: 0,
          next_month_paid: false,
          subscription_state: 'ACTIVE',
        },
      });
    } catch (error: any) {
      this.reportError(error, 'Failed to renew subscription', await this.getPharmacyId(subscriptionId));
      throw error;
    }
  }

  // 3. تعليق الاشتراك
  async suspendSubscription(subscriptionId: number, pharmacyId?: number) {
    try {
      return prismaClient.subscriptions.update({
        where: { id: subscriptionId, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) },
        data: { subscription_state: 'SUSPENDED' },
      });
    } catch (error: any) {
      this.reportError(error, 'Failed to suspend subscription', await this.getPharmacyId(subscriptionId));
      throw error;
    }
  }

  // 4. تفعيل الاشتراك
  async activateSubscription(subscriptionId: number, pharmacyId?: number) {
    try {
      return prismaClient.subscriptions.update({
        where: { id: subscriptionId, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) },
        data: { subscription_state: 'ACTIVE' },
      });
    } catch (error: any) {
      this.reportError(error, 'Failed to activate subscription', await this.getPharmacyId(subscriptionId));
      throw error;
    }
  }

  // 5. تبديل حالة دفع الشهر القادم
  async toggleNextMonthPaid(subscriptionId: number, pharmacyId?: number) {
    try {
      const sub = await prismaClient.subscriptions.findUnique({
        where: { id: subscriptionId, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) },
        select: { next_month_paid: true }
      });

      if (!sub) throw new Error('Subscription not found');

      return prismaClient.subscriptions.update({
        where: { id: subscriptionId, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) },
        data: { next_month_paid: !sub.next_month_paid },
      });
    } catch (error: any) {
      this.reportError(error, 'Failed to update subscription payment status', await this.getPharmacyId(subscriptionId));
      throw error;
    }
  }

  // 6. استعراض كل الاشتراكات مرتبة من الأحدث
  async listAllSubscriptions(pharmacyId?: number) {
    try {
      return prismaClient.subscriptions.findMany({
        where: pharmacyId ? { pharmacy_id: pharmacyId } : undefined,
        orderBy: { subscription_start: 'desc' },
        include: {
          pharmacies: true,
          plans: true,
        },
      });
    } catch (error: any) {
      this.reportError(error, 'Error listing subscriptions');
      throw error;
    }
  }
}