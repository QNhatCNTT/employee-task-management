import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

import { jwtDecode } from 'jwt-decode';

describe('Token Expiry Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe('Token validation', () => {
    it('should detect expired token', () => {
      const expiredPayload = {
        userId: 'test-user',
        role: 'manager',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      vi.mocked(jwtDecode).mockReturnValue(expiredPayload);

      const isExpired = (token: string): boolean => {
        try {
          const decoded = jwtDecode<{ exp?: number }>(token);
          if (!decoded.exp) return false;
          return Date.now() >= decoded.exp * 1000;
        } catch {
          return true;
        }
      };

      expect(isExpired('expired-token')).toBe(true);
    });

    it('should detect valid token', () => {
      const validPayload = {
        userId: 'test-user',
        role: 'manager',
        exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      };

      vi.mocked(jwtDecode).mockReturnValue(validPayload);

      const isExpired = (token: string): boolean => {
        try {
          const decoded = jwtDecode<{ exp?: number }>(token);
          if (!decoded.exp) return false;
          return Date.now() >= decoded.exp * 1000;
        } catch {
          return true;
        }
      };

      expect(isExpired('valid-token')).toBe(false);
    });

    it('should handle token without expiry', () => {
      const noExpiryPayload = {
        userId: 'test-user',
        role: 'manager',
      };

      vi.mocked(jwtDecode).mockReturnValue(noExpiryPayload);

      const isExpired = (token: string): boolean => {
        try {
          const decoded = jwtDecode<{ exp?: number }>(token);
          if (!decoded.exp) return false; // No expiry = never expires
          return Date.now() >= decoded.exp * 1000;
        } catch {
          return true;
        }
      };

      expect(isExpired('no-expiry-token')).toBe(false);
    });

    it('should treat invalid token as expired', () => {
      vi.mocked(jwtDecode).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const isExpired = (token: string): boolean => {
        try {
          const decoded = jwtDecode<{ exp?: number }>(token);
          if (!decoded.exp) return false;
          return Date.now() >= decoded.exp * 1000;
        } catch {
          return true;
        }
      };

      expect(isExpired('invalid-token')).toBe(true);
    });
  });
});
