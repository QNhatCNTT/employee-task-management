import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { ProtectedRoute } from './components/protected-route';
import { HomePage } from './pages/home-page';
import { ManagerLoginPage } from './pages/manager-login-page';
import { EmployeeLoginPage } from './pages/employee-login-page';
import { OtpVerifyPage } from './pages/otp-verify-page';
import { EmployeeSetupPage } from './pages/employee-setup-page';

// Placeholder components for future phases
const ManagerDashboardPage = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-2xl font-bold">Manager Dashboard</h1>
    <p className="text-gray-600">Coming soon...</p>
  </div>
);

const EmployeeDashboardPage = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-2xl font-bold">Employee Dashboard</h1>
    <p className="text-gray-600">Coming soon...</p>
  </div>
);

const ManagerChatPage = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-2xl font-bold">Manager Chat</h1>
    <p className="text-gray-600">Coming soon...</p>
  </div>
);

const EmployeeChatPage = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-2xl font-bold">Employee Chat</h1>
    <p className="text-gray-600">Coming soon...</p>
  </div>
);

function App() {
  return (
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
                <ManagerChatPage />
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
                <EmployeeChatPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
