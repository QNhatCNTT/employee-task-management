import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { ToastProvider } from './contexts/toast-context';
import { SocketProvider } from './contexts/socket-context';
import { ProtectedRoute } from './components/protected-route';
import { LoginPage } from './pages/login-page';
import { OtpVerifyPage } from './pages/otp-verify-page';
import { EmployeeSetupPage } from './pages/employee-setup-page';
import { ManagerDashboardPage } from './pages/manager-dashboard-page';
import { EmployeeDashboardPage } from './pages/employee-dashboard-page';
import { ManagerTasksPage } from './pages/manager-tasks-page';
import { EmployeeTasksPage } from './pages/employee-tasks-page';
import { ChatPage } from './pages/chat-page';
import { FullPageLoader } from './components/ui/full-page-loader';
import { DashboardLayout } from './components/layout/dashboard-layout';

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<OtpVerifyPage />} />
      <Route path="/setup" element={<EmployeeSetupPage />} />

      {/* Protected Manager Routes */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/chat"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/chat/:chatId"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Protected Employee Routes */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/tasks"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/chat"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
