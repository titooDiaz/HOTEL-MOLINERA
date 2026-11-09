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
import { formatConfiguredDate } from "../../utils/userSettings.js";

const COPY = {
  orders: {
    title: "Detalle de tus pedidos",
    filterAriaLabel: "Filtrar pedidos por estado",
    allOrders: "Todos los pedidos",
    paidOrders: "Pagados",
    pendingOrders: "Pendientes",
    cancelledOrders: "Cancelados",
    paidStatus: "Pagado",
    pendingStatus: "Pendiente",
    cancelledStatus: "Cancelado",
    preparingStatus: "En preparación",
    preparedStatus: "Preparado",
    onTheWayStatus: "En camino",
    deliveredStatus: "Entregado",
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
const formatDate = (date) => formatConfiguredDate(date, { dateStyle: "medium", timeStyle: "short" });

export default function RoomRequests() {
  const [filter, setFilter] = useState("todos");
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [error, setError] = useState("");
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const updateOrders = (records) => {
    setOrderDetails(records);
    setOrders(records.flatMap((order) => (order.detalles || []).map((line) => {
      const orderCode = order.orderCode || `#${order.id}`;
      return {
        id: `${order.id}-${line.id}`,
        nombre: line.foodName,
        detalle: `${line.quantity} × ${line.foodName} · Pedido ${orderCode}`,
        fecha: formatDate(order.requestedAt),
        monto: Number(line.totalPrice),
        estado: order.paymentStatus === "pagado" ? "pagado" : "pendiente",
        orderId: order.id,
        orderCode,
        orderStatus: order.status,
        imagen: "/images/restaurant/ravioli-pan-ajo.jpeg",
      };
    })));
  };

  const refreshOrders = () => apiRequest("/api/me/orders").then(updateOrders);

  useEffect(() => {
    Promise.all([apiRequest("/api/me/orders"), apiRequest("/api/foods"), apiRequest("/api/food-categories")])
      .then(([orderRecords, foodRecords, categoryRecords]) => {
        updateOrders(orderRecords);
        setFoods(foodRecords);
        setCategories(categoryRecords);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshOrders().catch((requestError) => setError(requestError.message));
    }, 10000);
    return () => window.clearInterval(intervalId);
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
  const visibleFoods = activeCategory === "all"
    ? foods
    : foods.filter((food) => String(food.categoryId || food.categoria?.id) === activeCategory);
  const selectedFoods = foods.filter((food) => Number(quantities[food.id]) > 0);
  const selectedTotal = selectedFoods.reduce((total, food) => total + Number(food.price) * Number(quantities[food.id]), 0);
  const updateQuantity = (foodId, amount) => {
    setQuantities((current) => {
      const next = Math.max(0, Math.min(99, Number(current[foodId] || 0) + amount));
      return { ...current, [foodId]: next || "" };
    });
  };

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

  const cancelOrder = async (order) => {
    if (!window.confirm(`¿Cancelar el pedido ${order.orderCode || `#${order.orderId}`}?`)) return;
    setError("");
    setCancellingOrderId(order.orderId);
    try {
      await apiRequest(`/api/me/orders/${order.orderId}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await refreshOrders();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCancellingOrderId(null);
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
            <OrdersList
              orders={visibleOrders}
              filter={filter}
              onFilterChange={setFilter}
              formatCurrency={formatCurrency}
              labels={COPY.orders}
              onCancelOrder={cancelOrder}
              cancellingOrderId={cancellingOrderId}
            />
            <form className="card border-0 shadow-sm rounded-4 p-4 mt-4 food-menu-card" onSubmit={submitOrder}>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">Pedir del menú</h2>
                  <p className="small text-secondary mb-0">Elige una categoría y agrega tus productos.</p>
                </div>
                {selectedFoods.length > 0 && <span className="badge rounded-pill text-bg-danger">{selectedItems.reduce((sum, item) => sum + item.quantity, 0)} productos</span>}
              </div>
              <div className="food-category-tabs" role="tablist" aria-label="Categorías del menú">
                <button type="button" className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")}>Todo</button>
                {categories.map((category) => (
                  <button type="button" className={activeCategory === String(category.id) ? "active" : ""} key={category.id} onClick={() => setActiveCategory(String(category.id))}>
                    {category.name}
                  </button>
                ))}
              </div>
              {foods.length ? (
                <div className="food-menu-grid">
                  {visibleFoods.map((food) => (
                    <article className="food-menu-item" key={food.id}>
                      <img src={food.imageUrl || "/images/restaurant/ravioli-pan-ajo.jpeg"} alt={food.name} />
                      <div className="food-menu-item-content">
                        <div className="d-flex justify-content-between gap-2">
                          <h3>{food.name}</h3>
                          <strong>{formatCurrency(food.price)}</strong>
                        </div>
                        <p>{food.description || food.categoria?.name || "Preparación del restaurante"}</p>
                        <div className="food-menu-item-actions">
                          {Number(quantities[food.id]) > 0 && <button type="button" onClick={() => updateQuantity(food.id, -1)} aria-label={`Quitar ${food.name}`}>−</button>}
                          {Number(quantities[food.id]) > 0 && <span>{quantities[food.id]}</span>}
                          <button type="button" className="food-add-button" onClick={() => updateQuantity(food.id, 1)} aria-label={`Agregar ${food.name}`}>+</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <p className="text-secondary">No hay productos disponibles en este momento.</p>}
              <button className="btn btn-primary mt-3 align-self-start" type="submit" disabled={!selectedItems.length || submitting || !foods.length}>
                {submitting ? "Enviando pedido..." : "Enviar pedido"}
              </button>
            </form>
          </div>
          <div className="col-12 col-lg-4">
            <section className="selected-order-card card border-0 shadow-sm rounded-4 p-4 mb-4" aria-live="polite">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Tu pedido</h2>
                {selectedFoods.length > 0 && <button type="button" className="btn btn-link btn-sm p-0 text-danger" onClick={() => setQuantities({})}>Vaciar</button>}
              </div>
              {selectedFoods.length ? (
                <>
                  <div className="selected-order-list">
                    {selectedFoods.map((food) => (
                      <div className="selected-order-line" key={food.id}>
                        <img src={food.imageUrl || "/images/restaurant/ravioli-pan-ajo.jpeg"} alt="" />
                        <div><strong>{food.name}</strong><small>{quantities[food.id]} × {formatCurrency(food.price)}</small></div>
                        <b>{formatCurrency(Number(food.price) * Number(quantities[food.id]))}</b>
                      </div>
                    ))}
                  </div>
                  <div className="selected-order-total"><span>Total</span><strong>{formatCurrency(selectedTotal)}</strong></div>
                </>
              ) : <p className="small text-secondary mb-0">Agrega productos con el botón + y aparecerán aquí.</p>}
            </section>
            <AccountSummary
              totalConsumos={totalPaid + totalPending}
              totalPagado={totalPaid}
              totalPendiente={totalPending}
              formatCurrency={formatCurrency}
              labels={COPY.account}
              onDetailsClick={() => setShowOrderDetails(true)}
            />
            <ReceptionHelp labels={COPY.reception} />
          </div>
        </div>
      )}
      {showOrderDetails && (
        <div
          className="food-order-details-backdrop"
          onClick={() => setShowOrderDetails(false)}
        >
          <section
            className="food-order-details-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-order-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
              <div>
                <h2 className="h4 mb-1" id="food-order-details-title">Detalle de alimentos y bebidas</h2>
                <p className="text-secondary mb-0">Resumen completo de tus pedidos y consumos.</p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar detalle"
                onClick={() => setShowOrderDetails(false)}
              />
            </div>

            {orderDetails.length ? (
              <>
                <div className="food-order-details-list">
                  {orderDetails.map((order) => (
                    <article className="food-order-details-card" key={order.id}>
                      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                        <div>
                          <h3 className="h6 mb-1">Pedido {order.orderCode || `#${order.id}`}</h3>
                          <p className="small text-secondary mb-0">{formatDate(order.requestedAt)}</p>
                        </div>
                        <span className="badge rounded-pill bg-light text-dark align-self-start">
                          {order.status === "cancelado" ? "Cancelado" : order.paymentStatus === "pagado" ? "Pagado" : "Pendiente de pago"}
                        </span>
                      </div>

                      <ul className="list-unstyled mb-3">
                        {(order.detalles || []).map((line) => (
                          <li className="food-order-details-line" key={line.id}>
                            <span>{line.quantity} × {line.foodName}</span>
                            <span>{formatCurrency(line.totalPrice)}</span>
                          </li>
                        ))}
                      </ul>

                      <dl className="food-order-details-totals mb-0">
                        <div><dt>Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
                        {Number(order.taxes) > 0 && (
                          <div><dt>Impuestos</dt><dd>{formatCurrency(order.taxes)}</dd></div>
                        )}
                        <div className="food-order-details-total">
                          <dt>Total del pedido</dt><dd>{formatCurrency(order.total)}</dd>
                        </div>
                      </dl>
                      {order.notes && <p className="small text-secondary mt-3 mb-0">Nota: {order.notes}</p>}
                    </article>
                  ))}
                </div>

                <div className="food-order-details-grand-total">
                  <span>Total consumido</span>
                  <strong>{formatCurrency(totalPaid + totalPending)}</strong>
                </div>
              </>
            ) : (
              <p className="text-secondary">Todavía no tienes pedidos de alimentos y bebidas.</p>
            )}

            <button
              type="button"
              className="btn account-button w-100 mt-4"
              onClick={() => setShowOrderDetails(false)}
            >
              Cerrar
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
