import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const guestUserId = typeof window !== 'undefined' ? localStorage.getItem('guestUserId') : null;

    if (guestUserId && location.pathname.startsWith('/roadmap')) {
      return <>{children}</>;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}