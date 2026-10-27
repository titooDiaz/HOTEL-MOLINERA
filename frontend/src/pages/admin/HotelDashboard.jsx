// Panel principal de administración con métricas y actividad real del hotel.
import { useEffect, useMemo, useState } from "react";
import "./HotelDashboard.css";
import DashboardIcon from "../../components/icon/DashboardIcon.jsx";
import StatsAndActions from "../../components/dashboard_stats/StatsAndActions.jsx";
import DashboardAnalytics from "../../components/dashboard_analytics/DashboardAnalytics.jsx";
import ReservationsOverview from "../../components/reservations_overview/ReservationsOverview.jsx";
import { apiRequest } from "../../api.js";
import { useAuth } from "../../context/authContext.js";

const QUICK_ACTIONS = [
  { label: "Nueva reserva", to: "/admin/reservas/nueva", variant: "quick-action-btn--rose", icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></> },
  { label: "Gestionar habitaciones", to: "/admin/habitaciones", variant: "quick-action-btn--blue", icon: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" /></> },
  { label: "Registrar cliente", to: "/admin/clientes/nuevo", variant: "quick-action-btn--emerald", icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
  { label: "Gestionar restaurante", to: "/admin/restaurante", variant: "quick-action-btn--violet", icon: <><path d="M3 2v7c0 1.1.9 2 2 2h1v11M7 2v20M14 2v20M17 2c-2 3-2 6 0 9v11" /></> },
];

const COLORS = ["var(--blue-500)", "var(--emerald-500)", "var(--orange-500)", "var(--violet-500)", "var(--rose-500)"];
const STATUS = {
  confirmada: ["Confirmada", "badge-pill-emerald"],
  proceso: ["En proceso", "badge-pill-amber"],
  cancelada: ["Cancelada", "badge-pill-rose"],
  cancelado: ["Cancelada", "badge-pill-rose"],
};
const formatDate = (date) => date ? new Intl.DateTimeFormat("es-VE").format(new Date(`${date}T00:00:00`)) : "—";

export default function HotelDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ rooms: [], reservations: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/api/rooms"), apiRequest("/api/reservations"), apiRequest("/api/orders")])
      .then(([rooms, reservations, orders]) => setData({ rooms, reservations, orders }))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const metrics = useMemo(() => {
    const activeReservations = data.reservations.filter((reservation) =>
      reservation.checkIn <= today && reservation.checkOut > today && !["cancelada", "cancelado"].includes(reservation.status),
    );
    const occupiedRoomIds = new Set(activeReservations.map((reservation) => String(reservation.roomId)));
    const todayReservations = data.reservations.filter((reservation) => reservation.checkIn === today);
    const todaysOrders = data.orders.filter((order) => new Date(order.requestedAt).toISOString().slice(0, 10) === today);
    const paidOrdersToday = todaysOrders.filter((order) => order.paymentStatus === "pagado");
    const clientCount = new Set(activeReservations.map((reservation) => String(reservation.userId))).size;
    const occupancy = data.rooms.length ? Math.round(occupiedRoomIds.size / data.rooms.length * 100) : 0;
    const roomTypeCounts = new Map();
    data.rooms.forEach((room) => roomTypeCounts.set(room.type, (roomTypeCounts.get(room.type) || 0) + 1));
    const roomTypes = [...roomTypeCounts.entries()].map(([label, count], index) => ({
      label,
      count,
      pct: data.rooms.length ? Math.round(count / data.rooms.length * 100) : 0,
      color: COLORS[index % COLORS.length],
    }));
    const reservations = [...data.reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((reservation) => {
      const guest = reservation.usuario?.huesped;
      const [status, statusClass] = STATUS[reservation.status] || STATUS.proceso;
      return {
        id: reservation.reservationCode,
        client: guest ? `${guest.firstName} ${guest.lastName}` : reservation.usuario?.email || "—",
        room: `${reservation.habitacion?.type || "Habitación"} (${reservation.habitacion?.number || "—"})`,
        checkin: formatDate(reservation.checkIn),
        checkout: formatDate(reservation.checkOut),
        status,
        statusClass,
      };
    });
    const orderActivity = data.orders.slice(0, 3).map((order) => ({
      time: new Intl.DateTimeFormat("es-VE", { hour: "2-digit", minute: "2-digit" }).format(new Date(order.requestedAt)),
      title: `Pedido ${order.orderCode}`,
      subtitle: `${order.detalles?.length || 0} productos · Habitación ${order.habitacion?.number || "—"}`,
      colorClass: "activity-icon-violet",
      icon: <path d="M3 2v7c0 1.1.9 2 2 2h1v11M7 2v20M14 2v20" />,
      timestamp: new Date(order.requestedAt),
    }));
    const reservationActivity = data.reservations.slice(0, 3).map((reservation) => ({
      time: new Intl.DateTimeFormat("es-VE", { hour: "2-digit", minute: "2-digit" }).format(new Date(reservation.createdAt)),
      title: `Reserva ${reservation.reservationCode}`,
      subtitle: `${reservation.habitacion?.type || "Habitación"} · ${reservation.guests} huéspedes`,
      colorClass: "activity-icon-emerald",
      icon: <polyline points="20 6 9 17 4 12" strokeWidth="2.5" />,
      timestamp: new Date(reservation.createdAt),
    }));
    const recentActivity = [...orderActivity, ...reservationActivity]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
    const statCards = [
      {
        label: "Habitaciones ocupadas",
        value: `${occupiedRoomIds.size} / ${data.rooms.length}`,
        badgeClass: "icon-badge-blue",
        icon: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20" /></>,
        footer: "progress",
        progressPct: occupancy,
        progressColor: "bg-blue-400",
        footerText: `${occupancy}% de ocupación`,
        footerTextColor: "var(--blue-500)",
      },
      {
        label: "Reservas hoy",
        value: String(todayReservations.length),
        badgeClass: "icon-badge-emerald",
        icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
        footer: "trend",
        trendText: "check-ins del día",
      },
      {
        label: "Ingresos de hoy",
        value: `Bs. ${Math.round(paidOrdersToday.reduce((sum, order) => sum + Number(order.total), 0)).toLocaleString("es-VE")}`,
        badgeClass: "icon-badge-violet",
        icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
        footer: "trend",
        trendText: "pedidos del restaurante",
      },
      {
        label: "Clientes activos",
        value: String(clientCount),
        badgeClass: "icon-badge-rose",
        icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
        footer: "trend",
        trendText: "con estadía activa",
      },
    ];
    return { statCards, roomTypes, reservations, occupancy, recentActivity };
  }, [data, today]);

  const labels = {
    quickActionsTitle: "Acciones rápidas",
    analytics: {
      occupancyTitle: "Ocupación de habitaciones",
      defaultPeriod: "7",
      periodLabel: "Período del gráfico",
      periodOptions: [{ value: "7", label: "Últimos 7 días" }, { value: "30", label: "Últimos 30 días" }],
      occupancyAxisLabels: ["100%", "75%", "50%", "25%", "0%"],
      timelineLabels: ["Hace 6 d", "Hace 5 d", "Hace 4 d", "Hace 3 d", "Hace 2 d", "Ayer", "Hoy"],
      roomTypesTitle: "Tipo de habitaciones",
      roomCount: data.rooms.length,
      roomCountCaption: "total",
      recentActivityTitle: "Actividad reciente",
    },
    reservations: {
      title: "Reservas recientes",
      viewAll: "Ver todas",
      columns: {
        reservation: "# Reserva",
        client: "Cliente",
        room: "Habitación",
        checkIn: "Check-in",
        checkOut: "Check-out",
        status: "Estado",
        actions: "Acciones",
      },
      occupancyTitle: "Ocupación general",
    },
  };
  const now = new Date();

  return (
    <>
      <div className="d-flex flex-column flex-sm-row justify-content-sm-between align-items-sm-start gap-2 mb-4">
        <div>
          <h1 className="fw-semibold text-slate-800 mb-0" style={{ fontSize: "1.375rem" }}>¡Bienvenido, {user?.name || "Administrador"}!</h1>
          <p className="text-slate-500 mt-1 mb-0" style={{ fontSize: ".875rem" }}>Aquí tienes un resumen actualizado del hotel.</p>
        </div>
        <div className="d-flex align-items-center gap-3 text-slate-500 flex-shrink-0" style={{ fontSize: ".875rem" }}>
          <div className="d-flex align-items-center gap-2"><DashboardIcon width={15} height={15}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></DashboardIcon>{new Intl.DateTimeFormat("es-VE", { dateStyle: "long" }).format(now)}</div>
          <div>{new Intl.DateTimeFormat("es-VE", { timeStyle: "short" }).format(now)}</div>
        </div>
      </div>
      {loading && <p role="status">Cargando indicadores...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        <StatsAndActions statCards={metrics.statCards} quickActions={QUICK_ACTIONS} quickActionsTitle={labels.quickActionsTitle} />
        <DashboardAnalytics roomTypes={metrics.roomTypes} recentActivity={metrics.recentActivity} labels={labels.analytics} />
        <ReservationsOverview
          reservations={metrics.reservations}
          labels={labels.reservations}
          occupancy={{ percent: metrics.occupancy, caption: `${Math.round(metrics.occupancy / 100 * data.rooms.length)} de ${data.rooms.length} habitaciones ocupadas` }}
        />
      </>}
    </>
  );
}
