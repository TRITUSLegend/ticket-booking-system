import { Router } from 'express';
import * as venuesController from './venues.controller';
import { validate, authGuard, roleGuard } from '../../middleware';
import { createVenueSchema } from './venues.validation';
import { RequestHandler } from 'express';

const router = Router();

router.post(
  '/',
  authGuard as RequestHandler,
  roleGuard('ADMIN') as RequestHandler,
  validate(createVenueSchema),
  venuesController.create as RequestHandler
);

router.get('/', authGuard as RequestHandler, venuesController.list);
router.get('/:id', authGuard as RequestHandler, venuesController.getById);

export default router;
