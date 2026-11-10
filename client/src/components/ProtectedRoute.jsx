import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7F2] dark:bg-[#0B1612]">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo
          size="large"
          layout="stacked"
          subtitle="Loading your clinical health space..."
          className="animate-pulse"
        />
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
