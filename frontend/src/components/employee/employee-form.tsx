import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Employee, Schedule } from '../../types/employee-types';
import { ScheduleEditor } from './schedule-editor';

const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  department: z.string().min(1, 'Department required'),
  role: z.string().optional(),
  phone: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: EmployeeFormData & { schedule?: Schedule }) => void;
  isLoading: boolean;
}

export const EmployeeForm = ({ employee, onSubmit, isLoading }: EmployeeFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          name: employee.name,
          email: employee.email,
          department: employee.department,
          role: employee.role,
          phone: employee.phone || '',
        }
      : {},
  });

  const handleFormSubmit = (data: EmployeeFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} disabled={isLoading} />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} disabled={!!employee || isLoading} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input id="department" {...register('department')} disabled={isLoading} />
        {errors.department && <p className="text-red-500 text-sm">{errors.department.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Job Title</Label>
        <Input id="role" {...register('role')} disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" type="tel" {...register('phone')} disabled={isLoading} />
      </div>

      {employee && (
        <div className="space-y-2">
          <Label>Work Schedule</Label>
          <ScheduleEditor
            schedule={employee.schedule}
            onChange={() => {}}
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
        </Button>
      </div>
    </form>
  );
};
