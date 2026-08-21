import { Router } from 'express';
import * as showsController from './shows.controller';
import { validate, authGuard, roleGuard } from '../../middleware';
import { createShowSchema } from './shows.validation';
import { RequestHandler } from 'express';

const router = Router();

router.post(
  '/',
  authGuard as RequestHandler,
  roleGuard('ORGANISER') as RequestHandler,
  validate(createShowSchema),
  showsController.create as RequestHandler
);

router.get('/:id', showsController.getById);
router.get('/event/:eventId', showsController.getByEvent);

export default router;
