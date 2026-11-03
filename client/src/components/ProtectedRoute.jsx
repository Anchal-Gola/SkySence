import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080f24] text-amber-300">
        Checking your session...
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}