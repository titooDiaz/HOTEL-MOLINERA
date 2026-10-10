import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HotelDashboard.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import RestaurantPanel from "../../components/restaurant_panel/RestaurantPanel.jsx";

const NAV_ITEMS = [
  {
    label: "Inicio",
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </>
    ),
  },
  {
    label: "Habitaciones",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  },
  {
    label: "Reservas",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
  {
    label: "Clientes",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    label: "Restaurante",
    active: true,
    icon: (
      <>
        <path d="M3 2v7c0 1.1.9 2 2 2h1v11M7 2v20M11 2v7a2 2 0 0 0 2 2h0M14 2v20" />
        <path d="M17 2c-2 3-2 6 0 9v11" />
      </>
    ),
  },
  {
    label: "Reportes",
    icon: (
      <>
        <path d="M3 3v18h18" />
        <rect x="7" y="12" width="3" height="6" />
        <rect x="12" y="8" width="3" height="10" />
        <rect x="17" y="5" width="3" height="13" />
      </>
    ),
  },
  {
    label: "Configuración",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
];

const SUMMARY_CARDS = [
  { label: "Pedidos hoy", value: "24", sub: "en toda la propiedad" },
  { label: "Pendientes", value: "6", sub: "por entregar o cobrar" },
  { label: "Ingresos del día", value: "$612.000", sub: "COP acumulado" },
];

const ORDERS = [
  { room: "101", client: "Juan Pérez", item: "Hamburguesa clásica", amount: "$28.000", time: "1:24 p. m.", status: "Pagado", statusClass: "badge-pill-emerald" },
  { room: "201", client: "Laura Gómez", item: "Pizza margarita", amount: "$32.000", time: "7:42 p. m.", status: "Pagado", statusClass: "badge-pill-emerald" },
  { room: "305", client: "María Torres", item: "Ensalada de frutas", amount: "$12.000", time: "11:18 a. m.", status: "En preparación", statusClass: "badge-pill-amber" },
  { room: "401", client: "Andrés Ruiz", item: "Sándwich de pollo", amount: "$24.000", time: "9:03 p. m.", status: "Pendiente de pago", statusClass: "badge-pill-rose" },
  { room: "210", client: "Valentina Díaz", item: "Café americano", amount: "$8.000", time: "8:17 a. m.", status: "Pagado", statusClass: "badge-pill-emerald" },
  { room: "302", client: "Camilo Vargas", item: "Sándwich club", amount: "$28.000", time: "4:32 p. m.", status: "Entregado", statusClass: "badge-pill-blue" },
];

const MENU = [
  { name: "Hamburguesa clásica", category: "Platos fuertes", price: "$28.000", available: true },
  { name: "Pizza margarita", category: "Platos fuertes", price: "$32.000", available: true },
  { name: "Ensalada de frutas", category: "Entradas", price: "$12.000", available: true },
  { name: "Café americano", category: "Bebidas", price: "$8.000", available: false },
];

const RESTAURANT_COPY = {
  sidebar: {
    brand: {
      logoLabel: "logo",
      name: "Hotel Moderno",
      subtitle: "Panel de Administración",
    },
    logoutLabel: "Cerrar sesión",
  },
  topbar: {
    menuLabel: "Abrir menú",
    searchPlaceholder: "Buscar por habitación o cliente...",
    searchLabel: "Buscar pedidos",
    notificationsLabel: "Notificaciones",
    adminName: "Admin",
    adminRole: "Administrador",
  },
  header: {
    title: "Restaurante",
    subtitle: "Gestiona los pedidos de alimentos y bebidas de todas las habitaciones.",
    action: "+ Nuevo pedido",
  },
  panel: {
    tabs: {
      orders: "Pedidos",
      menu: "Menú",
    },
    orderColumns: {
      room: "Habitación",
      client: "Cliente",
      item: "Pedido",
      amount: "Monto",
      time: "Hora",
      status: "Estado",
      actions: "Acciones",
    },
    menuColumns: {
      name: "Plato",
      category: "Categoría",
      price: "Precio",
      availability: "Disponibilidad",
      actions: "Acciones",
    },
    available: "Disponible",
    soldOut: "Agotado",
  },
};

export default function RestauranteAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-dashboard d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        brand={RESTAURANT_COPY.sidebar.brand}
        logoutLabel={RESTAURANT_COPY.sidebar.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={openSidebar}
          labels={RESTAURANT_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={RESTAURANT_COPY.header.title}
            subtitle={RESTAURANT_COPY.header.subtitle}
            actionLabel={RESTAURANT_COPY.header.action}
          />

          <SummaryCards cards={SUMMARY_CARDS} columnClass="col-12 col-sm-4" />

          <RestaurantPanel
            orders={ORDERS}
            menu={MENU}
            labels={RESTAURANT_COPY.panel}
          />
        </main>
      </div>
    </div>
  );
}