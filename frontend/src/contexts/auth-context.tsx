import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface User {
  userId: string;
  role: 'manager' | 'employee';
  phoneNumber?: string;
  email?: string;
}

interface JwtPayload extends User {
  exp?: number;
  iat?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isTokenExpired: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkTokenValidity: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token expiry buffer - refresh 5 minutes before actual expiry
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;
// Check token every 1 minute
const TOKEN_CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Check if a JWT token is expired
 */
const isTokenExpired = (token: string, bufferMs = 0): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return false; // No expiry = never expires
    
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    return now >= (expiryTime - bufferMs);
  } catch {
    return true; // Invalid token = expired
  }
};

/**
 * Get remaining time until token expires (in ms)
 */
const getTokenRemainingTime = (token: string): number => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return Infinity;
    
    const expiryTime = decoded.exp * 1000;
    return Math.max(0, expiryTime - Date.now());
  } catch {
    return 0;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);

  /**
   * Validate and decode token
   */
  const validateAndSetToken = useCallback((storedToken: string): boolean => {
    try {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        console.warn('Token is expired');
        return false;
      }

      const decoded = jwtDecode<JwtPayload>(storedToken);
      setUser({
        userId: decoded.userId,
        role: decoded.role,
        phoneNumber: decoded.phoneNumber,
        email: decoded.email,
      });
      setToken(storedToken);
      setTokenExpired(false);
      return true;
    } catch (err) {
      console.error('Failed to decode token:', err);
      return false;
    }
  }, []);

  /**
   * Check if current token is still valid
   */
  const checkTokenValidity = useCallback((): boolean => {
    if (!token) return false;
    
    const expired = isTokenExpired(token, TOKEN_EXPIRY_BUFFER_MS);
    
    if (expired && !tokenExpired) {
      console.warn('Token will expire soon or is expired');
      setTokenExpired(true);
      // Auto-logout when token expires
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }
    
    return !expired;
  }, [token, tokenExpired]);

  // Initialize from stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const isValid = validateAndSetToken(storedToken);
      if (!isValid) {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, [validateAndSetToken]);

  // Periodic token validity check
  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(() => {
      checkTokenValidity();
    }, TOKEN_CHECK_INTERVAL_MS);

    // Also check immediately
    checkTokenValidity();

    // Log remaining time for debugging
    const remainingMs = getTokenRemainingTime(token);
    console.log(`Token expires in ${Math.floor(remainingMs / 60000)} minutes`);

    return () => clearInterval(intervalId);
  }, [token, checkTokenValidity]);

  const login = useCallback((newToken: string) => {
    const isValid = validateAndSetToken(newToken);
    if (isValid) {
      localStorage.setItem('token', newToken);
    } else {
      console.error('Attempted to login with invalid/expired token');
    }
  }, [validateAndSetToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setTokenExpired(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !tokenExpired,
        isLoading,
        isTokenExpired: tokenExpired,
        login,
        logout,
        checkTokenValidity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
