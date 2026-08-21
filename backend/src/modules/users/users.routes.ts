import { Router } from 'express';
import * as usersController from './users.controller';
import { authGuard } from '../../middleware';
import { RequestHandler } from 'express';

const router = Router();

router.get('/profile', authGuard as RequestHandler, usersController.getProfile as RequestHandler);

export default router;
