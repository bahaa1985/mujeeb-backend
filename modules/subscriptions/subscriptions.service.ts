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

  // 1. إنشاء أو تحديث الخطط (Plans)
  async upsertPlan(id: number | undefined, data: { name: string; price: number; messages_limit: number }) {
    try {
      if (id) {
        return prismaClient.plans.update({
          where: { id },
          data,
        });
      }
      return prismaClient.plans.create({ data });
    } catch (error: any) {
      this.reportError(error, 'Error saving subscription plan');
      throw error;
    }
  }

  // 2. إنشاء اشتراك جديد (التريجر في الداتابيز سيتولى إنهاء القديم وتصفير العدادات)
  async createSubscription(pharmacyId: number, planId: number, billDue: Date) {
    try {
      return prismaClient.subscriptions.create({
        data: {
          pharmacy_id: pharmacyId,
          plan_id: planId,
          bill_due: billDue,
          subscription_state: 'ACTIVE',
          messages_used: 0,
          images_count: 0,
          next_month_paid: false,
        },
      });
    } catch (error: any) {
      this.reportError(error, 'Error creating subscription', pharmacyId);
      throw error;
    }
  }

  // 3. تجديد الاشتراك يدوياً وأرشفة الشهر القديم
  async renewSubscription(subscriptionId: number) {
    try {
      const sub = await prismaClient.subscriptions.findUnique({
        where: { id: subscriptionId },
      });

      if (!sub) throw new Error('Subscription not found');

    // نقل بيانات الشهر الحالي إلى سجلات الأرشيف
    await prismaClient.monthly_subscription_logs.create({
      data: {
        pharmacy_plan_id: sub.id,
        billing_month: sub.bill_due,
        messages_used: sub.messages_used,
        images_count: sub.images_count,
        amount_paid: 0, // يمكن تعديلها حسب نظام الدفع لديك
        discount: 0,
      },
    });

    // تحديث تاريخ الاستحقاق وتصفير العدادات وتفعيل الاشتراك
      return prismaClient.subscriptions.update({
        where: { id: subscriptionId },
        data: {
          bill_due: new Date(new Date(sub.bill_due).setMonth(new Date(sub.bill_due).getMonth() + 1)),
          messages_used: 0,
          images_count: 0,
          next_month_paid: false,
          subscription_state: 'ACTIVE',
        },
      });
    } catch (error: any) {
      this.reportError(error, 'Failed to renew subscription', await this.getPharmacyId(subscriptionId));
      throw error;
    }
  }

  // 4. تعليق الاشتراك
  async suspendSubscription(subscriptionId: number) {
    try {
      return prismaClient.subscriptions.update({
        where: { id: subscriptionId },
        data: { subscription_state: 'SUSPENDED' },
      });
    } catch (error: any) {
      this.reportError(error, 'Failed to suspend subscription', await this.getPharmacyId(subscriptionId));
      throw error;
    }
  }

  // 5. تفعيل الاشتراك
  async activateSubscription(subscriptionId: number) {
    try {
      return prismaClient.subscriptions.update({
        where: { id: subscriptionId },
        data: { subscription_state: 'ACTIVE' },
      });
    } catch (error: any) {
      this.reportError(error, 'Failed to activate subscription', await this.getPharmacyId(subscriptionId));
      throw error;
    }
  }

  // 6. تبديل حالة دفع الشهر القادم
  async toggleNextMonthPaid(subscriptionId: number) {
    try {
      const sub = await prismaClient.subscriptions.findUnique({
        where: { id: subscriptionId },
        select: { next_month_paid: true }
      });

      if (!sub) throw new Error('Subscription not found');

      return prismaClient.subscriptions.update({
        where: { id: subscriptionId },
        data: { next_month_paid: !sub.next_month_paid },
      });
    } catch (error: any) {
      this.reportError(error, 'Failed to update subscription payment status', await this.getPharmacyId(subscriptionId));
      throw error;
    }
  }

  // 7. استعراض كل الاشتراكات مرتبة من الأحدث
  async listAllSubscriptions() {
    try {
      return prismaClient.subscriptions.findMany({
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