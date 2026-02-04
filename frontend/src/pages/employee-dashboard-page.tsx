import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useToast } from '../contexts/toast-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileSkeleton } from '@/components/ui/loading-skeleton';
import * as profileService from '../services/profile-service';
import { 
  MessageSquare, 
  LogOut, 
  User,
  Briefcase,
  Mail,
  Phone,
  Clock
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
  const { user, logout } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        showError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [showError]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOpenChat = () => {
    navigate('/employee/chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Employee Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">
                Welcome, {profile?.name || user?.email || 'Employee'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleOpenChat}>
                <MessageSquare size={18} className="mr-2" />
                Chat with Manager
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <Card className="bg-white border-slate-200 shadow-sm">
          {isLoading ? (
            <CardContent className="p-6">
              <ProfileSkeleton />
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{profile?.name}</h2>
                    <p className="text-sm text-slate-500">{profile?.role}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Briefcase size={20} className="text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Department</p>
                      <p className="font-medium text-slate-900">{profile?.department}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <Mail size={20} className="text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{profile?.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  {profile?.phone && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      <Phone size={20} className="text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-medium text-slate-900">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Schedule */}
                  {profile?.schedule && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      <Clock size={20} className="text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Work Schedule</p>
                        <p className="font-medium text-slate-900">
                          {profile.schedule.workDays.join(', ')}
                        </p>
                        <p className="text-sm text-slate-600">
                          {profile.schedule.startTime} - {profile.schedule.endTime}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className="bg-white border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={handleOpenChat}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageSquare size={24} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Chat with Manager</h4>
                  <p className="text-sm text-slate-500">Send a message to your manager</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
