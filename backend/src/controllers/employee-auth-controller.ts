import { Request, Response, NextFunction } from 'express';
import { getDb } from '../config/firebase-admin-config.js';
import { generateOtp, saveOtpByEmail, verifyOtpByEmail } from '../services/otp-service.js';
import { sendOtpEmail } from '../services/email-service.js';
import { generateToken } from '../utils/jwt-utils.js';
import { sendSuccess } from '../utils/response-utils.js';
import { AppError } from '../middleware/error-handler-middleware.js';
import { Timestamp } from 'firebase-admin/firestore';

export const validateSetupToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new AppError('Token required', 400);
    }

    const db = getDb();
    const snapshot = await db
      .collection('employees')
      .where('setupToken', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new AppError('Invalid token', 400);
    }

    const employee = snapshot.docs[0].data();

    if (employee.setupCompleted) {
      throw new AppError('Account already set up', 400);
    }

    if (employee.setupTokenExpiry && employee.setupTokenExpiry.toDate() < new Date()) {
      throw new AppError('Token expired', 400);
    }

    sendSuccess(res, {
      name: employee.name,
      email: employee.email,
    });
  } catch (error) {
    next(error);
  }
};

export const completeSetup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, name } = req.body;

    if (!token) {
      throw new AppError('Token required', 400);
    }

    const db = getDb();
    const snapshot = await db
      .collection('employees')
      .where('setupToken', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new AppError('Invalid token', 400);
    }

    const employeeDoc = snapshot.docs[0];
    const employee = employeeDoc.data();

    if (employee.setupCompleted) {
      throw new AppError('Account already set up', 400);
    }

    // Update employee
    await employeeDoc.ref.update({
      name: name || employee.name,
      setupCompleted: true,
      setupToken: null,
      setupTokenExpiry: null,
      updatedAt: Timestamp.now(),
    });

    // Update linked user
    await db.collection('users').doc(employee.userId).update({
      name: name || employee.name,
      updatedAt: Timestamp.now(),
    });

    sendSuccess(res, { success: true }, 'Account setup complete');
  } catch (error) {
    next(error);
  }
};

export const sendCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email required', 400);
    }

    // Verify employee exists and setup complete
    const db = getDb();
    const snapshot = await db
      .collection('employees')
      .where('email', '==', email)
      .where('setupCompleted', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new AppError('Account not found or setup incomplete', 400);
    }

    const otp = generateOtp();
    await saveOtpByEmail(email, otp);
    
    // In development, log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    } else {
      await sendOtpEmail(email, otp);
    }

    sendSuccess(res, { codeSent: true }, 'Access code sent to email');
  } catch (error) {
    next(error);
  }
};

export const verifyCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, accessCode } = req.body;

    if (!email || !accessCode) {
      throw new AppError('Email and access code required', 400);
    }

    const result = await verifyOtpByEmail(email, accessCode);

    if (!result.valid || !result.userId) {
      throw new AppError('Invalid or expired access code', 401);
    }

    const token = generateToken({
      userId: result.userId,
      role: 'employee',
      email,
    });

    sendSuccess(res, { token }, 'Authentication successful');
  } catch (error) {
    next(error);
  }
};
