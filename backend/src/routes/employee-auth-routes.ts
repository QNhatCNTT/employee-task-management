import { Router } from 'express';
import * as employeeAuthController from '../controllers/employee-auth-controller';
import { authLimiter } from '../middleware/rate-limiter-middleware';

const router = Router();

router.get('/validate-token', employeeAuthController.validateSetupToken);
router.post('/setup', employeeAuthController.completeSetup);
router.post('/send-code', authLimiter, employeeAuthController.sendCode);
router.post('/verify-code', authLimiter, employeeAuthController.verifyCode);

export default router;
