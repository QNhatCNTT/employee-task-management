import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { getDb } from '../config/firebase-admin-config.js';
import { sendSuccess, sendError } from '../utils/response-utils.js';
import { AuthenticatedRequest } from '../types/express-types.js';
import { Timestamp } from 'firebase-admin/firestore';

const router = Router();

router.use(authMiddleware);

// Get my profile (employee)
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('employees')
      .where('userId', '==', req.userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return sendError(res, 'Profile not found', 404);
    }

    const employee = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
});

// Update my profile
router.put('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, phone } = req.body;
    const db = getDb();

    const snapshot = await db
      .collection('employees')
      .where('userId', '==', req.userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return sendError(res, 'Profile not found', 404);
    }

    const updates: any = { updatedAt: Timestamp.now() };
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    await snapshot.docs[0].ref.update(updates);

    // Also update user record
    await db.collection('users').doc(req.userId!).update({
      name: name || snapshot.docs[0].data().name,
      updatedAt: Timestamp.now(),
    });

    sendSuccess(res, { ...snapshot.docs[0].data(), ...updates });
  } catch (error) {
    next(error);
  }
});

export default router;
