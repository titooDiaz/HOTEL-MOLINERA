import { lazy, Suspense } from "react";

// Páginas públicas
export const App = lazy(() => import("../App.jsx"));
export const Contacto = lazy(() => import("../pages/main/Contacto.jsx"));
export const Planes = lazy(() => import("../pages/main/Planes.jsx"));
export const Restaurante = lazy(() => import("../pages/main/Restaurante.jsx"));
export const NotFound = lazy(() => import("../pages/NotFound.jsx"));

// Páginas de huésped
export const MyRoom = lazy(() => import("../pages/users/MyHabitacion.jsx"));
export const RoomRequests = lazy(() => import("../pages/users/Alimentos.jsx"));
export const Settings = lazy(() => import("../pages/users/Settings.jsx"));

// Páginas de administración
export const HotelDashboard = lazy(() => import("../pages/admin/HotelDashboard.jsx"));
export const Habitaciones = lazy(() => import("../pages/admin/Habitaciones.jsx"));
export const NuevaHabitacion = lazy(() => import("../pages/admin/NuevaHabitacion.jsx"));
export const Reservas = lazy(() => import("../pages/admin/Reservas.jsx"));
export const NuevaReserva = lazy(() => import("../pages/admin/NuevaReserva.jsx"));
export const Clientes = lazy(() => import("../pages/admin/Clientes.jsx"));
export const NuevoCliente = lazy(() => import("../pages/admin/NuevoCliente.jsx"));
export const RestauranteAdmin = lazy(() => import("../pages/admin/RestauranteAdmin.jsx"));
export const NuevoPedido = lazy(() => import("../pages/admin/NuevoPedido.jsx"));
export const NuevoProducto = lazy(() => import("../pages/admin/NuevoProducto.jsx"));
export const PlanesAdmin = lazy(() => import("../pages/admin/PlanesAdmin.jsx"));
export const NuevoPlan = lazy(() => import("../pages/admin/NuevoPlan.jsx"));
export const Reportes = lazy(() => import("../pages/admin/Reportes.jsx"));
export const Configuracion = lazy(() => import("../pages/admin/Configuracion.jsx"));

export function RoutePage({ component: Page }) {
  return (
    <Suspense
      fallback={
        <div className="d-flex justify-content-center align-items-center py-5" role="status">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          <span>Cargando...</span>
        </div>
      }
    >
      <Page />
    </Suspense>
  );
}
