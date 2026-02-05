import { Router } from 'express';
import { sendCode, verifyCode } from '../controllers/manager-auth-controller';
import { authLimiter } from '../middleware/rate-limiter-middleware';

const router = Router();

router.post('/send-code', authLimiter, sendCode);
router.post('/verify-code', authLimiter, verifyCode);

export default router;
