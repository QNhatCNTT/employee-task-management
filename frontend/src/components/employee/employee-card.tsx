import { Employee } from '../../types/employee-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MessageSquare, Clock, Mail, Phone } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onChat: (employee: Employee) => void;
}

export const EmployeeCard = ({ employee, onEdit, onDelete, onChat }: EmployeeCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">{employee.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Mail size={14} />
            <span>{employee.email}</span>
          </div>
        </div>
        <Badge variant={employee.setupCompleted ? 'default' : 'secondary'}>
          {employee.setupCompleted ? 'Active' : 'Pending'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Department:</span>
            <span className="text-gray-600">{employee.department}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Role:</span>
            <span className="text-gray-600">{employee.role}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} />
              <span className="text-gray-600">{employee.phone}</span>
            </div>
          )}
          {employee.schedule && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} />
              <span className="text-gray-600">
                {employee.schedule.workDays.join(', ')} ({employee.schedule.startTime} - {employee.schedule.endTime})
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(employee)} className="flex-1">
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChat(employee)} className="flex-1">
            <MessageSquare size={14} className="mr-1" />
            Chat
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(employee)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
