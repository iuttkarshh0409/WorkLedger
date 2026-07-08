import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@app/SessionContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-secondary">
        <div className="text-sm font-medium text-text-secondary animate-pulse">
          Loading session...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/demo-entry" replace />;
  }

  return <>{children}</>;
}
export default ProtectedRoute;
