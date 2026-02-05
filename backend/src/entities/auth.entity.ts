/**
 * Auth Entity
 * Represents auth_codes collection in Firestore (OTP storage)
 */

import { BaseEntity, BaseDocument } from './base.entity';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

export interface AuthDocument extends BaseDocument {
  userId: string;
  phoneNumber?: string;
  email?: string;
  accessCode: string; // Hashed OTP
  accessCodeExpiry: Timestamp;
  attempts: number;
}

const OTP_EXPIRY_MINUTES = 5;

export class AuthEntity extends BaseEntity<AuthDocument> {
  constructor() {
    super('auth_codes');
  }

  async findByUserId(userId: string): Promise<AuthDocument | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return null;
    
    const data = doc.data()!;
    return {
      id: doc.id,
      userId: data.userId,
      phoneNumber: data.phoneNumber,
      email: data.email,
      accessCode: data.accessCode,
      accessCodeExpiry: data.accessCodeExpiry,
      attempts: data.attempts,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async createOtp(
    userId: string,
    phoneNumber?: string,
    email?: string,
    otpCode?: string
  ): Promise<string> {
    // Use provided OTP or generate a new one
    const otp = otpCode || Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const expiry = Timestamp.fromDate(
      new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
    );

    const authData: any = {
      userId,
      accessCode: hashedOtp,
      accessCodeExpiry: expiry,
      attempts: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (phoneNumber) {
      authData.phoneNumber = phoneNumber;
    }
    if (email) {
      authData.email = email;
    }

    await this.collection.doc(userId).set(authData);

    return otp; // Return the OTP (plain text for sending to user)
  }

  async verifyOtp(
    userId: string,
    otp: string
  ): Promise<{ valid: boolean; attempts?: number }> {
    const doc = await this.collection.doc(userId).get();
    
    if (!doc.exists) {
      return { valid: false };
    }

    const authData = doc.data()!;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (authData.accessCode !== hashedOtp) {
      // Increment attempts
      await this.collection.doc(userId).update({
        attempts: authData.attempts + 1,
        updatedAt: Timestamp.now(),
      });
      return { valid: false, attempts: authData.attempts + 1 };
    }

    if (authData.accessCodeExpiry.toDate() < new Date()) {
      return { valid: false };
    }

    // Clear OTP after successful verification
    await doc.ref.delete();
    return { valid: true };
  }

  async delete(userId: string): Promise<boolean> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return false;
    await doc.ref.delete();
    return true;
  }
}

export const authEntity = new AuthEntity();
