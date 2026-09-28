import "./OrderStatistics.css";

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="col-12 col-md-4">
      <div className="order-stat-card bg-white rounded-4 p-3 h-100 d-flex align-items-start gap-3">
        <div
          className="order-stat-icon rounded-circle d-flex align-items-center justify-content-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={20} color={iconColor} />
        </div>
        <div>
          <div className="text-secondary small">{label}</div>
          <div className="order-stat-value">{value}</div>
          {sub && <div className="text-secondary small">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function OrderStatistics({ items }) {
  return (
    <div className="row g-3 mb-4">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}