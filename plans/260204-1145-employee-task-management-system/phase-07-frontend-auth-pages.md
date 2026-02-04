# Phase 07: Frontend Auth Pages

## Context Links

- [Parent Plan](./plan.md)
- [Phase 06: Real-time Chat](./phase-06-realtime-chat-socketio.md)
- [Frontend Research](./research/researcher-02-vite-react-frontend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 4h |
| Implementation Status | pending |
| Review Status | pending |

Build frontend authentication pages for manager (phone + OTP) and employee (email + OTP) with auth context and protected routes.

## Key Insights

- React Context for global auth state
- JWT stored in localStorage
- Axios interceptor for automatic auth headers
- Protected route wrapper redirects unauthenticated users
- react-hook-form + zod for form validation

## Requirements

### Functional
- Manager login page (phone input)
- OTP verification page
- Employee login page (email input)
- Employee setup page (from invitation link)
- Auth context provides user state globally
- Protected routes redirect to login

### Non-Functional
- Form validation with clear error messages
- Loading states during API calls
- Persist auth across page refreshes

## Architecture

```
App
├── AuthProvider (Context)
│   ├── Public Routes
│   │   ├── /login (Manager)
│   │   ├── /login/employee (Employee)
│   │   ├── /verify (OTP)
│   │   └── /setup (Employee Setup)
│   └── Protected Routes
│       ├── /dashboard (Manager)
│       └── /employee/dashboard (Employee)
```

### Data Flow
1. User submits credentials
2. API returns JWT on success
3. Token stored in localStorage
4. AuthContext updated with user
5. Axios interceptor adds token to requests
6. Protected routes check auth state

## Related Code Files

### Files to Create
- `frontend/src/contexts/auth-context.tsx`
- `frontend/src/hooks/use-auth.ts`
- `frontend/src/services/api-client.ts`
- `frontend/src/services/auth-service.ts`
- `frontend/src/components/protected-route.tsx`
- `frontend/src/pages/manager-login-page.tsx`
- `frontend/src/pages/employee-login-page.tsx`
- `frontend/src/pages/otp-verify-page.tsx`
- `frontend/src/pages/employee-setup-page.tsx`
- `frontend/src/lib/validation-schemas.ts`

### Files to Modify
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`

## Implementation Steps

### 1. Create API Client

`frontend/src/services/api-client.ts`:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Create Auth Service

`frontend/src/services/auth-service.ts`:
```typescript
import apiClient from './api-client';

interface SendCodeResponse {
  success: boolean;
  data: { codeSent: boolean };
  message: string;
}

interface VerifyCodeResponse {
  success: boolean;
  data: { token: string };
  message: string;
}

interface ValidateTokenResponse {
  success: boolean;
  data: { name: string; email: string };
}

export const managerSendCode = async (phoneNumber: string) => {
  const response = await apiClient.post<SendCodeResponse>(
    '/api/auth/manager/send-code',
    { phoneNumber }
  );
  return response.data;
};

export const managerVerifyCode = async (phoneNumber: string, accessCode: string) => {
  const response = await apiClient.post<VerifyCodeResponse>(
    '/api/auth/manager/verify-code',
    { phoneNumber, accessCode }
  );
  return response.data;
};

export const employeeSendCode = async (email: string) => {
  const response = await apiClient.post<SendCodeResponse>(
    '/api/auth/employee/send-code',
    { email }
  );
  return response.data;
};

export const employeeVerifyCode = async (email: string, accessCode: string) => {
  const response = await apiClient.post<VerifyCodeResponse>(
    '/api/auth/employee/verify-code',
    { email, accessCode }
  );
  return response.data;
};

export const validateSetupToken = async (token: string) => {
  const response = await apiClient.get<ValidateTokenResponse>(
    `/api/auth/employee/validate-token?token=${token}`
  );
  return response.data;
};

export const completeSetup = async (token: string, name: string) => {
  const response = await apiClient.post('/api/auth/employee/setup', { token, name });
  return response.data;
};
```

### 3. Create Auth Context

`frontend/src/contexts/auth-context.tsx`:
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  userId: string;
  role: 'manager' | 'employee';
  phoneNumber?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<User>(storedToken);
        setUser(decoded);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    const decoded = jwtDecode<User>(newToken);
    setUser(decoded);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
```

### 4. Create Protected Route

`frontend/src/components/protected-route.tsx`:
```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('manager' | 'employee')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### 5. Create Validation Schemas

`frontend/src/lib/validation-schemas.ts`:
```typescript
import { z } from 'zod';

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s-]+$/, 'Invalid phone number format'),
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const otpSchema = z.object({
  accessCode: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must be numbers only'),
});

