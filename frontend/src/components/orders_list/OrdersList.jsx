// Lista los pedidos del huésped con su fecha, importe, estado y filtro correspondiente.
import { CalendarDays, ChevronRight } from "lucide-react";
import "./OrdersList.css";

function OrderStatus({ status, labels }) {
  const paid = status === "pagado";
  const cancelled = status === "cancelado";
  const preparing = status === "preparando";
  const prepared = status === "preparado";
  const onTheWay = status === "en_camino";
  const delivered = status === "entregado";

  const className = paid ? "order-paid"
    : cancelled ? "order-cancelled"
      : preparing || onTheWay ? "order-preparing"
        : prepared ? "order-prepared"
          : delivered ? "order-delivered"
            : "order-pending";
  const label = paid ? labels.paidStatus
    : cancelled ? labels.cancelledStatus
      : preparing ? labels.preparingStatus
        : prepared ? labels.preparedStatus
          : onTheWay ? labels.onTheWayStatus
            : delivered ? labels.deliveredStatus
              : labels.pendingStatus;

  return <span className={`badge rounded-pill px-3 py-2 ${className}`}>{label}</span>;
}

export default function OrdersList({ orders, filter, onFilterChange, formatCurrency, labels, onCancelOrder, cancellingOrderId }) {
  return (
    <section className="orders-card bg-white rounded-4">
      <div className="p-4 d-flex align-items-center justify-content-between">
        <h5 className="fw-semibold mb-0">{labels.title}</h5>
        <select
          className="form-select form-select-sm orders-filter"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          aria-label={labels.filterAriaLabel}
        >
          <option value="todos">{labels.allOrders}</option>
          <option value="pagado">{labels.paidOrders}</option>
          <option value="pendiente">{labels.pendingOrders}</option>
          <option value="cancelado">{labels.cancelledOrders}</option>
        </select>
      </div>

      <ul className="list-unstyled mb-0">
        {orders.map((order) => (
          <li
            key={order.id}
            className="order-item d-flex align-items-center gap-3 px-4 py-3 border-top"
          >
            <img src={order.imagen} alt={order.nombre} className="order-image" />
            <div className="flex-grow-1 min-w-0">
              <div className="fw-semibold">{order.nombre}</div>
              <div className="text-secondary small">{order.detalle}</div>
              <div className="text-secondary small d-flex align-items-center gap-1">
                <CalendarDays size={14} />
                {order.fecha}
              </div>
              {order.orderStatus === "pendiente" && (
                <button
                  type="button"
                  className="order-cancel-button"
                  disabled={cancellingOrderId === order.orderId}
                  onClick={() => onCancelOrder(order)}
                >
                  {cancellingOrderId === order.orderId ? "Cancelando..." : "Cancelar pedido"}
                </button>
              )}
            </div>
            <div className="order-price text-end">
              <div className="fw-semibold mb-1">{formatCurrency(order.monto)}</div>
              <OrderStatus status={order.orderStatus === "pendiente" ? order.estado : order.orderStatus} labels={labels} />
            </div>
            {order.orderStatus !== "cancelado" && <ChevronRight size={18} className="order-chevron text-secondary" />}
          </li>
        ))}
      </ul>
    </section>
  );
}