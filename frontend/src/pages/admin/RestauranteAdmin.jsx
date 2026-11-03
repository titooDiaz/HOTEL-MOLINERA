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
    orderColumns: { room: "Habitación", client: "Cliente", item: "Pedido", details: "Detalle", amount: "Monto", time: "Hora", status: "Estado", actions: "Acciones" },
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

  const loadData = async () => {
    setError("");
    try {
      const [orders, foods] = await Promise.all([apiRequest("/api/orders"), apiRequest("/api/foods")]);
      const today = new Date().toDateString();
      const todaysOrders = orders.filter((order) => new Date(order.requestedAt).toDateString() === today);
      const activeOrdersToday = todaysOrders.filter((order) => order.status !== "cancelado");
      const paidOrdersToday = activeOrdersToday.filter((order) => order.paymentStatus === "pagado");
      const rows = orders.map((order) => {
        const isCancelled = order.status === "cancelado";
        const isPaid = order.paymentStatus === "pagado" && !isCancelled;
        const [status, statusClass] = isCancelled
          ? orderStatus.cancelado
          : isPaid
            ? ["Pagado", "badge-pill-emerald"]
            : ["—", "badge-pill-slate"];
        const profile = order.usuario?.huesped;
          const detailLines = (order.detalles || []).map((line) => ({
            name: line.foodName,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            totalPrice: Number(line.totalPrice)
          }));
        return {
          id: order.id,
            roomId: order.roomId || order.habitacion?.id || null,
          room: order.habitacion?.number || "—",
          client: profile ? `${profile.firstName} ${profile.lastName}` : order.usuario?.email || "—",
          item: (order.detalles || []).map((line) => `${line.quantity} × ${line.foodName}`).join(", "),
            details: detailLines,
            detailsText: detailLines.map((line) => `${line.quantity}× ${line.name}`).join(" · "),
          amount: formatCOP(Number(order.total)),
          time: new Intl.DateTimeFormat("es-VE", { hour: "numeric", minute: "2-digit" }).format(new Date(order.requestedAt)),
          status,
          statusClass,
          rawStatus: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          paymentMethodLabel: ({ efectivo: "Efectivo", tarjeta: "Tarjeta", cargo: "Cargo a habitación" })[order.paymentMethod] || "",
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
        { label: "Pedidos hoy", value: String(todaysOrders.length), sub: "incluye pedidos cancelados" },
        { label: "Pendientes", value: String(activeOrdersToday.filter((order) => order.status === "pendiente").length), sub: "por preparar o entregar" },
        { label: "Ventas pagadas hoy", value: formatCOP(paidOrdersToday.reduce((total, order) => total + Number(order.total), 0)), sub: "excluye pedidos cancelados" },
      ]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderAction = async (order, action, paymentMethod) => {
    if (action === "add") {
      const roomId = order.roomId ? String(order.roomId) : "";
      navigate(`/admin/restaurante/nuevo?orderId=${order.id}${roomId ? `&roomId=${roomId}` : ""}`);
      return;
    }
    if (action === "cancel" && !window.confirm(`¿Deseas cancelar el pedido de la habitación ${order.room}?`)) return;

    try {
      if (action === "cancel") {
        await apiRequest(`/api/orders/${order.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "cancelado", reason: "Cancelado desde el panel administrativo." }),
        });
      } else if (action === "paid") {
        await apiRequest(`/api/orders/${order.id}/payment`, {
          method: "PATCH",
          body: JSON.stringify({ paymentStatus: "pagado", paymentMethod }),
        });
      }
      // Releer pedidos y estadísticas mediante API, sin recargar la página.
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
      window.alert(`No se pudo actualizar el pedido: ${requestError.message}`);
    }
  };

  return (
    <>
      <PageHeader title="Restaurante" subtitle="Gestiona pedidos y productos del menú." actionLabel="+ Nuevo pedido" onAction={() => navigate("/admin/restaurante/nuevo")}>
        <Link to="/admin/restaurante/menu/nuevo" className="admin-action-button admin-action-button--outline">+ Nuevo producto</Link>
      </PageHeader>
      {loading && <p role="status">Cargando pedidos y menú...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        <SummaryCards cards={stats} columnClass="col-12 col-sm-4" />
        <RestaurantPanel orders={data.orders} menu={data.menu} labels={LABELS.panel} onOrderAction={handleOrderAction} />
      </>}
    </>
  );
}
