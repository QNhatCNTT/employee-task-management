import { Request, Response, NextFunction } from 'express';
import { generateOtp, saveOtp, verifyOtp } from '../services/otp-service';
import { createSmsProvider } from '../providers/index';
import { generateToken } from '../utils/jwt-utils';
import { sendSuccess } from '../utils/response-utils';
import { AppError } from '../middleware/error-handler-middleware';

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

    // Use abstract SMS provider
    const smsProvider = createSmsProvider();
    await smsProvider.send(phoneNumber, `Your access code is: ${otp}`);

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

