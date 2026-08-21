import { Router } from 'express';
import * as seatsController from './seats.controller';
import { validate, authGuard } from '../../middleware';
import { holdSeatsSchema, releaseSeatsSchema } from './seats.validation';
import { RequestHandler } from 'express';

const router = Router();

router.get('/:showId', seatsController.getShowSeats);

router.post(
  '/hold',
  authGuard as RequestHandler,
  validate(holdSeatsSchema),
  seatsController.holdSeats as RequestHandler
);

router.post(
  '/release',
  authGuard as RequestHandler,
  validate(releaseSeatsSchema),
  seatsController.releaseSeats as RequestHandler
);

export default router;
