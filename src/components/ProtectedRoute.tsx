import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/States';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'customer' | 'admin';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingState label="Checking your session…" />;

  if (!user) return <Navigate to="/login" replace />;

  if (requireRole === 'admin' && profile?.role !== 'admin') {
    return <Navigate to="/customer/dashboard" replace />;
  }

  if (requireRole === 'customer' && profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
