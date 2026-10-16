import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminNav from "../components/nav/admin_nav.jsx";
import { NAV_ITEMS, SIDEBAR_COPY, buildTopbarCopy } from "../components/nav/adminNavItems.jsx";
import DashboardTopbar from "../components/dashboard_topbar/DashboardTopbar.jsx";

const TOPBAR_COPY = [
  {
    paths: ["/admin"],
    searchPlaceholder: "Buscar reservas, clientes, habitaciones...",
    searchLabel: "Buscar reservas, clientes o habitaciones",
  },
  {
    paths: ["/admin/habitaciones", "/admin/habitaciones/nueva"],
    searchPlaceholder: "Buscar habitación por número o tipo...",
    searchLabel: "Buscar habitaciones",
  },
  {
    paths: ["/admin/reservas", "/admin/reservas/nueva"],
    searchPlaceholder: "Buscar reserva por cliente o número...",
    searchLabel: "Buscar reservas",
  },
  {
    paths: ["/admin/clientes", "/admin/clientes/nuevo"],
    searchPlaceholder: "Buscar cliente por nombre o email...",
    searchLabel: "Buscar clientes",
  },
  {
    paths: ["/admin/restaurante", "/admin/restaurante/nuevo"],
    searchPlaceholder: "Buscar por habitación o cliente...",
    searchLabel: "Buscar pedidos",
  },
  {
    paths: ["/admin/reportes"],
    searchPlaceholder: "Buscar en reportes...",
    searchLabel: "Buscar en reportes",
  },
  {
    paths: ["/admin/configuracion"],
    searchPlaceholder: "Buscar en configuración...",
    searchLabel: "Buscar en configuración",
  },
];

function getTopbarLabels(pathname) {
  const copy = TOPBAR_COPY.find(({ paths }) =>
    paths.some((path) => path === "/admin" ? pathname === path : pathname.startsWith(path)),
  );
  return buildTopbarCopy(
    copy?.searchPlaceholder ?? "Buscar...",
    copy?.searchLabel ?? "Buscar",
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const adminPath = pathname.replace(/\/+$/, "");

  return (
    <div className={`admin-dashboard d-flex min-vh-100${adminPath === "/admin" ? "" : " admin-view"}`}>
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brand={SIDEBAR_COPY.brand}
        logoutLabel={SIDEBAR_COPY.logoutLabel}
      />
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={() => setSidebarOpen(true)}
          labels={getTopbarLabels(adminPath)}
        />
        <main className="flex-grow-1 dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
