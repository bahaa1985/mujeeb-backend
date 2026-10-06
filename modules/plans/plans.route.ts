import { Router } from 'express';
import { PlansController } from './plans.controller';

const controller = new PlansController();
export const PLANS_ROUTER = Router();

PLANS_ROUTER.get('/', controller.listPlans);
PLANS_ROUTER.post('/new', controller.createPlan);
PLANS_ROUTER.put('/:id', controller.updatePlan);