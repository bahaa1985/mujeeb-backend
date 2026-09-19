import { Request, Response } from 'express';
import { SubscriptionService } from './subscriptions.service';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  // 1. إنشاء أو تحديث خطة
  async createPlanController(req: Request, res: Response) {
    try {
      const planId = req.params.id ? parseInt(req.params.id.toString()) : undefined;
      const { name, price, messages_limit } = req.body;
      const plan = await subscriptionService.upsertPlan(planId, { name, price, messages_limit });
      return res.status(200).json({ success: true, data: plan });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. إنشاء اشتراك جديد
  async createSubscriptionController(req: Request, res: Response) {
    try {
      const { pharmacy_id, plan_id, bill_due } = req.body;
      const subscription = await subscriptionService.createSubscription(
        pharmacy_id,
        plan_id,
        new Date(bill_due)
      );
      return res.status(201).json({ success: true, data: subscription });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. تجديد الاشتراك
  async renewSubscriptionController(req: Request, res: Response) {
    try {
      const subscriptionId = parseInt(req.params.id.toString());
      const updated = await subscriptionService.renewSubscription(subscriptionId);
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. تعليق الاشتراك
  async suspendSubscriptionController(req: Request, res: Response) {
    try {
      const subscriptionId = parseInt(req.params.id.toString());
      const suspended = await subscriptionService.suspendSubscription(subscriptionId);
      return res.status(200).json({ success: true, data: suspended });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 5. تفعيل الاشتراك
  async activateSubscription(req: Request, res: Response) {
    try {
      const subscriptionId = parseInt(req.params.id.toString());
      const activated = await subscriptionService.activateSubscription(subscriptionId);
      return res.status(200).json({ success: true, data: activated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 6. تبديل حالة دفع الشهر القادم
  async toggleNextMonthPaidController(req: Request, res: Response) {
    try {
      const subscriptionId = parseInt(req.params.id.toString());
      const updated = await subscriptionService.toggleNextMonthPaid(subscriptionId);
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 7. سرد جميع الاشتراكات مرتبة بالأحدث
  async listSubscriptionsController(req: Request, res: Response) {
    try {
      const subscriptions = await subscriptionService.listAllSubscriptions();
      return res.status(200).json({ success: true, data: subscriptions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}