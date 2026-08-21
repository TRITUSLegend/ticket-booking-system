import { Router, RequestHandler } from 'express';
import * as adminController from './admin.controller';
import { authGuard, roleGuard } from '../../middleware';

const router = Router();

router.get(
  '/stats',
  authGuard as RequestHandler,
  roleGuard('ADMIN') as RequestHandler,
  adminController.getStats as RequestHandler
);

export default router;
