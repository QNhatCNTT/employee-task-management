# Phase 08: Manager Dashboard UI

## Context Links

- [Parent Plan](./plan.md)
- [Phase 07: Frontend Auth Pages](./phase-07-frontend-auth-pages.md)
- [Frontend Research](./research/researcher-02-vite-react-frontend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 5h |
| Implementation Status | pending |
| Review Status | pending |

Build manager dashboard with employee list, add/edit/delete employees, and schedule management.

## Key Insights

- shadcn/ui components for consistent styling
- React Query or simple useState for data fetching
- Modal dialogs for add/edit forms
- Confirmation dialog before delete
- Schedule picker for work hours

## Requirements

### Functional
- Dashboard layout with navigation
- Employee list with details (name, email, department, role)
- Add employee button opens form modal
- Edit employee opens pre-filled form
- Delete employee shows confirmation
- Schedule management (work days, hours)
- Logout functionality

### Non-Functional
- Responsive layout (mobile-friendly)
- Loading states for data fetching
- Toast notifications for actions

## Architecture

```
ManagerDashboard
├── DashboardLayout
│   ├── Sidebar (navigation)
│   └── Main Content
│       ├── EmployeeList
│       │   └── EmployeeCard (each employee)
│       └── Modals
│           ├── AddEmployeeModal
│           ├── EditEmployeeModal
│           └── DeleteConfirmDialog
```

### Component Structure
- DashboardLayout: Common layout wrapper
- EmployeeList: Fetches and displays employees
- EmployeeCard: Single employee display
- EmployeeForm: Reusable form for add/edit
- ScheduleEditor: Work schedule input

## Related Code Files

### Files to Create
- `frontend/src/services/employee-service.ts`
- `frontend/src/components/layout/dashboard-layout.tsx`
- `frontend/src/components/employee/employee-list.tsx`
- `frontend/src/components/employee/employee-card.tsx`
- `frontend/src/components/employee/employee-form.tsx`
- `frontend/src/components/employee/schedule-editor.tsx`
- `frontend/src/components/employee/add-employee-modal.tsx`
- `frontend/src/components/employee/edit-employee-modal.tsx`
- `frontend/src/components/employee/delete-employee-dialog.tsx`
- `frontend/src/pages/manager-dashboard-page.tsx`
- `frontend/src/types/employee-types.ts`

### Files to Modify
- `frontend/src/App.tsx` (update route)

## Implementation Steps

### 1. Create Employee Types

`frontend/src/types/employee-types.ts`:
```typescript
export interface Employee {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  managerId: string;
  isActive: boolean;
  setupCompleted: boolean;
  schedule?: Schedule;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  workDays: string[];
  startTime: string;
  endTime: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  department: string;
  role?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
  schedule?: Schedule;
}
```

### 2. Create Employee Service

`frontend/src/services/employee-service.ts`:
```typescript
import apiClient from './api-client';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '@/types/employee-types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get<ApiResponse<Employee[]>>('/api/employees');
  return response.data.data;
};

export const getEmployee = async (id: string): Promise<Employee> => {
  const response = await apiClient.get<ApiResponse<Employee>>(`/api/employees/${id}`);
  return response.data.data;
};

export const createEmployee = async (input: CreateEmployeeInput): Promise<{ employeeId: string }> => {
  const response = await apiClient.post<ApiResponse<{ employeeId: string }>>('/api/employees', input);
  return response.data.data;
};

export const updateEmployee = async (id: string, input: UpdateEmployeeInput): Promise<Employee> => {
  const response = await apiClient.put<ApiResponse<Employee>>(`/api/employees/${id}`, input);
  return response.data.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/employees/${id}`);
};
```

### 3. Create Dashboard Layout

`frontend/src/components/layout/dashboard-layout.tsx`:
```typescript
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Employees' },
    { path: '/dashboard/chat', label: 'Chat' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-8">Task Manager</h1>
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
          <p className="text-sm text-gray-400 mb-2">{user?.phoneNumber}</p>
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

### 4. Create Employee Card

`frontend/src/components/employee/employee-card.tsx`:
```typescript
import { Employee } from '@/types/employee-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onChat: (employee: Employee) => void;
}

export const EmployeeCard = ({ employee, onEdit, onDelete, onChat }: EmployeeCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{employee.name}</CardTitle>
          <p className="text-sm text-gray-500">{employee.email}</p>
        </div>
        <Badge variant={employee.setupCompleted ? 'default' : 'secondary'}>
          {employee.setupCompleted ? 'Active' : 'Pending Setup'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <p><strong>Department:</strong> {employee.department}</p>
          <p><strong>Role:</strong> {employee.role}</p>
          {employee.schedule && (
            <p>
              <strong>Schedule:</strong> {employee.schedule.workDays.join(', ')} (
              {employee.schedule.startTime} - {employee.schedule.endTime})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(employee)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChat(employee)}>
            Chat
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(employee)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 5. Create Employee Form

`frontend/src/components/employee/employee-form.tsx`:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Employee } from '@/types/employee-types';
import { ScheduleEditor } from './schedule-editor';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  department: z.string().min(1, 'Department required'),
  role: z.string().optional(),
  phone: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: EmployeeFormData & { schedule?: any }) => void;
  isLoading: boolean;
}

export const EmployeeForm = ({ employee, onSubmit, isLoading }: EmployeeFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      phone: employee.phone,
    } : {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} disabled={!!employee} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="department">Department</Label>
        <Input id="department" {...register('department')} />
        {errors.department && <p className="text-red-500 text-sm">{errors.department.message}</p>}
      </div>

      <div>
        <Label htmlFor="role">Job Title</Label>
        <Input id="role" {...register('role')} />
      </div>

      <div>
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" type="tel" {...register('phone')} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
      </Button>
    </form>
  );
};
```

### 6. Create Schedule Editor

`frontend/src/components/employee/schedule-editor.tsx`:
```typescript
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Schedule } from '@/types/employee-types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ScheduleEditorProps {
  schedule?: Schedule;
  onChange: (schedule: Schedule) => void;
}

export const ScheduleEditor = ({ schedule, onChange }: ScheduleEditorProps) => {
  const [workDays, setWorkDays] = useState<string[]>(schedule?.workDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [startTime, setStartTime] = useState(schedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(schedule?.endTime || '17:00');

  const handleDayToggle = (day: string, checked: boolean) => {
    const newDays = checked
      ? [...workDays, day]
      : workDays.filter((d) => d !== day);
    setWorkDays(newDays);
    onChange({ workDays: newDays, startTime, endTime });
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
      onChange({ workDays, startTime: value, endTime });
    } else {
      setEndTime(value);
      onChange({ workDays, startTime, endTime: value });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Work Days</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {DAYS.map((day) => (
            <label key={day} className="flex items-center gap-1">
              <Checkbox
                checked={workDays.includes(day)}
                onCheckedChange={(checked) => handleDayToggle(day, !!checked)}
              />
              <span className="text-sm">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => handleTimeChange('start', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => handleTimeChange('end', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
```

### 7. Create Add Employee Modal

`frontend/src/components/employee/add-employee-modal.tsx`:
```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmployeeForm } from './employee-form';
import { createEmployee } from '@/services/employee-service';
import { useToast } from '@/components/ui/use-toast';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEmployeeModal = ({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await createEmployee(data);
      toast({ title: 'Employee created', description: 'Invitation email sent' });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create employee',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
};
```

### 8. Create Edit Employee Modal

`frontend/src/components/employee/edit-employee-modal.tsx`:
```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmployeeForm } from './employee-form';
import { ScheduleEditor } from './schedule-editor';
import { updateEmployee } from '@/services/employee-service';
import { Employee, Schedule } from '@/types/employee-types';
import { useToast } from '@/components/ui/use-toast';

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditEmployeeModal = ({ isOpen, employee, onClose, onSuccess }: EditEmployeeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | undefined>(employee?.schedule);
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    if (!employee) return;

    setIsLoading(true);
    try {
      await updateEmployee(employee.id, { ...data, schedule });
      toast({ title: 'Employee updated' });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update employee',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm employee={employee} onSubmit={handleSubmit} isLoading={isLoading} />
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium mb-2">Work Schedule</h3>
          <ScheduleEditor schedule={employee.schedule} onChange={setSchedule} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 9. Create Delete Dialog

`frontend/src/components/employee/delete-employee-dialog.tsx`:
```typescript
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteEmployee } from '@/services/employee-service';
import { Employee } from '@/types/employee-types';
import { useToast } from '@/components/ui/use-toast';

interface DeleteEmployeeDialogProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteEmployeeDialog = ({ isOpen, employee, onClose, onSuccess }: DeleteEmployeeDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!employee) return;

    setIsLoading(true);
    try {
      await deleteEmployee(employee.id);
      toast({ title: 'Employee deleted' });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete employee',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Employee</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {employee?.name}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

### 10. Create Manager Dashboard Page

`frontend/src/pages/manager-dashboard-page.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmployeeCard } from '@/components/employee/employee-card';
import { AddEmployeeModal } from '@/components/employee/add-employee-modal';
import { EditEmployeeModal } from '@/components/employee/edit-employee-modal';
import { DeleteEmployeeDialog } from '@/components/employee/delete-employee-dialog';
import { Button } from '@/components/ui/button';
import { getEmployees } from '@/services/employee-service';
import { Employee } from '@/types/employee-types';
import { useAuth } from '@/contexts/auth-context';

export const ManagerDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChat = (employee: Employee) => {
    const chatId = [user?.userId, employee.id].sort().join('_');
    navigate(`/dashboard/chat/${chatId}`);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={() => setShowAddModal(true)}>Add Employee</Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No employees yet. Click "Add Employee" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={setEditEmployee}
              onDelete={setDeleteEmployee}
              onChat={handleChat}
            />
          ))}
        </div>
      )}

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchEmployees}
      />

      <EditEmployeeModal
        isOpen={!!editEmployee}
        employee={editEmployee}
        onClose={() => setEditEmployee(null)}
        onSuccess={fetchEmployees}
      />

      <DeleteEmployeeDialog
        isOpen={!!deleteEmployee}
        employee={deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
        onSuccess={fetchEmployees}
      />
    </DashboardLayout>
  );
};
```

## Todo List

- [ ] Create employee types
- [ ] Create employee service
- [ ] Create dashboard layout
- [ ] Create employee card component
- [ ] Create employee form component
- [ ] Create schedule editor component
- [ ] Create add employee modal
- [ ] Create edit employee modal
- [ ] Create delete confirmation dialog
- [ ] Create manager dashboard page
- [ ] Update App routes
- [ ] Add shadcn/ui components (badge, dialog, alert-dialog, checkbox, label)
- [ ] Test add employee flow
- [ ] Test edit employee flow
- [ ] Test delete employee flow
- [ ] Test schedule editing

## Success Criteria

- [ ] Dashboard displays employee list
- [ ] Add employee creates record and sends invite
- [ ] Edit employee updates record
- [ ] Delete employee removes from list
- [ ] Schedule editor saves work hours
- [ ] Toast notifications on actions
- [ ] Loading states display
- [ ] Empty state when no employees

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Modal state management issues | Medium | Low | Use controlled open state |
| Form validation failures | Low | Medium | Zod + error display |
| Optimistic updates sync | Medium | Medium | Refetch on success |

## Security Considerations

- Only show manager's own employees
- Validate auth before API calls
- Disable email field on edit (prevent hijack)

## Next Steps

After completion:
1. Proceed to [Phase 09: Chat Feature UI](./phase-09-chat-feature-ui.md)
2. Test full employee CRUD flow
