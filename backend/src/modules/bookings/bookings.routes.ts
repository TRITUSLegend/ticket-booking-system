import { Router, RequestHandler } from 'express';
import * as bookingsController from './bookings.controller';
import { validate, authGuard, roleGuard } from '../../middleware';
import { checkoutSchema } from './bookings.validation';

const router = Router();

router.post(
  '/checkout',
  authGuard as RequestHandler,
  roleGuard('CUSTOMER') as RequestHandler,
  validate(checkoutSchema),
  bookingsController.checkout as RequestHandler
);

router.get(
  '/history',
  authGuard as RequestHandler,
  bookingsController.history as RequestHandler
);

router.post(
  '/:id/cancel',
  authGuard as RequestHandler,
  roleGuard('CUSTOMER') as RequestHandler,
  bookingsController.cancel as RequestHandler
);

export default router;
