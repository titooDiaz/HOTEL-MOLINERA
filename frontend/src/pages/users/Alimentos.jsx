// Página del huésped para consultar pedidos y solicitar alimentos del menú disponible.
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, ShoppingBag } from "lucide-react";
import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import OrderStatistics from "../../components/order_statistics/OrderStatistics.jsx";
import OrdersList from "../../components/orders_list/OrdersList.jsx";
import AccountSummary from "../../components/account_summary/AccountSummary.jsx";
import ReceptionHelp from "../../components/reception_help/ReceptionHelp.jsx";
import { apiRequest, postJson } from "../../api.js";
import "./Alimentos.css";

const COPY = {
  orders: {
    title: "Detalle de tus pedidos",
    filterAriaLabel: "Filtrar pedidos por estado",
    allOrders: "Todos los pedidos",
    paidOrders: "Pagados",
    pendingOrders: "Pendientes",
    paidStatus: "Pagado",
    pendingStatus: "Pendiente",
  },
  account: {
    title: "Resumen de tu cuenta",
    totalLabel: "Total consumos",
    paidLabel: "Pagados",
    pendingLabel: "Pendientes",
    totalToPayLabel: "Total a pagar",
    detailsButtonLabel: "Ver detalle completo →",
  },
  reception: {
    title: "¿Dudas con algún consumo?",
    description: "Si crees que hay un error en tu pedido, por favor comunícate con recepción.",
    buttonLabel: "Contactar recepción",
  },
};

const formatCurrency = (value) => `Bs. ${Number(value).toLocaleString("es-VE")}`;
const formatDate = (date) => new Intl.DateTimeFormat("es-VE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

export default function RoomRequests() {
  const [filter, setFilter] = useState("todos");
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const refreshOrders = () => apiRequest("/api/me/orders").then((records) => {
    setOrders(records.flatMap((order) => (order.detalles || []).map((line) => ({
      id: `${order.id}-${line.id}`,
      nombre: line.foodName,
      detalle: `${line.quantity} × ${line.foodName}`,
      fecha: formatDate(order.requestedAt),
      monto: Number(line.totalPrice),
      estado: order.paymentStatus === "pagado" ? "pagado" : "pendiente",
      imagen: "/images/restaurant/ravioli-pan-ajo.jpeg",
    }))));
  });

  useEffect(() => {
    Promise.all([apiRequest("/api/me/orders"), apiRequest("/api/foods")])
      .then(([orderRecords, foodRecords]) => {
        setOrders(orderRecords.flatMap((order) => (order.detalles || []).map((line) => ({
          id: `${order.id}-${line.id}`,
          nombre: line.foodName,
          detalle: `${line.quantity} × ${line.foodName}`,
          fecha: formatDate(order.requestedAt),
          monto: Number(line.totalPrice),
          estado: order.paymentStatus === "pagado" ? "pagado" : "pendiente",
          imagen: "/images/restaurant/ravioli-pan-ajo.jpeg",
        }))));
        setFoods(foodRecords);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const paidOrders = orders.filter((order) => order.estado === "pagado");
  const pendingOrders = orders.filter((order) => order.estado === "pendiente");
  const totalPaid = paidOrders.reduce((total, order) => total + order.monto, 0);
  const totalPending = pendingOrders.reduce((total, order) => total + order.monto, 0);
  const visibleOrders = filter === "todos" ? orders : orders.filter((order) => order.estado === filter);
  const selectedItems = useMemo(
    () => Object.entries(quantities).filter(([, quantity]) => Number(quantity) > 0).map(([id, quantity]) => ({ id: Number(id), quantity: Number(quantity) })),
    [quantities],
  );

  const submitOrder = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await postJson("/api/orders", { items: selectedItems, paymentMethod: "cargo" });
      setQuantities({});
      await refreshOrders();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <RoomRequestsHero
        eyebrow="ALIMENTOS Y BEBIDAS"
        title="Tus pedidos en la habitación"
        description="Revisa tus consumos y solicita alimentos disponibles durante tu estadía."
      />
      {loading && <p role="status">Cargando tus pedidos...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <OrderStatistics items={[
              { icon: ShoppingBag, iconBg: "#FBE3E1", iconColor: "#C0392B", label: "Total de pedidos", value: orders.length, sub: "desde tu llegada" },
              { icon: CheckCircle2, iconBg: "#DDF3E4", iconColor: "#1D9A5D", label: "Pedidos pagados", value: paidOrders.length, sub: formatCurrency(totalPaid) },
              { icon: Clock, iconBg: "#FDF0D5", iconColor: "#C98A1C", label: "Pedidos pendientes", value: pendingOrders.length, sub: formatCurrency(totalPending) },
            ]} />
            <OrdersList orders={visibleOrders} filter={filter} onFilterChange={setFilter} formatCurrency={formatCurrency} labels={COPY.orders} />
            <form className="card border-0 shadow-sm rounded-4 p-4 mt-4" onSubmit={submitOrder}>
              <h2 className="h5 mb-3">Pedir del menú</h2>
              {foods.length ? (
                <div className="d-grid gap-2">
                  {foods.map((food) => (
                    <label className="d-flex align-items-center justify-content-between gap-3 border rounded-3 p-3" key={food.id}>
                      <span><strong>{food.name}</strong><small className="d-block text-secondary">{food.categoria?.name || "Menú"} · {formatCurrency(food.price)}</small></span>
                      <input
                        className="form-control"
                        style={{ width: "90px" }}
                        type="number"
                        min="0"
                        max="99"
                        value={quantities[food.id] || 0}
                        onChange={(event) => setQuantities((current) => ({ ...current, [food.id]: event.target.value }))}
                        aria-label={`Cantidad de ${food.name}`}
                      />
                    </label>
                  ))}
                </div>
              ) : <p className="text-secondary">No hay productos disponibles en este momento.</p>}
              <button className="btn btn-primary mt-3 align-self-start" type="submit" disabled={!selectedItems.length || submitting || !foods.length}>
                {submitting ? "Enviando pedido..." : "Enviar pedido"}
              </button>
            </form>
          </div>
          <div className="col-12 col-lg-4">
            <AccountSummary
              totalConsumos={totalPaid + totalPending}
              totalPagado={totalPaid}
              totalPendiente={totalPending}
              formatCurrency={formatCurrency}
              labels={COPY.account}
            />
            <ReceptionHelp labels={COPY.reception} />
          </div>
        </div>
      )}
    </div>
  );
}
