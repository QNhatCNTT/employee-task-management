import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ("manager" | "employee")[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to the appropriate dashboard based on the user's role
        const dest = user.role === "manager" ? "/dashboard" : "/employee/tasks";
        return <Navigate to={dest} replace />;
    }

    return <>{children}</>;
};
