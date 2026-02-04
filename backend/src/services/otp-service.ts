import crypto from 'crypto';
import { getDb } from '../config/firebase-admin-config.js';
import { Timestamp } from 'firebase-admin/firestore';
import { FirestoreUser, FirestoreAuth } from '../types/firestore.js';

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

  let userId: string;

  if (snapshot.empty) {
    // Create new manager user
    const userData: FirestoreUser = {
      phoneNumber,
      role: 'manager',
      name: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const newUser = await usersRef.add(userData);
    userId = newUser.id;
  } else {
    // User exists
    userId = snapshot.docs[0].id;
  }

  // Save OTP to auth_codes collection linked to userId
  const authData: FirestoreAuth = {
    userId,
    phoneNumber,
    accessCode: hashedOtp,
    accessCodeExpiry: expiry,
    attempts: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await db.collection('auth_codes').doc(userId).set(authData);
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

  const userId = snapshot.docs[0].id;

  // Check auth_codes collection
  const authDoc = await db.collection('auth_codes').doc(userId).get();

  if (!authDoc.exists) {
    return { valid: false };
  }

  const authData = authDoc.data() as FirestoreAuth;

  if (authData.accessCode !== hashedOtp) {
    // Increment attempts? (Feature for later)
    return { valid: false };
  }

  if (authData.accessCodeExpiry.toDate() < new Date()) {
    return { valid: false }; // Expired
  }

  // Clear OTP after successful verification
  await authDoc.ref.delete();

  return { valid: true, userId };
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

  const userId = snapshot.docs[0].id;

  // Save OTP to auth_codes collection
  const authData: FirestoreAuth = {
    userId,
    email,
    accessCode: hashedOtp,
    accessCodeExpiry: expiry,
    attempts: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await db.collection('auth_codes').doc(userId).set(authData);
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

  const userId = snapshot.docs[0].id;

  // Check auth_codes collection
  const authDoc = await db.collection('auth_codes').doc(userId).get();

  if (!authDoc.exists) {
    return { valid: false };
  }

  const authData = authDoc.data() as FirestoreAuth;

  if (authData.accessCode !== hashedOtp) {
    return { valid: false };
  }

  if (authData.accessCodeExpiry.toDate() < new Date()) {
    return { valid: false };
  }

  // Clear OTP
  await authDoc.ref.delete();

  return { valid: true, userId };
};
