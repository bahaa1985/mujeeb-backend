import { prismaClient } from '../../utils/prisma-adapter';

export interface PlanInput {
  name: string;
  price: number;
  messages_limit: number;
  images_limit: number;
  common_replies: boolean;
  order_notification: boolean;
  basic_dashboard: boolean;
  advanced_dashboard: boolean;
}

export class PlansService {
  async listPlans() {
    return prismaClient.plans.findMany({ orderBy: { id: 'asc' } });
  }

  async createPlan(data: PlanInput) {
    return prismaClient.plans.create({ data });
  }

  async updatePlan(id: number, data: PlanInput) {
    return prismaClient.plans.update({ where: { id }, data });
  }
}