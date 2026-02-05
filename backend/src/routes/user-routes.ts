import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware';
import * as userController from '../controllers/user-controller';

const router = Router();

router.use(authMiddleware);

router.get('/directory', userController.getDirectory);

export default router;
