import React, { useState } from "react";
import {
  Home,
  BedDouble,
  Utensils,
  FileText,
  User,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Wallet,
  Phone,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Datos de ejemplo. En una integración real estos vendrían de tu API
// (p. ej. GET /api/huesped/pedidos, GET /api/huesped/resumen-cuenta).
// ---------------------------------------------------------------------------
const HUESPED = { nombre: "Juan Pérez", habitacion: "Habitación 101" };

const PEDIDOS = [
  {
    id: 1,
    nombre: "Hamburguesa clásica",
    detalle: "1 Hamburguesa + Papas + Bebida",
    fecha: "8 jun. 2025 · 1:24 p. m.",
    monto: 28000,
    estado: "pagado",
    imagen:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    nombre: "Pizza margarita",
    detalle: "1 Pizza mediana",
    fecha: "7 jun. 2025 · 7:42 p. m.",
    monto: 32000,
    estado: "pagado",
    imagen:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=100&h=100&fit=crop",
  },
  {
    id: 3,
    nombre: "Ensalada de frutas",
    detalle: "1 Ensalada de frutas",
    fecha: "7 jun. 2025 · 11:18 a. m.",
    monto: 12000,
    estado: "pagado",
    imagen:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=100&h=100&fit=crop",
  },
  {
    id: 4,
    nombre: "Sándwich de pollo",
    detalle: "1 Sándwich + Bebida",
    fecha: "6 jun. 2025 · 9:03 p. m.",
    monto: 24000,
    estado: "pendiente",
    imagen:
      "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=100&h=100&fit=crop",
  },
  {
    id: 5,
    nombre: "Café americano",
    detalle: "1 Café americano",
    fecha: "6 jun. 2025 · 8:17 a. m.",
    monto: 8000,
    estado: "pagado",
    imagen:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop",
  },
  {
    id: 6,
    nombre: "Sándwich club",
    detalle: "1 Sándwich + Papas",
    fecha: "5 jun. 2025 · 4:32 p. m.",
    monto: 28000,
    estado: "pendiente",
    imagen:
      "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=100&h=100&fit=crop",
  },
];

const NAV_ITEMS = [
  { label: "Inicio", icon: Home },
  { label: "Mi habitación", icon: BedDouble },
  { label: "Alimentos y bebidas", icon: Utensils },
  { label: "Mis consumos", icon: FileText },
  { label: "Mi cuenta", icon: User },
  { label: "Configuración", icon: Settings },
];

const formatoCOP = (valor) =>
  `$${valor.toLocaleString("es-CO")} COP`;

function EstadoBadge({ estado }) {
  const esPagado = estado === "pagado";
  return (
    <span
      className={`badge rounded-pill fw-medium px-3 py-2 ${
        esPagado ? "text-success" : "text-warning-emphasis"
      }`}
      style={{
        backgroundColor: esPagado ? "#E7F7EE" : "#FEF3D6",
        color: esPagado ? "#1D9A5D" : "#B7791F",
        fontWeight: 500,
      }}
    >
      {esPagado ? "Pagado" : "Pendiente"}
    </span>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="col-12 col-md-4">
      <div className="bg-white rounded-4 p-3 h-100 d-flex align-items-start gap-3 shadow-sm border">
        <div
          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{ width: 44, height: 44, backgroundColor: iconBg }}
        >
          <Icon size={20} color={iconColor} />
        </div>
        <div>
          <div className="text-secondary small">{label}</div>
          <div className="fs-3 fw-semibold" style={{ color: "#1F2430" }}>
            {value}
          </div>
          {sub && <div className="text-secondary small">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function RoomRequests() {
  const [filtro, setFiltro] = useState("todos");

  const pedidosFiltrados =
    filtro === "todos" ? PEDIDOS : PEDIDOS.filter((p) => p.estado === filtro);

  const totalPedidos = PEDIDOS.length;
  const pagados = PEDIDOS.filter((p) => p.estado === "pagado");
  const pendientes = PEDIDOS.filter((p) => p.estado === "pendiente");
  const totalPagado = pagados.reduce((acc, p) => acc + p.monto, 0);
  const totalPendiente = pendientes.reduce((acc, p) => acc + p.monto, 0);
  const totalConsumos = totalPagado + totalPendiente;

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: "#F5F6FA" }}>
      {/* ---------------------------------------------------------------- */}
      {/* Sidebar */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className="d-none d-lg-flex flex-column bg-white border-end flex-shrink-0"
        style={{ width: 260 }}
      >
        <div className="d-flex align-items-center gap-2 px-4 py-4">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
            style={{ width: 40, height: 40, backgroundColor: "#7A1F2B" }}
          >
            HM
          </div>
          <div>
            <div className="fw-semibold" style={{ color: "#1F2430" }}>
              Hotel Moderno
            </div>
            <div className="text-secondary" style={{ fontSize: 12 }}>
              Tu estadía, nuestra prioridad
            </div>
          </div>
        </div>

        <nav className="flex-grow-1 px-3">
          {NAV_ITEMS.map(({ label, icon: Icon }) => {
            const activo = label === "Alimentos y bebidas";
            return (
              <button
                key={label}
                type="button"
                className={`btn w-100 d-flex align-items-center gap-2 text-start mb-1 rounded-3 ${
                  activo ? "text-white" : "text-secondary"
                }`}
                style={{
                  backgroundColor: activo ? "#C0392B" : "transparent",
                  fontWeight: activo ? 600 : 400,
                  padding: "10px 14px",
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button
            type="button"
            className="btn w-100 d-flex align-items-center gap-2 text-secondary"
            style={{ padding: "10px 14px" }}
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Contenido principal */}
      {/* ---------------------------------------------------------------- */}
      <main className="flex-grow-1 d-flex flex-column">
        {/* Topbar */}
        <header className="d-flex align-items-center justify-content-end gap-3 bg-white border-bottom px-4 py-3">
          <button
            type="button"
            className="btn btn-light rounded-circle position-relative d-flex align-items-center justify-content-center"
            style={{ width: 40, height: 40 }}
          >
            <Bell size={18} />
            <span
              className="position-absolute rounded-circle bg-danger"
              style={{ width: 8, height: 8, top: 8, right: 10 }}
            />
          </button>
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center"
              style={{ width: 36, height: 36 }}
            >
              <User size={18} className="text-secondary" />
            </div>
            <div className="d-none d-sm-block">
              <div className="fw-semibold small" style={{ color: "#1F2430" }}>
                {HUESPED.nombre}
              </div>
              <div className="text-secondary" style={{ fontSize: 12 }}>
                {HUESPED.habitacion}
              </div>
            </div>
            <ChevronDown size={16} className="text-secondary" />
          </div>
        </header>

        <div className="p-4">
          {/* Hero */}
          <div
            className="rounded-4 overflow-hidden position-relative mb-4"
            style={{
              minHeight: 180,
              backgroundImage:
                "linear-gradient(90deg, rgba(20,20,20,0.85) 25%, rgba(20,20,20,0.15) 75%), url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=400&fit=crop')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="p-4 p-md-5 text-white" style={{ maxWidth: 520 }}>
              <div className="text-uppercase small mb-2" style={{ opacity: 0.8, letterSpacing: 1 }}>
                Alimentos y bebidas
              </div>
              <h2 className="fw-bold mb-2">Tus pedidos en la habitación</h2>
              <p className="mb-0" style={{ opacity: 0.9 }}>
                Revisa el detalle de tus consumos y el estado de tus pagos.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Columna izquierda */}
            <div className="col-12 col-lg-8">
              {/* Stat cards */}
              <div className="row g-3 mb-4">
                <StatCard
                  icon={ShoppingBag}
                  iconBg="#FBE3E1"
                  iconColor="#C0392B"
                  label="Total de pedidos"
                  value={totalPedidos}
                  sub="desde tu llegada"
                />
                <StatCard
                  icon={CheckCircle2}
                  iconBg="#DDF3E4"
                  iconColor="#1D9A5D"
                  label="Pedidos pagados"
                  value={pagados.length}
                  sub={formatoCOP(totalPagado)}
                />
                <StatCard
                  icon={Clock}
                  iconBg="#FDF0D5"
                  iconColor="#C98A1C"
                  label="Pedidos pendientes"
                  value={pendientes.length}
                  sub={formatoCOP(totalPendiente)}
                />
              </div>

              {/* Lista de pedidos */}
              <div className="bg-white rounded-4 border shadow-sm">
                <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-2">
                  <h5 className="fw-semibold mb-0" style={{ color: "#1F2430" }}>
                    Detalle de tus pedidos
                  </h5>
                  <select
                    className="form-select form-select-sm w-auto rounded-pill"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                  >
                    <option value="todos">Todos los pedidos</option>
                    <option value="pagado">Pagados</option>
                    <option value="pendiente">Pendientes</option>
                  </select>
                </div>

                <ul className="list-unstyled mb-0">
                  {pedidosFiltrados.map((pedido) => (
                    <li
                      key={pedido.id}
                      className="d-flex align-items-center gap-3 px-4 py-3 border-top"
                      role="button"
                    >
                      <img
                        src={pedido.imagen}
                        alt={pedido.nombre}
                        className="rounded-3 flex-shrink-0"
                        style={{ width: 56, height: 56, objectFit: "cover" }}
                      />
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold" style={{ color: "#1F2430" }}>
                          {pedido.nombre}
                        </div>
                        <div className="text-secondary small">{pedido.detalle}</div>
                        <div className="text-secondary small">📅 {pedido.fecha}</div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div className="fw-semibold mb-1" style={{ color: "#1F2430" }}>
                          {formatoCOP(pedido.monto)}
                        </div>
                        <EstadoBadge estado={pedido.estado} />
                      </div>
                      <ChevronRight size={18} className="text-secondary flex-shrink-0" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="col-12 col-lg-4">
              <div className="bg-white rounded-4 border shadow-sm p-4 mb-4">
                <h6 className="fw-semibold mb-3" style={{ color: "#1F2430" }}>
                  Resumen de tu cuenta
                </h6>
                <div className="text-secondary small mb-1">Total consumos</div>
                <div className="fs-3 fw-bold mb-3" style={{ color: "#1F2430" }}>
                  {formatoCOP(totalConsumos)}
                </div>

                <div className="d-flex align-items-center justify-content-between py-2 border-top">
                  <span className="d-flex align-items-center gap-2 text-secondary small">
                    <CheckCircle2 size={16} className="text-success" /> Pagados
                  </span>
                  <span className="fw-semibold small">{formatoCOP(totalPagado)}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between py-2 border-top">
                  <span className="d-flex align-items-center gap-2 text-secondary small">
                    <Clock size={16} className="text-warning" /> Pendientes
                  </span>
                  <span className="fw-semibold small">{formatoCOP(totalPendiente)}</span>
                </div>

                <div
                  className="rounded-3 d-flex align-items-center justify-content-between px-3 py-3 mt-3"
                  style={{ backgroundColor: "#FBE9E7" }}
                >
                  <span className="d-flex align-items-center gap-2 fw-semibold" style={{ color: "#C0392B" }}>
                    <Wallet size={18} /> Total a pagar
                  </span>
                  <span className="fw-bold" style={{ color: "#C0392B" }}>
                    {formatoCOP(totalPendiente)}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn w-100 text-white fw-semibold mt-3 rounded-3 py-2"
                  style={{ backgroundColor: "#C0392B" }}
                >
                  Ver detalle completo →
                </button>
              </div>

              <div className="bg-white rounded-4 border shadow-sm p-4">
                <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2" style={{ color: "#1F2430" }}>
                  <Utensils size={16} /> ¿Dudas con algún consumo?
                </h6>
                <p className="text-secondary small mb-3">
                  Si crees que hay un error en tu pedido, por favor comunícate con recepción.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 rounded-3 d-flex align-items-center justify-content-center gap-2"
                >
                  <Phone size={16} /> Contactar recepción
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
