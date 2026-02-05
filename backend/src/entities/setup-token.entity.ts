/**
 * SetupToken Entity
 * Represents setup_tokens collection in Firestore
 * Handles tokens for employee setup, password reset, email verification, etc.
 * Tokens can be revoked and replaced at any time.
 */

import { BaseEntity, BaseDocument } from './base.entity';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

export type SetupTokenType = 'employee_setup' | 'password_reset' | 'email_verification';
export type SetupTokenStatus = 'pending' | 'used' | 'revoked' | 'expired';

export interface SetupTokenDocument extends BaseDocument {
  userId: string;
  token: string;           // crypto random hex string
  type: SetupTokenType;
  status: SetupTokenStatus;
  metadata?: {
    email?: string;
    employeeId?: string;
    [key: string]: unknown;
  };
  expiresAt: Timestamp;
  usedAt?: Timestamp;
  revokedAt?: Timestamp;
}

const DEFAULT_EXPIRY_HOURS = 24;

export class SetupTokenEntity extends BaseEntity<SetupTokenDocument> {
  constructor() {
    super('setup_tokens');
  }

  /**
   * Generate a new setup token for a user
   */
  async createToken(
    userId: string,
    type: SetupTokenType,
    options?: {
      expiresInHours?: number;
      metadata?: SetupTokenDocument['metadata'];
    }
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Timestamp.fromDate(
      new Date(
        Date.now() + (options?.expiresInHours || DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000
      )
    );

    await this.create({
      userId,
      token,
      type,
      status: 'pending',
      metadata: options?.metadata,
      expiresAt,
    });

    return token;
  }

  /**
   * Find a valid (pending, not expired) token
   */
  async findValidToken(token: string): Promise<SetupTokenDocument | null> {
    const snapshot = await this.collection
      .where('token', '==', token)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check expiry
    if (data.expiresAt.toDate() < new Date()) {
      // Auto-mark as expired
      await this.update(doc.id, { status: 'expired' });
      return null;
    }

    return {
      id: doc.id,
      ...data,
    };
  }

  /**
   * Find all active tokens for a user
   */
  async findActiveTokensByUser(
    userId: string,
    type?: SetupTokenType
  ): Promise<SetupTokenDocument[]> {
    let query = this.collection
      .where('userId', '==', userId)
      .where('status', '==', 'pending');

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Mark token as used
   */
  async markAsUsed(id: string): Promise<boolean> {
    return this.update(id, {
      status: 'used',
      usedAt: Timestamp.now(),
    });
  }

  /**
   * Revoke a token (can be done by admin or user)
   */
  async revoke(id: string): Promise<boolean> {
    return this.update(id, {
      status: 'revoked',
      revokedAt: Timestamp.now(),
    });
  }

  /**
   * Revoke all active tokens for a user (useful for password reset flow)
   */
  async revokeAllByUser(userId: string, type?: SetupTokenType): Promise<number> {
    const tokens = await this.findActiveTokensByUser(userId, type);
    
    let count = 0;
    for (const token of tokens) {
      await this.revoke(token.id!);
      count++;
    }

    return count;
  }

  /**
   * Revoke and create new token (atomic replacement)
   */
  async replace(
    userId: string,
    type: SetupTokenType,
    options?: {
      expiresInHours?: number;
      metadata?: SetupTokenDocument['metadata'];
    }
  ): Promise<string> {
    // Revoke all existing tokens of this type
    await this.revokeAllByUser(userId, type);

    // Create new token
    return this.createToken(userId, type, options);
  }

  /**
   * Verify token and mark as used in one operation
   */
  async verifyAndConsume(token: string): Promise<{ valid: boolean; data?: SetupTokenDocument }> {
    const tokenData = await this.findValidToken(token);
    
    if (!tokenData) {
      return { valid: false };
    }

    // Mark as used
    await this.markAsUsed(tokenData.id!);

    return { valid: true, data: tokenData };
  }

  /**
   * Cleanup: Mark expired tokens
   * Can be called by a cron job or manually
   */
  async cleanupExpired(): Promise<number> {
    const now = Timestamp.now();
    
    const snapshot = await this.collection
      .where('status', '==', 'pending')
      .where('expiresAt', '<', now)
      .get();

    let count = 0;
    for (const doc of snapshot.docs) {
      await this.update(doc.id, { status: 'expired' });
      count++;
    }

    return count;
  }
}

export const setupTokenEntity = new SetupTokenEntity();
