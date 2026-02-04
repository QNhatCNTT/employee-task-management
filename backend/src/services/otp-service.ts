import crypto from 'crypto';
import { getDb } from '../config/firebase-admin-config.js';
import { Timestamp } from 'firebase-admin/firestore';

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
  const db = getDb();
  const hashedOtp = hashOtp(otp);
  const expiry = Timestamp.fromDate(
    new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  );

  // Find or create user by phone
  const usersRef = db.collection('users');
  const snapshot = await usersRef
    .where('phoneNumber', '==', phoneNumber)
    .limit(1)
    .get();

  if (snapshot.empty) {
    // Create new manager user
    await usersRef.add({
      phoneNumber,
      role: 'manager',
      name: '',
      accessCode: hashedOtp,
      accessCodeExpiry: expiry,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } else {
    // Update existing user
    await snapshot.docs[0].ref.update({
      accessCode: hashedOtp,
      accessCodeExpiry: expiry,
      updatedAt: Timestamp.now(),
    });
  }
};

export const verifyOtp = async (
  phoneNumber: string,
  otp: string
): Promise<{ valid: boolean; userId?: string }> => {
  const db = getDb();
  const hashedOtp = hashOtp(otp);

  const snapshot = await db
    .collection('users')
    .where('phoneNumber', '==', phoneNumber)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { valid: false };
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.accessCode !== hashedOtp) {
    return { valid: false };
  }

  if (data.accessCodeExpiry && data.accessCodeExpiry.toDate() < new Date()) {
    return { valid: false }; // Expired
  }

  // Clear OTP after successful verification
  await doc.ref.update({
    accessCode: '',
    accessCodeExpiry: null,
    updatedAt: Timestamp.now(),
  });

  return { valid: true, userId: doc.id };
};

// Email OTP methods (for employees)
export const saveOtpByEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const db = getDb();
  const hashedOtp = hashOtp(otp);
  const expiry = Timestamp.fromDate(
    new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  );

  const snapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('User not found');
  }

  await snapshot.docs[0].ref.update({
    accessCode: hashedOtp,
    accessCodeExpiry: expiry,
    updatedAt: Timestamp.now(),
  });
};

export const verifyOtpByEmail = async (
  email: string,
  otp: string
): Promise<{ valid: boolean; userId?: string }> => {
  const db = getDb();
  const hashedOtp = hashOtp(otp);

  const snapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { valid: false };
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.accessCode !== hashedOtp) {
    return { valid: false };
  }

  if (data.accessCodeExpiry && data.accessCodeExpiry.toDate() < new Date()) {
    return { valid: false };
  }

  await doc.ref.update({
    accessCode: '',
    accessCodeExpiry: null,
    updatedAt: Timestamp.now(),
  });

  return { valid: true, userId: doc.id };
};
