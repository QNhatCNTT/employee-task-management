import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { taskService } from '../../services/task-service';
import { getEmployees } from '../../services/employee-service';
import { Employee } from '../../types/employee-types';
import { Task, CreateTaskData } from '../../types/task';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: Task; // If provided, form is in edit mode
}

export const TaskForm = ({ isOpen, onClose, onSuccess, task }: TaskFormProps) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<CreateTaskData & { status?: Task['status'] }>({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium',
    dueDate: '',
  });

  const isEditMode = !!task;

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      if (task) {
        setFormData({
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          status: task.status,
        });
      } else {
        setFormData({
          title: '',
          description: '',
          assigneeId: '',
          priority: 'medium',
          dueDate: '',
        });
      }
    }
  }, [isOpen, task]);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      const activeEmployees = data.filter(e => e.isActive);
      setEmployees(activeEmployees);
      if (activeEmployees.length > 0 && !formData.assigneeId && !task) {
        setFormData(prev => ({ ...prev, assigneeId: activeEmployees[0].id! }));
      }
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode && task) {
        await taskService.updateTask(task.id, formData);
      } else {
        await taskService.createTask(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save task', error);
      alert('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter task title"
              className="border-slate-200 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Describe the task..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-slate-700">Assignee</Label>
              <select
                id="assignee"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                required
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-slate-700">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as CreateTaskData['priority'] })}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-700">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-slate-700">Due Date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="border-slate-200 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
