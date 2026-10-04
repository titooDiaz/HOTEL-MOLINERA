import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'

// Vistas de usuarios logueados
import RoomRequests from './pages/users/RoomRequests.jsx'
import HotelDashboard from './pages/admin/HotelDashboard.jsx'
import MyRoom  from './pages/users/MyRoom.jsx';
// Vistas de usuarios no logueados
import App from './App.jsx'
import Contacto from "./pages/main/Contacto.jsx";
import Planes from "./pages/main/Planes.jsx";
import Restaurante from "./pages/main/Restaurante.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MyRoom />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/planes" element={<Planes />} />
        <Route path="/restaurante" element={<Restaurante />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);