import { Router, RequestHandler } from 'express';
import * as organiserController from './organiser.controller';
import { authGuard, roleGuard } from '../../middleware';

const router = Router();

router.get(
  '/dashboard',
  authGuard as RequestHandler,
  roleGuard('ORGANISER') as RequestHandler,
  organiserController.getDashboard as RequestHandler
);

router.get(
  '/events/:id/summary',
  authGuard as RequestHandler,
  roleGuard('ORGANISER') as RequestHandler,
  organiserController.getEventSummary as RequestHandler
);

export default router;
