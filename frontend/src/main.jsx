import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'

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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<App />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/planes" element={<Planes />} />
        <Route path="/restaurante" element={<Restaurante />} />

        {/* Huésped */}
        <Route path="/mi-habitacion" element={<MyRoom />} />
        <Route path="/pedidos" element={<RoomRequests />} />
        <Route path="/configuracion" element={<Settings />} />

        {/* Admin */}
        <Route path="/admin" element={<HotelDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);