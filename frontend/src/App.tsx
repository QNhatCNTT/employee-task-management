import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { ToastProvider } from './contexts/toast-context';
import { ProtectedRoute } from './components/protected-route';
import { HomePage } from './pages/home-page';
import { ManagerLoginPage } from './pages/manager-login-page';
import { EmployeeLoginPage } from './pages/employee-login-page';
import { OtpVerifyPage } from './pages/otp-verify-page';
import { EmployeeSetupPage } from './pages/employee-setup-page';
import { ManagerDashboardPage } from './pages/manager-dashboard-page';
import { EmployeeDashboardPage } from './pages/employee-dashboard-page';
import { ChatPage } from './pages/chat-page';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<ManagerLoginPage />} />
          <Route path="/login/employee" element={<EmployeeLoginPage />} />
          <Route path="/verify" element={<OtpVerifyPage />} />
          <Route path="/setup" element={<EmployeeSetupPage />} />

          {/* Protected Manager Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboardPage />
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

          {/* Protected Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboardPage />
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
