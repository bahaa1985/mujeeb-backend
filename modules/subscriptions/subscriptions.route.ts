import { Router } from 'express';
import { SubscriptionController } from './subscriptions.controller';
import { authenticateToken } from '../../middleware/authenticateToken';

const controller = new SubscriptionController();
export const SUBSCRIPTION_ROUTER = Router();
SUBSCRIPTION_ROUTER.use(authenticateToken);

// مسارات الاشتراكات (Subscriptions)
SUBSCRIPTION_ROUTER.post('/create', controller.createSubscriptionController);
SUBSCRIPTION_ROUTER.get('/list', controller.listSubscriptionsController);
SUBSCRIPTION_ROUTER.post('/:id/renew', controller.renewSubscriptionController);
SUBSCRIPTION_ROUTER.post('/:id/suspend', controller.suspendSubscriptionController);
SUBSCRIPTION_ROUTER.post('/:id/activate', controller.activateSubscription);
SUBSCRIPTION_ROUTER.post('/:id/toggle-next-month-paid', controller.toggleNextMonthPaidController);
