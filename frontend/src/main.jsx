// Inicializa React, proveedores globales, layouts y rutas públicas, de huésped y administración.
import "bootstrap/dist/css/bootstrap.min.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import GuestLayout from "./layouts/GuestLayout.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx";
import {
  App,
  Clientes,
  Configuracion,
  Contacto,
  Habitaciones,
  HotelDashboard,
  MyRoom,
  NotFound,
  NuevaHabitacion,
  NuevaReserva,
  NuevoCliente,
  NuevoPedido,
  Planes,
  Reportes,
  Restaurante,
  RestauranteAdmin,
  RoomRequests,
  RoutePage,
  Reservas,
  Settings,
} from "./routes/lazyPages.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
          {/* Públicas */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<RoutePage component={App} />} />
            <Route path="/contacto" element={<RoutePage component={Contacto} />} />
            <Route path="/planes" element={<RoutePage component={Planes} />} />
            <Route path="/restaurante" element={<RoutePage component={Restaurante} />} />
          </Route>
          <Route path="*" element={<RoutePage component={NotFound} />} />

          {/* Huésped */}
          <Route element={<ProtectedRoute allowedRole="guest" />}>
            <Route element={<GuestLayout />}>
              <Route path="/mi-habitacion" element={<RoutePage component={MyRoom} />} />
              <Route path="/pedidos" element={<RoutePage component={RoomRequests} />} />
              <Route path="/configuracion" element={<RoutePage component={Settings} />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<RoutePage component={HotelDashboard} />} />
              <Route path="/admin/habitaciones" element={<RoutePage component={Habitaciones} />} />
              <Route path="/admin/habitaciones/nueva" element={<RoutePage component={NuevaHabitacion} />} />
              <Route path="/admin/reservas" element={<RoutePage component={Reservas} />} />
              <Route path="/admin/reservas/nueva" element={<RoutePage component={NuevaReserva} />} />
              <Route path="/admin/clientes" element={<RoutePage component={Clientes} />} />
              <Route path="/admin/clientes/nuevo" element={<RoutePage component={NuevoCliente} />} />
              <Route path="/admin/restaurante" element={<RoutePage component={RestauranteAdmin} />} />
              <Route path="/admin/restaurante/nuevo" element={<RoutePage component={NuevoPedido} />} />
              <Route path="/admin/reportes" element={<RoutePage component={Reportes} />} />
              <Route path="/admin/configuracion" element={<RoutePage component={Configuracion} />} />
            </Route>
          </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);