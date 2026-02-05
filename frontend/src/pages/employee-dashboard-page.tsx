import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useToast } from '../contexts/toast-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileSkeleton } from '@/components/ui/loading-skeleton';
import * as profileService from '../services/profile-service';
import { taskService } from '../services/task-service';
import { Task } from '../types/task';
import {
  MessageSquare,
  User,
  Briefcase,
  Mail,
  Phone,
  Clock,
  ListTodo,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface EmployeeProfile {
  id: string;
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
}

export const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        showError('Failed to load profile. Please try again.');
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchTasks = async () => {
      try {
        const data = await taskService.getMyTasks();
        setTasks(data);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchProfile();
    fetchTasks();
  }, [showError]);

  // Task stats
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const handleOpenChat = () => {
    navigate('/employee/chat');
  };

  const handleViewTasks = () => {
    navigate('/employee/tasks');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome back, {profile?.name || user?.email || 'Employee'}
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-slate-200 shadow-sm">
        {profileLoading ? (
          <CardContent className="p-6">
            <ProfileSkeleton />
          </CardContent>
        ) : (
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {profile?.name?.charAt(0).toUpperCase() || <User size={28} />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{profile?.name}</h2>
                  <p className="text-slate-500">{profile?.role}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-md shadow-sm">
                    <Briefcase size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Department</p>
                    <p className="font-medium text-slate-900 text-sm">{profile?.department}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-md shadow-sm">
                    <Mail size={16} className="text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Email</p>
                    <p className="font-medium text-slate-900 text-sm truncate" title={profile?.email}>
                      {profile?.email}
                    </p>
                  </div>
                </div>

                {profile?.phone && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="p-2 bg-white rounded-md shadow-sm">
                      <Phone size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Phone</p>
                      <p className="font-medium text-slate-900 text-sm">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile?.schedule && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="p-2 bg-white rounded-md shadow-sm">
                      <Clock size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Work Hours</p>
                      <p className="font-medium text-slate-900 text-sm">
                        {profile.schedule.startTime} - {profile.schedule.endTime}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Task Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Task Overview</h2>
          <Button variant="ghost" size="sm" onClick={handleViewTasks} className="text-blue-600 hover:text-blue-700">
            View All Tasks
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewTasks}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-100">
                  <ListTodo size={20} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {tasksLoading ? '-' : taskStats.total}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewTasks}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-50">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {tasksLoading ? '-' : taskStats.pending}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewTasks}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50">
                  <AlertCircle size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {tasksLoading ? '-' : taskStats.inProgress}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewTasks}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {tasksLoading ? '-' : taskStats.completed}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
            onClick={handleViewTasks}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="p-3 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <ListTodo size={22} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">My Tasks</h3>
                <p className="text-sm text-slate-500">View and manage assigned tasks</p>
              </div>
              <ArrowRight size={18} className="ml-auto text-slate-400 group-hover:text-blue-500 transition-colors" />
            </CardContent>
          </Card>

          <Card
            className="border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
            onClick={handleOpenChat}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="p-3 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                <MessageSquare size={22} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Chat with Manager</h3>
                <p className="text-sm text-slate-500">Send a message directly</p>
              </div>
              <ArrowRight size={18} className="ml-auto text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
