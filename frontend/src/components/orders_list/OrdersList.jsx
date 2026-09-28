import { CalendarDays, ChevronRight } from "lucide-react";
import "./OrdersList.css";

function OrderStatus({ status }) {
  const paid = status === "pagado";

  return (
    <span className={`badge rounded-pill px-3 py-2 ${paid ? "order-paid" : "order-pending"}`}>
      {paid ? "Pagado" : "Pendiente"}
    </span>
  );
}

export default function OrdersList({ orders, filter, onFilterChange, formatCurrency }) {
  return (
    <section className="orders-card bg-white rounded-4">
      <div className="p-4 d-flex align-items-center justify-content-between">
        <h5 className="fw-semibold mb-0">Detalle de tus pedidos</h5>
        <select
          className="form-select form-select-sm orders-filter"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          aria-label="Filtrar pedidos por estado"
        >
          <option value="todos">Todos los pedidos</option>
          <option value="pagado">Pagados</option>
          <option value="pendiente">Pendientes</option>
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
            </div>
            <div className="order-price text-end">
              <div className="fw-semibold mb-1">{formatCurrency(order.monto)}</div>
              <OrderStatus status={order.estado} />
            </div>
            <ChevronRight size={18} className="order-chevron text-secondary" />
          </li>
        ))}
      </ul>
    </section>
  );
}