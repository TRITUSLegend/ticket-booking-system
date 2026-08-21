import { Router } from 'express';
import * as authController from './auth.controller';
import { validate, authGuard } from '../../middleware';
import { registerSchema, loginSchema } from './auth.validation';

import { RequestHandler } from 'express';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authGuard as RequestHandler, authController.logout as RequestHandler);

export default router;
