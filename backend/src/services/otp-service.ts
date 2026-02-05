import crypto from 'crypto';
import { userEntity } from '../entities/user.entity';
import { employeeEntity } from '../entities/employee.entity';
import { authEntity } from '../entities/auth.entity';

const OTP_EXPIRY_MINUTES = 5;

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Phone OTP methods (for managers)
export const saveOtp = async (
  phoneNumber: string,
  otp: string
): Promise<void> => {
  // Find or create user by phone
  const existingUser = await userEntity.findByPhone(phoneNumber);

  if (existingUser) {
    // Save OTP using authEntity with the provided OTP
    await authEntity.createOtp(existingUser.id!, phoneNumber, undefined, otp);
  } else {
    // Create new manager user
    const userId = await userEntity.createManager(phoneNumber, '');
    // Save OTP using authEntity with the provided OTP
    await authEntity.createOtp(userId, phoneNumber, undefined, otp);
  }
};

export const verifyOtp = async (
  phoneNumber: string,
  otp: string
): Promise<{ valid: boolean; userId?: string }> => {
  const user = await userEntity.findByPhone(phoneNumber);

  if (!user || !user.id) {
    return { valid: false };
  }

  const result = await authEntity.verifyOtp(user.id, otp);

  if (result.valid) {
    return { valid: true, userId: user.id };
  }

  return { valid: false };
};

// Email OTP methods (for employees)
export const saveOtpByEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const user = await userEntity.findByEmail(email);

  if (!user || !user.id) {
    throw new Error('User not found');
  }

  // Save OTP using authEntity with the provided OTP
  await authEntity.createOtp(user.id, undefined, email, otp);
};

export const verifyOtpByEmail = async (
  email: string,
  otp: string
): Promise<{ valid: boolean; userId?: string; employeeId?: string }> => {
  const user = await userEntity.findByEmail(email);

  if (!user || !user.id) {
    return { valid: false };
  }

  const result = await authEntity.verifyOtp(user.id, otp);

  if (result.valid) {
    // Also find the employee to return employee ID
    const employee = await employeeEntity.findByEmail(email);
    return { 
      valid: true, 
      userId: user.id,
      employeeId: employee?.id 
    };
  }

  return { valid: false };
};
