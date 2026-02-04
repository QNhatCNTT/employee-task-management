# Phase 10: Employee Dashboard UI

## Context Links

- [Parent Plan](./plan.md)
- [Phase 09: Chat Feature UI](./phase-09-chat-feature-ui.md)
- [Frontend Research](./research/researcher-02-vite-react-frontend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P2 - High |
| Effort | 3h |
| Implementation Status | pending |
| Review Status | pending |

Build employee dashboard with profile viewing/editing and chat with manager.

## Key Insights

- Simpler than manager dashboard (no CRUD)
- Employee can only chat with their manager
- Profile editing limited to non-sensitive fields
- Reuse chat components from Phase 09

## Requirements

### Functional
- Employee sees their profile information
- Employee can edit name and phone
- Employee can chat with their manager
- Logout functionality

### Non-Functional
- Simple, clean interface
- Loading states for data
- Toast notifications on updates

## Architecture

```
EmployeeDashboard
├── EmployeeLayout
│   ├── Sidebar (navigation)
│   └── Main Content
│       ├── ProfilePage
│       │   └── ProfileForm
│       └── ChatPage (reuse components)
```

### Routes
- `/employee/dashboard` - Profile page
- `/employee/chat` - Chat with manager

## Related Code Files

### Files to Create
- `frontend/src/services/profile-service.ts`
- `frontend/src/components/layout/employee-layout.tsx`
- `frontend/src/components/profile/profile-view.tsx`
- `frontend/src/components/profile/profile-edit-form.tsx`
- `frontend/src/pages/employee-dashboard-page.tsx`
- `frontend/src/pages/employee-chat-page.tsx`

### Files to Modify
- `frontend/src/App.tsx` (add routes)

## Implementation Steps

### 1. Create Profile Service

`frontend/src/services/profile-service.ts`:
```typescript
import apiClient from './api-client';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  managerId: string;
  schedule?: {
    workDays: string[];
    startTime: string;
    endTime: string;
  };
}

interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export const getMyProfile = async (): Promise<Profile> => {
  const response = await apiClient.get('/api/profile');
  return response.data.data;
};

export const updateMyProfile = async (input: UpdateProfileInput): Promise<Profile> => {
  const response = await apiClient.put('/api/profile', input);
  return response.data.data;
};
```

### 2. Add Profile Routes to Backend

Add to `backend/src/routes/profile-routes.ts`:
```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { getDb } from '../config/firebase-admin-config.js';
import { sendSuccess, sendError } from '../utils/response-utils.js';
import { AuthenticatedRequest } from '../types/express-types.js';
import { Timestamp } from 'firebase-admin/firestore';

const router = Router();

router.use(authMiddleware);

// Get my profile (employee)
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('employees')
      .where('userId', '==', req.userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return sendError(res, 'Profile not found', 404);
    }

    const employee = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
});

// Update my profile
router.put('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, phone } = req.body;
    const db = getDb();

    const snapshot = await db
      .collection('employees')
      .where('userId', '==', req.userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return sendError(res, 'Profile not found', 404);
    }

    const updates: any = { updatedAt: Timestamp.now() };
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    await snapshot.docs[0].ref.update(updates);

    // Also update user record
    await db.collection('users').doc(req.userId!).update({
      name: name || snapshot.docs[0].data().name,
      updatedAt: Timestamp.now(),
    });

    sendSuccess(res, { ...snapshot.docs[0].data(), ...updates });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### 3. Create Employee Layout

`frontend/src/components/layout/employee-layout.tsx`:
```typescript
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface EmployeeLayoutProps {
  children: ReactNode;
}

export const EmployeeLayout = ({ children }: EmployeeLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/employee/dashboard', label: 'My Profile' },
    { path: '/employee/chat', label: 'Chat with Manager' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-8">Employee Portal</h1>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded ${
                location.pathname === item.path
                  ? 'bg-gray-700'
                  : 'hover:bg-gray-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm text-gray-400 mb-2">{user?.email}</p>
          <Button variant="outline" onClick={logout} className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-gray-100">
        {children}
      </main>
    </div>
  );
};
```

### 4. Create Profile View

`frontend/src/components/profile/profile-view.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileViewProps {
  profile: {
    name: string;
    email: string;
    phone?: string;
    department: string;
    role: string;
    schedule?: {
      workDays: string[];
      startTime: string;
      endTime: string;
    };
  };
}

export const ProfileView = ({ profile }: ProfileViewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-gray-500">Name</label>
          <p className="font-medium">{profile.name}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Email</label>
          <p className="font-medium">{profile.email}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Phone</label>
          <p className="font-medium">{profile.phone || 'Not set'}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Department</label>
          <p className="font-medium">{profile.department}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Role</label>
          <p className="font-medium">{profile.role}</p>
        </div>
        {profile.schedule && (
          <div>
            <label className="text-sm text-gray-500">Schedule</label>
            <p className="font-medium">
              {profile.schedule.workDays.join(', ')}
            </p>
            <p className="text-sm text-gray-600">
              {profile.schedule.startTime} - {profile.schedule.endTime}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 5. Create Profile Edit Form

`frontend/src/components/profile/profile-edit-form.tsx`:
```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateMyProfile } from '@/services/profile-service';
import { useToast } from '@/components/ui/use-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  profile: {
    name: string;
    phone?: string;
  };
  onSuccess: () => void;
}

export const ProfileEditForm = ({ profile, onSuccess }: ProfileEditFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await updateMyProfile(data);
      toast({ title: 'Profile updated' });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...register('phone')} />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
```

### 6. Create Employee Dashboard Page

`frontend/src/pages/employee-dashboard-page.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { EmployeeLayout } from '@/components/layout/employee-layout';
import { ProfileView } from '@/components/profile/profile-view';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { Button } from '@/components/ui/button';
import { getMyProfile } from '@/services/profile-service';

export const EmployeeDashboardPage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditSuccess = () => {
    setIsEditing(false);
    fetchProfile();
  };

  return (
    <EmployeeLayout>
      <div className="max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : profile ? (
          isEditing ? (
            <>
              <ProfileEditForm profile={profile} onSuccess={handleEditSuccess} />
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="mt-4"
              >
                Cancel
              </Button>
            </>
          ) : (
            <ProfileView profile={profile} />
          )
        ) : (
          <div>Profile not found</div>
        )}
      </div>
    </EmployeeLayout>
  );
};
```

### 7. Create Employee Chat Page

`frontend/src/pages/employee-chat-page.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { EmployeeLayout } from '@/components/layout/employee-layout';
import { ChatThread } from '@/components/chat/chat-thread';
import { useSocket } from '@/contexts/socket-context';
import { getMyProfile } from '@/services/profile-service';
import { useAuth } from '@/contexts/auth-context';

export const EmployeeChatPage = () => {
  const { isConnected } = useSocket();
  const { user } = useAuth();
  const [managerId, setManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const profile = await getMyProfile();
        setManagerId(profile.managerId);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManager();
  }, []);

  // Create pseudo employee object for ChatThread
  const managerAsEmployee = managerId
    ? {
        id: managerId,
        name: 'Manager',
        department: '',
        userId: managerId,
        email: '',
        role: '',
        managerId: '',
        isActive: true,
        setupCompleted: true,
        createdAt: '',
        updatedAt: '',
      }
    : null;

  return (
    <EmployeeLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col -m-8">
        {!isConnected && (
          <div className="bg-yellow-100 text-yellow-800 text-center py-1 text-sm">
            Connecting to chat server...
          </div>
        )}

        <div className="p-4 border-b bg-white">
          <h1 className="text-xl font-bold">Chat with Manager</h1>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">Loading...</div>
        ) : managerId ? (
          <div className="flex-1 flex">
            <ChatThread employee={managerAsEmployee} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Manager information not available
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};
```

### 8. Update App Routes

Add to `frontend/src/App.tsx`:
```typescript
import { EmployeeDashboardPage } from './pages/employee-dashboard-page';
import { EmployeeChatPage } from './pages/employee-chat-page';

// In routes:
<Route
  path="/employee/dashboard"
  element={
    <ProtectedRoute allowedRoles={['employee']}>
      <EmployeeDashboardPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/employee/chat"
  element={
    <ProtectedRoute allowedRoles={['employee']}>
      <EmployeeChatPage />
    </ProtectedRoute>
  }
/>
```

## Todo List

- [ ] Create profile service
- [ ] Add profile routes to backend
- [ ] Create employee layout
- [ ] Create profile view component
- [ ] Create profile edit form
- [ ] Create employee dashboard page
- [ ] Create employee chat page
- [ ] Update App routes
- [ ] Test profile viewing
- [ ] Test profile editing
- [ ] Test employee-manager chat

## Success Criteria

- [ ] Employee sees their profile
- [ ] Employee can edit name and phone
- [ ] Profile updates persist
- [ ] Employee can chat with manager
- [ ] Chat works in real-time
- [ ] Logout works correctly

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Chat access issues | Low | Medium | Validate manager link |
| Profile not found | Low | Medium | Handle gracefully |
| Role confusion | Low | Medium | Strict role checks |

## Security Considerations

- Employee can only edit own profile
- Employee can only chat with assigned manager
- Validate role on all routes

## Next Steps

After completion:
1. Proceed to [Phase 11: Polish & Documentation](./phase-11-polish-and-documentation.md)
2. Test complete employee flow
