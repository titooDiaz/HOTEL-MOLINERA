import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";

// Vistas de usuarios no logueados
import App from './App.jsx'
import Contacto from "./pages/main/Contacto.jsx";
import Planes from "./pages/main/Planes.jsx";
import Restaurante from "./pages/main/Restaurante.jsx";

// Vistas de usuarios logueados (huésped)
import MyRoom from './pages/users/MyRoom.jsx';
import RoomRequests from './pages/users/RoomRequests.jsx';
import Settings from './pages/users/Settings.jsx';

// Vistas de administración
import HotelDashboard from './pages/admin/HotelDashboard.jsx';
import Habitaciones from './pages/admin/Habitaciones.jsx';
import Reservas from './pages/admin/Reservas.jsx';
import Clientes from './pages/admin/Clientes.jsx';
import RestauranteAdmin from './pages/admin/RestauranteAdmin.jsx';
import Reportes from './pages/admin/Reportes.jsx';
import Configuracion from './pages/admin/Configuracion.jsx';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<App />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/restaurante" element={<Restaurante />} />

          {/* Huésped */}
          <Route element={<ProtectedRoute allowedRole="guest" />}>
            <Route path="/mi-habitacion" element={<MyRoom />} />
            <Route path="/pedidos" element={<RoomRequests />} />
            <Route path="/configuracion" element={<Settings />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin" element={<HotelDashboard />} />
            <Route path="/admin/habitaciones" element={<Habitaciones />} />
            <Route path="/admin/reservas" element={<Reservas />} />
            <Route path="/admin/clientes" element={<Clientes />} />
            <Route path="/admin/restaurante" element={<RestauranteAdmin />} />
            <Route path="/admin/reportes" element={<Reportes />} />
            <Route path="/admin/configuracion" element={<Configuracion />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);