export const setupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;
export type EmailFormData = z.infer<typeof emailSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type SetupFormData = z.infer<typeof setupSchema>;
```

### 6. Create Manager Login Page

`frontend/src/pages/manager-login-page.tsx`:
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { phoneSchema, PhoneFormData } from '@/lib/validation-schemas';
import { managerSendCode } from '@/services/auth-service';

export const ManagerLoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const onSubmit = async (data: PhoneFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await managerSendCode(data.phoneNumber);
      navigate('/verify', {
        state: { phoneNumber: data.phoneNumber, role: 'manager' }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Manager Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                {...register('phoneNumber')}
                placeholder="Phone Number"
                type="tel"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Access Code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 7. Create OTP Verify Page

`frontend/src/pages/otp-verify-page.tsx`:
```typescript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { otpSchema, OtpFormData } from '@/lib/validation-schemas';
import { managerVerifyCode, employeeVerifyCode } from '@/services/auth-service';
import { useAuth } from '@/contexts/auth-context';

export const OtpVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { phoneNumber, email, role } = location.state || {};

  const { register, handleSubmit, formState: { errors } } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    setError('');

    try {
      let response;
      if (role === 'manager') {
        response = await managerVerifyCode(phoneNumber, data.accessCode);
      } else {
        response = await employeeVerifyCode(email, data.accessCode);
      }

      login(response.data.token);
      navigate(role === 'manager' ? '/dashboard' : '/employee/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!phoneNumber && !email) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter Access Code</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Code sent to {phoneNumber || email}
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                {...register('accessCode')}
                placeholder="6-digit code"
                maxLength={6}
              />
              {errors.accessCode && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.accessCode.message}
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 8. Create Employee Login Page

`frontend/src/pages/employee-login-page.tsx`:
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { emailSchema, EmailFormData } from '@/lib/validation-schemas';
import { employeeSendCode } from '@/services/auth-service';

export const EmployeeLoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await employeeSendCode(data.email);
      navigate('/verify', {
        state: { email: data.email, role: 'employee' }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Employee Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                {...register('email')}
                placeholder="Email Address"
                type="email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Access Code'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 9. Create Employee Setup Page

`frontend/src/pages/employee-setup-page.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { setupSchema, SetupFormData } from '@/lib/validation-schemas';
import { validateSetupToken, completeSetup } from '@/services/auth-service';

export const EmployeeSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [employeeData, setEmployeeData] = useState<{ name: string; email: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid setup link');
        setIsLoading(false);
        return;
      }

      try {
        const response = await validateSetupToken(token);
        setEmployeeData(response.data);
        setValue('name', response.data.name);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired link');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token, setValue]);

  const onSubmit = async (data: SetupFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    setError('');

    try {
      await completeSetup(token, data.name);
      navigate('/login/employee', {
        state: { message: 'Account setup complete! Please login.' }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Setup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error && !employeeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Account Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Email: {employeeData?.email}
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                {...register('name')}
                placeholder="Your Name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 10. Update App Router

`frontend/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { ManagerLoginPage } from './pages/manager-login-page';
import { EmployeeLoginPage } from './pages/employee-login-page';
import { OtpVerifyPage } from './pages/otp-verify-page';
import { EmployeeSetupPage } from './pages/employee-setup-page';
// Dashboard pages will be added in later phases

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<ManagerLoginPage />} />
      <Route path="/login/employee" element={<EmployeeLoginPage />} />
      <Route path="/verify" element={<OtpVerifyPage />} />
      <Route path="/setup" element={<EmployeeSetupPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <div>Manager Dashboard (Phase 8)</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <div>Employee Dashboard (Phase 10)</div>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          user?.role === 'manager' ? (
            <Navigate to="/dashboard" />
          ) : user?.role === 'employee' ? (
            <Navigate to="/employee/dashboard" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## Todo List

- [ ] Install jwt-decode package
- [ ] Create API client with interceptors
- [ ] Create auth service functions
- [ ] Create auth context
- [ ] Create protected route component
- [ ] Create validation schemas
- [ ] Create manager login page
- [ ] Create employee login page
- [ ] Create OTP verify page
- [ ] Create employee setup page
- [ ] Update App with routes
- [ ] Test manager login flow
- [ ] Test employee setup flow
- [ ] Test employee login flow
- [ ] Test protected route redirect

## Success Criteria

- [ ] Manager can login with phone + OTP
- [ ] Employee can complete setup via link
- [ ] Employee can login with email + OTP
- [ ] JWT token stored in localStorage
- [ ] Protected routes redirect unauthenticated users
- [ ] Form validation shows errors
- [ ] Loading states display during API calls

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Token expiry during session | Medium | Medium | Implement refresh or re-auth |
| localStorage not available | Low | High | Fallback to session storage |
| Race condition on auth check | Low | Medium | Loading state prevents flash |

## Security Considerations

- Clear token on 401 response
- Validate token format before storing
- Secure routes check role
- Don't expose token in URL params

## Next Steps

After completion:
1. Proceed to [Phase 08: Manager Dashboard UI](./phase-08-manager-dashboard-ui.md)
2. Test complete auth flows
