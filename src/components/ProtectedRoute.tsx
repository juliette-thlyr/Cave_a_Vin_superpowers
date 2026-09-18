import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-4">Chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
