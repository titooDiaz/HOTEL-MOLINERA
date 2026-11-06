// Alterna entre las tablas administrativas de pedidos y productos del menú.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { formatCOP } from "../admin_form/formUtils.js";
import FoodManagementModal from "./FoodManagementModal.jsx";
import FoodCategoriesModal from "./FoodCategoriesModal.jsx";

export default function RestaurantPanel({
  orders,
  menu,
  categories,
  labels,
  onOrderAction,
  onFoodDelete,
  onFoodUpdated,
  onCategoriesChanged,
}) {
  const [activeTab, setActiveTab] = useState("orders");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [foodManagement, setFoodManagement] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const isOrders = activeTab === "orders";
  const rows = isOrders ? orders : menu;
  const columns = isOrders ? labels.orderColumns : labels.menuColumns;

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!event.target.closest(".restaurant-actions, .restaurant-actions-menu")) setActiveMenuId(null);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setActiveMenuId(null);
        setSelectedOrder(null);
        setPaymentOrder(null);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const runOrderAction = (row, action, value) => {
    setActiveMenuId(null);
    onOrderAction?.(row, action, value);
  };

  const submitPayment = (event) => {
    event.preventDefault();
    const order = paymentOrder;
    setPaymentOrder(null);
    if (order) onOrderAction?.(order, "paid", paymentMethod);
  };

  return (
    <section className="card-panel admin-data-panel restaurant-panel">
      <div className="admin-panel-heading admin-restaurant-heading">
        <div className="admin-tabs" role="tablist" aria-label="Sección del restaurante">
          <button className={`admin-tab${isOrders ? " is-active" : ""}`} type="button" role="tab" aria-selected={isOrders} onClick={() => setActiveTab("orders")}>{labels.tabs.orders}</button>
          <button className={`admin-tab${!isOrders ? " is-active" : ""}`} type="button" role="tab" aria-selected={!isOrders} onClick={() => setActiveTab("menu")}>{labels.tabs.menu}</button>
        </div>
        {!isOrders && <button className="admin-action-button admin-action-button--outline" type="button" onClick={() => setShowCategories(true)}>Gestionar categorías</button>}
      </div>
      <div className="admin-table-wrap">
        <table className="table admin-table align-middle mb-0">
          <thead><tr>{Object.values(columns).map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr className={activeMenuId?.key === row.id ? "restaurant-actions-open" : ""} key={row.id}>
              {isOrders ? <>
                <td className="fw-semibold">{row.room}</td><td>{row.client}</td><td>{row.item}</td>
                <td><button className="restaurant-order-details-trigger" type="button" onClick={() => setSelectedOrder(row)}>Ver detalle</button></td>
                <td>{row.amount}</td><td>{row.time}</td>
                <td>
                  <span className={`admin-status-badge ${row.statusClass}`}>{row.status}</span>
                  {row.paymentStatus === "pagado" && row.paymentMethodLabel && <span className="admin-table-secondary">{row.paymentMethodLabel}</span>}
                </td>
              </> : <>
                <td className="fw-semibold">{row.name}</td><td>{row.category}</td><td>{row.price}</td>
                <td><span className={`admin-status-badge ${row.available ? "badge-pill-emerald" : "badge-pill-slate"}`}>{row.available ? labels.available : labels.soldOut}</span></td>
                <td>{row.stockQuantity == null ? "Sin límite" : row.stockQuantity}</td>
              </>}
              <td>
                {!(isOrders && row.rawStatus === "cancelado") && <div className="client-actions restaurant-actions">
                  <button
                    className="admin-table-action"
                    type="button"
                    aria-label={`Acciones de fila ${index + 1}`}
                    aria-expanded={activeMenuId?.key === row.id}
                    onClick={(event) => {
                      const key = row.id;
                      if (activeMenuId?.key === key) {
                        setActiveMenuId(null);
                        return;
                      }
                      const rect = event.currentTarget.getBoundingClientRect();
                      const menuWidth = Math.min(288, window.innerWidth - 24);
                      const menuHeight = isOrders ? 300 : 160;
                      const top = rect.bottom + menuHeight + 8 > window.innerHeight
                        ? Math.max(12, rect.top - menuHeight - 8)
                        : rect.bottom + 8;
                      setActiveMenuId({
                        key,
                        top,
                        left: Math.max(12, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)),
                      });
                    }}
                  >•••</button>
                </div>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {activeMenuId && createPortal(
        <div className="client-actions-menu restaurant-actions-menu" style={{ top: activeMenuId.top, left: activeMenuId.left }}>
          {isOrders ? (() => {
            const row = orders.find((order) => order.id === activeMenuId.key);
            return row ? <>
              <button type="button" onClick={() => { setActiveMenuId(null); setPaymentMethod(row.paymentMethod || "efectivo"); setPaymentOrder(row); }}>{row.paymentStatus === "pagado" ? "Actualizar método de pago" : "Marcar como pagado"}</button>
              {row.rawStatus === "pendiente" && <button type="button" onClick={() => runOrderAction(row, "status", "preparando")}>Iniciar preparación</button>}
              {row.rawStatus === "preparando" && <button type="button" onClick={() => runOrderAction(row, "status", "preparado")}>Marcar preparado</button>}
              {row.rawStatus === "preparado" && <button type="button" onClick={() => runOrderAction(row, "status", "en_camino")}>Marcar en camino</button>}
              {row.rawStatus === "en_camino" && <button type="button" onClick={() => runOrderAction(row, "status", "entregado")}>Marcar entregado</button>}
              {row.rawStatus === "pendiente" && <button type="button" onClick={() => runOrderAction(row, "cancel")}>Cancelar pedido</button>}
              <button type="button" onClick={() => runOrderAction(row, "add")}>Agregar más productos</button>
            </> : null;
          })() : (() => {
            const food = menu.find((item) => item.id === activeMenuId.key);
            return food ? <>
              <button type="button" onClick={() => { setActiveMenuId(null); setFoodManagement({ food, mode: "edit" }); }}>Editar producto</button>
              <button type="button" onClick={() => { setActiveMenuId(null); setFoodManagement({ food, mode: "availability" }); }}>Gestionar stock y disponibilidad</button>
              <button type="button" className="client-actions-delete" onClick={() => { setActiveMenuId(null); onFoodDelete?.(food); }}>Eliminar producto</button>
              <Link to="/admin/restaurante/menu/nuevo" onClick={() => setActiveMenuId(null)}>Nuevo producto</Link>
            </> : null;
          })()}
        </div>,
        document.body,
      )}
      {paymentOrder && createPortal(
        <div className="restaurant-order-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentOrder(null); }}>
          <section className="restaurant-order-modal restaurant-payment-modal" role="dialog" aria-modal="true" aria-labelledby="restaurant-payment-title">
            <header className="restaurant-order-modal-header">
              <div>
                <p className="restaurant-order-modal-eyebrow">Pedido · Habitación {paymentOrder.room}</p>
                <h2 id="restaurant-payment-title">Registrar pago</h2>
                <p className="restaurant-order-modal-client">Elige el método con el que se pagó el pedido.</p>
              </div>
              <button type="button" className="restaurant-order-modal-close" aria-label="Cerrar ventana de pago" onClick={() => setPaymentOrder(null)}>×</button>
            </header>
            <form onSubmit={submitPayment}>
              <label className="restaurant-payment-label" htmlFor="restaurant-payment-method">Método de pago</label>
              <select id="restaurant-payment-method" className="restaurant-payment-select" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="cargo">Cargo a la habitación</option>
              </select>
              <div className="restaurant-payment-total"><span>Total a registrar</span><strong>{paymentOrder.amount}</strong></div>
              <footer className="restaurant-payment-actions">
                <button className="admin-action-button admin-action-button--outline" type="button" onClick={() => setPaymentOrder(null)}>Cancelar</button>
                <button className="admin-action-button admin-action-button--primary" type="submit">Confirmar pago</button>
              </footer>
            </form>
          </section>
        </div>,
        document.body,
      )}
      {selectedOrder && createPortal(
        <div className="restaurant-order-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrder(null); }}>
          <section className="restaurant-order-modal" role="dialog" aria-modal="true" aria-labelledby="restaurant-order-modal-title">
            <header className="restaurant-order-modal-header">
              <div>
                <p className="restaurant-order-modal-eyebrow">Pedido · Habitación {selectedOrder.room}</p>
                <h2 id="restaurant-order-modal-title">Detalle del pedido</h2>
                <p className="restaurant-order-modal-client">{selectedOrder.client} · {selectedOrder.time}</p>
              </div>
              <button type="button" className="restaurant-order-modal-close" aria-label="Cerrar detalle" onClick={() => setSelectedOrder(null)}>×</button>
            </header>
            <div className="restaurant-order-modal-items">
              {(selectedOrder.details || []).map((line, lineIndex) => (
                <div className="restaurant-order-modal-item" key={`${line.name}-${lineIndex}`}>
                  <div><strong>{line.name}</strong><span>{line.quantity} × {formatCOP(line.unitPrice)}</span></div>
                  <strong>{formatCOP(line.totalPrice)}</strong>
                </div>
              ))}
              {!(selectedOrder.details || []).length && <p className="restaurant-order-modal-empty">Este pedido no tiene productos registrados.</p>}
            </div>
            <footer className="restaurant-order-modal-total"><span>Total del pedido</span><strong>{selectedOrder.amount}</strong></footer>
          </section>
        </div>,
        document.body,
      )}
      {foodManagement && (
        <FoodManagementModal
          food={foodManagement.food}
          mode={foodManagement.mode}
          categories={categories}
          onClose={() => setFoodManagement(null)}
          onSaved={(food) => onFoodUpdated?.(food)}
        />
      )}
      {showCategories && (
        <FoodCategoriesModal
          categories={categories}
          onClose={() => setShowCategories(false)}
          onChanged={onCategoriesChanged}
        />
      )}
    </section>
  );
}
