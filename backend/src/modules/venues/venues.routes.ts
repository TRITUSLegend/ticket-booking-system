import { Router } from 'express';
import * as venuesController from './venues.controller';
import { validate, authGuard, roleGuard } from '../../middleware';
import { createVenueSchema, updateVenueCategoriesSchema } from './venues.validation';
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

router.put(
  '/:id/categories',
  authGuard as RequestHandler,
  roleGuard('ADMIN') as RequestHandler,
  validate(updateVenueCategoriesSchema),
  venuesController.updateCategories as RequestHandler
);

export default router;
