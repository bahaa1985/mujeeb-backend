import { Request, Response } from 'express';
import { SubscriptionService } from './subscriptions.service';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  // 1. إنشاء اشتراك جديد
  async createSubscriptionController(req: Request, res: Response) {
    try {
      const { plan_id } = req.body;
      const user = (req as any).user;
      const pharmacy_id = Number(user.role_id) === 1 ? req.body.pharmacy_id : user.pharmacy_id;
      // console.log("subscription body",req.body);
      
      const subscription = await subscriptionService.createSubscription(
        pharmacy_id,
        plan_id
      );
      return res.status(201).json({ success: true, data: subscription });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. تجديد الاشتراك
  async renewSubscriptionController(req: Request, res: Response) {
    try {
      const subscriptionId = parseInt(req.params.id.toString());
      const updated = await subscriptionService.renewSubscription(subscriptionId, this.getTenantPharmacyId(req));
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. تعليق الاشتراك
  async suspendSubscriptionController(req: Request, res: Response) {
    try {
      const subscriptionId = parseInt(req.params.id.toString());
      const suspended = await subscriptionService.suspendSubscription(subscriptionId, this.getTenantPharmacyId(req));
      return res.status(200).json({ success: true, data: suspended });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. تفعيل الاشتراك
  async activateSubscription(req: Request, res: Response) {
    try {
      const subscriptionId = parseInt(req.params.id.toString());
      const activated = await subscriptionService.activateSubscription(subscriptionId, this.getTenantPharmacyId(req));
      return res.status(200).json({ success: true, data: activated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 5. تبديل حالة دفع الشهر القادم
  async toggleNextMonthPaidController(req: Request, res: Response) {
    try {
      const subscriptionId = parseInt(req.params.id.toString());
      const updated = await subscriptionService.toggleNextMonthPaid(subscriptionId, this.getTenantPharmacyId(req));
      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // 6. سرد جميع الاشتراكات مرتبة بالأحدث
  async listSubscriptionsController(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const subscriptions = await subscriptionService.listAllSubscriptions(
        Number(user.role_id) === 1 ? undefined : Number(user.pharmacy_id)
      );
      return res.status(200).json({ success: true, data: subscriptions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  private getTenantPharmacyId(req: Request) {
    const user = (req as any).user;
    return Number(user.role_id) === 1 ? undefined : Number(user.pharmacy_id);
  }
}