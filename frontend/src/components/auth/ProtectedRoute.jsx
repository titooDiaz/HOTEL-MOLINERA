// Restringe el acceso a usuarios autenticados y, opcionalmente, a un rol específico.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/authContext.js";

export default function ProtectedRoute({ allowedRole }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return <main className="container py-5 text-center" role="status">Cargando sesión...</main>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/mi-habitacion"} replace />;
  }

  return <Outlet />;
}