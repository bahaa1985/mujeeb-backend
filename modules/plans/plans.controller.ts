import { Request, Response } from 'express';
import { PlanInput, PlansService } from './plans.service';

const plansService = new PlansService();

const parsePlanInput = (body: unknown): PlanInput | null => {
  if (!body || typeof body !== 'object') return null;

  const values = body as Record<string, unknown>;
  const input: PlanInput = {
    name: typeof values.name === 'string' ? values.name.trim() : '',
    price: Number(values.price),
    messages_limit: Number(values.messages_limit),
    images_limit: Number(values.images_limit),
    common_replies: values.common_replies as boolean,
    order_notification: values.order_notification as boolean,
    basic_dashboard: values.basic_dashboard as boolean,
    advanced_dashboard: values.advanced_dashboard as boolean,
  };

  const validIntegers = Number.isInteger(input.messages_limit) &&
    input.messages_limit >= 0 &&
    Number.isInteger(input.images_limit) &&
    input.images_limit >= 0;
  const validBooleans = [
    input.common_replies,
    input.order_notification,
    input.basic_dashboard,
    input.advanced_dashboard,
  ].every((value) => typeof value === 'boolean');

  if (!input.name || !Number.isFinite(input.price) || input.price < 0 || !validIntegers || !validBooleans) {
    return null;
  }

  return input;
};

export class PlansController {
  async listPlans(_req: Request, res: Response) {
    try {
      const plans = await plansService.listPlans();
      return res.status(200).json({ success: true, data: plans });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createPlan(req: Request, res: Response) {
    const data = parsePlanInput(req.body);
    if (!data) {
      return res.status(400).json({ success: false, message: 'Invalid plan data' });
    }

    try {
      const plan = await plansService.createPlan(data);
      return res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePlan(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = parsePlanInput(req.body);
    if (!Number.isInteger(id) || id <= 0 || !data) {
      return res.status(400).json({ success: false, message: 'Invalid plan id or data' });
    }

    try {
      const plan = await plansService.updatePlan(id, data);
      return res.status(200).json({ success: true, data: plan });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Plan not found' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}