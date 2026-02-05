import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useSidebar } from '@/contexts/sidebar-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  User,
  ChevronLeft,
  Menu,
  ListTodo
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const { collapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const NavItem = ({
    icon: Icon,
    label,
    path,
    isActive
  }: {
    icon: React.ElementType;
    label: string;
    path: string;
    isActive?: boolean;
  }) => (
    <button
      onClick={() => navigate(path)}
      className={cn(
        "flex items-center w-full p-3 rounded-lg transition-all duration-200 group relative",
        isActive
          ? "bg-blue-600 text-white shadow-md"
          : "text-slate-400 hover:bg-slate-800 hover:text-white",
        collapsed ? "justify-center" : "justify-start gap-3"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
      {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}

      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
          {label}
        </div>
      )}
    </button>
  );

  const managerLinks = [
    { icon: Users, label: 'Employees', path: '/dashboard' },
    { icon: ListTodo, label: 'Tasks', path: '/dashboard/tasks' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
  ];

  const employeeLinks = [
    { icon: User, label: 'Dashboard', path: '/employee/dashboard' },
    { icon: ListTodo, label: 'My Tasks', path: '/employee/tasks' },
    { icon: MessageSquare, label: 'Chat', path: '/employee/chat' },
  ];

  const links = user?.role === 'manager' ? managerLinks : employeeLinks;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-40",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className={cn(
        "h-16 flex items-center border-b border-slate-800",
        collapsed ? "justify-center" : "px-6 justify-between"
      )}>
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent truncate">
            ETM System
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {links.map((link) => (
          <NavItem
            key={link.path}
            icon={link.icon}
            label={link.label}
            path={link.path}
            isActive={location.pathname === link.path}
          />
        ))}
      </div>

      {/* Role indicator */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="px-3 py-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Role</p>
            <p className="text-sm font-medium text-slate-300 capitalize">{user?.role || 'User'}</p>
          </div>
        </div>
      )}
    </aside>
  );
};
