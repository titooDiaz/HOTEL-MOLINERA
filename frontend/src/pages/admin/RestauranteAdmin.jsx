// Panel administrativo para pedidos y menú del restaurante, conectado a la base de datos.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import RestaurantPanel from "../../components/restaurant_panel/RestaurantPanel.jsx";
import { apiRequest } from "../../api.js";
import { formatCOP } from "../../components/admin_form/formUtils.js";

const LABELS = {
  panel: {
    tabs: { orders: "Pedidos", menu: "Menú" },
    orderColumns: { room: "Habitación", client: "Cliente", item: "Pedido", amount: "Monto", time: "Hora", status: "Estado", actions: "Acciones" },
    menuColumns: { name: "Plato", category: "Categoría", price: "Precio", availability: "Disponibilidad", actions: "Acciones" },
    available: "Disponible",
    soldOut: "Agotado",
  },
};

const orderStatus = {
  pendiente: ["Pendiente", "badge-pill-amber"],
  preparando: ["En preparación", "badge-pill-orange"],
  preparado: ["Preparado", "badge-pill-blue"],
  entregado: ["Entregado", "badge-pill-emerald"],
  cancelado: ["Cancelado", "badge-pill-rose"],
};

export default function RestauranteAdmin() {
  const navigate = useNavigate();
  const [data, setData] = useState({ orders: [], menu: [] });
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/api/orders"), apiRequest("/api/foods")])
      .then(([orders, foods]) => {
        const today = new Date().toDateString();
        const todaysOrders = orders.filter((order) => new Date(order.requestedAt).toDateString() === today);
        const rows = orders.map((order) => {
          const [status, statusClass] = orderStatus[order.status] || orderStatus.pendiente;
          const profile = order.usuario?.huesped;
          return {
            room: order.habitacion?.number || "—",
            client: profile ? `${profile.firstName} ${profile.lastName}` : order.usuario?.email || "—",
            item: (order.detalles || []).map((line) => `${line.quantity} × ${line.foodName}`).join(", "),
            amount: formatCOP(Number(order.total)),
            time: new Intl.DateTimeFormat("es-VE", { hour: "numeric", minute: "2-digit" }).format(new Date(order.requestedAt)),
            status,
            statusClass,
          };
        });
        const menu = foods.map((food) => ({
          name: food.name,
          category: food.categoria?.name || "Sin categoría",
          price: formatCOP(Number(food.price)),
          available: food.isAvailable && !food.isSoldOut,
        }));
        setData({ orders: rows, menu });
        setStats([
          { label: "Pedidos hoy", value: String(todaysOrders.length), sub: "en toda la propiedad" },
          { label: "Pendientes", value: String(todaysOrders.filter((order) => order.status === "pendiente").length), sub: "por preparar o entregar" },
          { label: "Ingresos del día", value: formatCOP(todaysOrders.reduce((total, order) => total + Number(order.total), 0)), sub: "VES acumulado" },
        ]);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Restaurante" subtitle="Gestiona pedidos y productos del menú." actionLabel="+ Nuevo pedido" onAction={() => navigate("/admin/restaurante/nuevo")}>
        <Link to="/admin/restaurante/menu/nuevo" className="admin-action-button admin-action-button--outline">+ Nuevo producto</Link>
      </PageHeader>
      {loading && <p role="status">Cargando pedidos y menú...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        <SummaryCards cards={stats} columnClass="col-12 col-sm-4" />
        <RestaurantPanel orders={data.orders} menu={data.menu} labels={LABELS.panel} />
      </>}
    </>
  );
}
