import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility, otherwise standard className string interpolation

import { useAuth } from '@/contexts/auth-context';

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const DashboardHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 w-full h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-800">
        {user?.role === 'manager' ? 'Manager Portal' : 'Employee Portal'}
      </h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <User size={16} className="text-slate-500" />
          </div>
          <div className="hidden md:block text-right">
            <p className="font-medium text-slate-900 leading-none">
              {user?.role === 'manager' ? 'Manager' : user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-slate-500 capitalize leading-none mt-1">{user?.role}</p>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};

const DashboardContent = () => {
  const { collapsed } = useSidebar();

  // Add margin based on sidebar state
  // When collapsed: w-20 (80px), Expanded: w-64 (256px)
  return (
    <div className={cn(
      "min-h-screen bg-slate-50 transition-all duration-300 ease-in-out flex flex-col",
      collapsed ? "ml-20" : "ml-64"
    )}>
      <DashboardHeader />

      {/* Main Page Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 w-full">
          <DashboardContent />
        </div>
      </div>
    </SidebarProvider>
  );
};
