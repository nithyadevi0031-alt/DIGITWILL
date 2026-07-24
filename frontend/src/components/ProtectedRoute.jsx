import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth(true);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FFF6EC] text-[#111111]">Checking session…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
