import { Router, RequestHandler } from 'express';
import * as waitlistController from './waitlist.controller';
import { validate, authGuard, roleGuard } from '../../middleware';
import { joinWaitlistSchema, completeOfferSchema } from './waitlist.validation';

const router = Router();

router.post(
  '/join',
  authGuard as RequestHandler,
  roleGuard('CUSTOMER') as RequestHandler,
  validate(joinWaitlistSchema),
  waitlistController.join as RequestHandler
);

router.post(
  '/offer/complete',
  authGuard as RequestHandler,
  roleGuard('CUSTOMER') as RequestHandler,
  validate(completeOfferSchema),
  waitlistController.completeOffer as RequestHandler
);

export default router;
