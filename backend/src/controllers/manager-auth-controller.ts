import { Request, Response, NextFunction } from 'express';
import { generateOtp, saveOtp, verifyOtp } from '../services/otp-service.js';
import { sendSms } from '../services/twilio-sms-service.js';
import { generateToken } from '../utils/jwt-utils.js';
import { sendSuccess } from '../utils/response-utils.js';
import { AppError } from '../middleware/error-handler-middleware.js';

export const sendCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      throw new AppError('Phone number required', 400);
    }

    const otp = generateOtp();
    await saveOtp(phoneNumber, otp);
    
    // In development, log the OTP instead of sending SMS
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);
    } else {
      await sendSms(phoneNumber, `Your access code is: ${otp}`);
    }

    sendSuccess(res, { codeSent: true }, 'Access code sent');
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
    const { phoneNumber, accessCode } = req.body;

    if (!phoneNumber || !accessCode) {
      throw new AppError('Phone number and access code required', 400);
    }

    const result = await verifyOtp(phoneNumber, accessCode);

    if (!result.valid || !result.userId) {
      throw new AppError('Invalid or expired access code', 401);
    }

    const token = generateToken({
      userId: result.userId,
      role: 'manager',
      phoneNumber,
    });

    sendSuccess(res, { token }, 'Authentication successful');
  } catch (error) {
    next(error);
  }
};
