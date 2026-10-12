import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HotelDashboard.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import { NAV_ITEMS, SIDEBAR_COPY, buildTopbarCopy } from "../../components/nav/adminNavItems.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { formatCOP, postJson } from "../../components/admin_form/formUtils.js";

// Datos de ejemplo: mientras no exista la API, estas listas salen de aquí.
// TODO: cargar habitaciones ocupadas y menú desde el backend.
const OCCUPIED_ROOMS = [
  { number: "101", guest: "Juan Pérez" },
  { number: "201", guest: "Laura Gómez" },
  { number: "202", guest: "Andrés Ruiz" },
  { number: "301", guest: "María Torres" },
  { number: "401", guest: "Camilo Vargas" },
];

const MENU = [
  { id: "hamburguesa", name: "Hamburguesa clásica", category: "Platos fuertes", price: 28000 },
  { id: "pizza", name: "Pizza margarita", category: "Platos fuertes", price: 32000 },
  { id: "sandwich-pollo", name: "Sándwich de pollo", category: "Platos fuertes", price: 24000 },
  { id: "sandwich-club", name: "Sándwich club", category: "Platos fuertes", price: 28000 },
  { id: "ensalada", name: "Ensalada de frutas", category: "Entradas", price: 12000 },
  { id: "cafe", name: "Café americano", category: "Bebidas", price: 8000, soldOut: true },
];

const FORM_SECTIONS = [
  {
    id: "order",
    title: "Datos del pedido",
    fields: [
      {
        id: "roomId",
        label: "Habitación",
        placeholder: "Selecciona una habitación",
        required: true,
        defaultValue: "",
        hint: "Solo aparecen habitaciones con huésped.",
        options: OCCUPIED_ROOMS.map((room) => ({
          value: room.number,
          label: `Hab. ${room.number} · ${room.guest}`,
        })),
      },
      {
        id: "paymentMethod",
        label: "Forma de pago",
        defaultValue: "cargo",
        options: [
          { value: "cargo", label: "Cargar a la habitación" },
          { value: "efectivo", label: "Efectivo" },
          { value: "tarjeta", label: "Tarjeta" },
        ],
      },
      {
        id: "notes",
        label: "Notas para la cocina",
        type: "textarea",
        rows: 3,
        colClass: "col-12",
        placeholder: "Sin cebolla, término medio, alergias...",
      },
    ],
  },
  {
    id: "items",
    title: "Productos",
    description: "Elige los platos y bebidas con el botón +. Los agotados no se pueden agregar.",
    items: MENU.map((dish) => ({
      id: dish.id,
      label: dish.name,
      description: dish.soldOut ? `${dish.category} · Agotado` : dish.category,
      price: dish.price,
      max: 20,
      disabled: dish.soldOut,
    })),
  },
];

const NEW_ORDER_COPY = {
  topbar: buildTopbarCopy("Buscar por habitación o cliente...", "Buscar pedidos"),
  header: {
    title: "Nuevo pedido",
    subtitle: "Registra un pedido de alimentos y bebidas para una habitación.",
    back: "← Volver al restaurante",
  },
  form: {
    submit: "Registrar pedido",
    cancel: "Cancelar",
    sending: "Guardando...",
    successMessage: "Pedido registrado correctamente. Puedes tomar otro o volver al restaurante.",
    errorMessage: "No pudimos registrar el pedido. Inténtalo de nuevo.",
    decrease: "Quitar uno de",
    increase: "Agregar uno de",
  },
  summary: {
    title: "Resumen del pedido",
    total: "Total del pedido",
  },
  emptyItems: "Agrega al menos un producto al pedido.",
};

const findDish = (id) => MENU.find((dish) => dish.id === id);

const validatePedido = (payload) => (payload.items.length === 0 ? NEW_ORDER_COPY.emptyItems : null);

function renderSummary(payload) {
  if (payload.items.length === 0) return null;

  const total = payload.items.reduce((sum, line) => sum + findDish(line.id).price * line.quantity, 0);

  return (
    <>
      <h2 className="aform-summary-title">{NEW_ORDER_COPY.summary.title}</h2>
      <dl className="aform-summary-list">
        {payload.items.map((line) => {
          const dish = findDish(line.id);
          return (
            <div className="aform-summary-row" key={line.id}>
              <dt>{line.quantity} × {dish.name}</dt>
              <dd>{formatCOP(dish.price * line.quantity)}</dd>
            </div>
          );
        })}
        <div className="aform-summary-row aform-summary-row--total">
          <dt>{NEW_ORDER_COPY.summary.total}</dt>
          <dd>{formatCOP(total)}</dd>
        </div>
      </dl>
    </>
  );
}

// TODO: el backend aún no tiene la ruta POST /api/orders (ver backend/src/app.js)
const crearPedido = (datos) => postJson("/api/orders", datos);

export default function NuevoPedido() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-dashboard admin-view d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brand={SIDEBAR_COPY.brand}
        logoutLabel={SIDEBAR_COPY.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={() => setSidebarOpen(true)}
          labels={NEW_ORDER_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={NEW_ORDER_COPY.header.title}
            subtitle={NEW_ORDER_COPY.header.subtitle}
          >
            <Link to="/admin/restaurante" className="admin-action-button admin-action-button--outline">
              {NEW_ORDER_COPY.header.back}
            </Link>
          </PageHeader>

          <AdminForm
            sections={FORM_SECTIONS}
            labels={NEW_ORDER_COPY.form}
            validate={validatePedido}
            summary={renderSummary}
            onSubmit={crearPedido}
            onCancel={() => navigate("/admin/restaurante")}
          />
        </main>
      </div>
    </div>
  );
}