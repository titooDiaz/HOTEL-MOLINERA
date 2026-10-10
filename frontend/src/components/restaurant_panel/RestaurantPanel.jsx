import { useState } from "react";

export default function RestaurantPanel({ orders, menu, labels }) {
  const [activeTab, setActiveTab] = useState("orders");
  const isOrders = activeTab === "orders";
  const rows = isOrders ? orders : menu;
  const columns = isOrders ? labels.orderColumns : labels.menuColumns;

  return (
    <section className="card-panel admin-data-panel">
      <div className="admin-panel-heading admin-restaurant-heading">
        <div className="admin-tabs" role="tablist" aria-label="Sección del restaurante">
          <button className={`admin-tab${isOrders ? " is-active" : ""}`} type="button" role="tab" aria-selected={isOrders} onClick={() => setActiveTab("orders")}>{labels.tabs.orders}</button>
          <button className={`admin-tab${!isOrders ? " is-active" : ""}`} type="button" role="tab" aria-selected={!isOrders} onClick={() => setActiveTab("menu")}>{labels.tabs.menu}</button>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="table admin-table align-middle mb-0">
          <thead><tr>{Object.values(columns).map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr key={isOrders ? `${row.room}-${row.time}` : row.name}>
              {isOrders ? <>
                <td className="fw-semibold">{row.room}</td><td>{row.client}</td><td>{row.item}</td><td>{row.amount}</td><td>{row.time}</td>
                <td><span className={`admin-status-badge ${row.statusClass}`}>{row.status}</span></td>
              </> : <>
                <td className="fw-semibold">{row.name}</td><td>{row.category}</td><td>{row.price}</td>
                <td><span className={`admin-status-badge ${row.available ? "badge-pill-emerald" : "badge-pill-slate"}`}>{row.available ? labels.available : labels.soldOut}</span></td>
              </>}
              <td><button className="admin-table-action" type="button" aria-label={`Acciones de fila ${index + 1}`}>•••</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
