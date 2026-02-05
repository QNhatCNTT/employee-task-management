import { useState } from 'react';
import { Task } from '../../types/task';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { taskService } from '../../services/task-service';
import {
  Trash2,
  CheckCircle,
  Clock,
  Calendar,
  Loader2,
  XCircle,
  ListTodo
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  isManager: boolean;
  onRefresh: () => void;
}

export const TaskList = ({ tasks, isManager, onRefresh }: TaskListProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
            <Loader2 size={12} className="mr-1" />
            In Progress
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
            <XCircle size={12} className="mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-0">
            <Clock size={12} className="mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
            Low
          </span>
        );
    }
  };

  const handleStatusUpdate = async (taskId: string, status: Task['status']) => {
    setUpdatingId(taskId);
    try {
      await taskService.updateStatus(taskId, status);
      onRefresh();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setUpdatingId(taskId);
    try {
      await taskService.deleteTask(taskId);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete task', error);
      alert('Failed to delete task');
    } finally {
      setUpdatingId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-slate-100">
            <ListTodo size={32} className="text-slate-400" />
          </div>
        </div>
        <p className="font-medium text-slate-700">No tasks found</p>
        <p className="text-sm text-slate-500 mt-1">Tasks will appear here once created</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {getPriorityBadge(task.priority)}
                <h3 className="font-semibold text-slate-900">{task.title}</h3>
                {getStatusBadge(task.status)}
              </div>

              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                {isManager && task.assigneeName && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-medium">
                      {task.assigneeName.charAt(0).toUpperCase()}
                    </div>
                    <span>{task.assigneeName}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:flex-col md:items-end">
              {!isManager && task.status !== 'cancelled' && task.status !== 'completed' && (
                <select
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  value={task.status}
                  onChange={(e) => handleStatusUpdate(task.id, e.target.value as Task['status'])}
                  disabled={updatingId === task.id}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              )}

              {isManager && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(task.id)}
                  disabled={updatingId === task.id}
                >
                  <Trash2 size={14} className="mr-1" />
                  {updatingId === task.id ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
