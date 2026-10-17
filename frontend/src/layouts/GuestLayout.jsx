import { useState } from "react";
import { BedDouble, Settings, Utensils } from "lucide-react";
import { Outlet } from "react-router-dom";
import GuestSidebar from "../components/guest_sidebar/GuestSidebar.jsx";
import GuestTopbar from "../components/guest_topbar/GuestTopbar.jsx";
import { useAuth } from "../context/authContext.js";

const SIDEBAR = {
  brand: {
    initials: "HM",
    name: "Hotel Molinera",
    tagline: "Tu estadía, nuestra prioridad",
  },
  items: [
    { label: "Mi habitación", icon: BedDouble, path: "/mi-habitacion" },
    { label: "Alimentos y bebidas", icon: Utensils, path: "/pedidos" },
    { label: "Configuración", icon: Settings, path: "/configuracion" },
  ],
  logoutLabel: "Cerrar sesión",
};

const GUEST = {
  nombre: "Juan Pérez",
  habitacion: "Habitación 101",
};

export default function GuestLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, reservation } = useAuth();

  return (
    <div className="hotel-layout d-flex min-vh-100">
      <GuestSidebar
        {...SIDEBAR}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content flex-grow-1">
        <GuestTopbar
          guest={{
            nombre: user?.name || GUEST.nombre,
            habitacion: reservation?.roomName || "Sin habitación reservada",
          }}
          notificationLabel="Notificaciones"
          menuLabel="Abrir menú"
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <Outlet />
      </main>
    </div>
  );
}
