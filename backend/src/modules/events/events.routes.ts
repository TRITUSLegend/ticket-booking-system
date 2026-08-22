import { Router } from 'express';
import * as eventsController from './events.controller';
import { validate, authGuard, roleGuard } from '../../middleware';
import { createEventSchema } from './events.validation';
import { RequestHandler } from 'express';

const router = Router();

router.post(
  '/',
  authGuard as RequestHandler,
  roleGuard('ORGANISER') as RequestHandler,
  validate(createEventSchema),
  eventsController.create as RequestHandler
);

router.get('/', eventsController.list);
router.get('/:id', eventsController.getById);

router.delete(
  '/:id',
  authGuard as RequestHandler,
  roleGuard('ORGANISER') as RequestHandler,
  eventsController.remove as RequestHandler
);

export default router;
