export default function SummaryCards({ cards, columnClass = "col-12 col-sm-6 col-xl-3" }) {
  return (
    <section className="row g-3 mb-4" aria-label="Resumen">
      {cards.map((card) => (
        <div className={columnClass} key={card.label}>
          <article className="card-panel admin-summary-card h-100">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <span className="admin-summary-label">{card.label}</span>
              {card.dotClass && <span className={`summary-dot ${card.dotClass}`} aria-hidden="true" />}
            </div>
            <strong className="admin-summary-value">{card.value}</strong>
            {card.sub && <span className="admin-summary-note">{card.sub}</span>}
            {card.trend && <span className="admin-summary-trend">{card.trend}</span>}
          </article>
        </div>
      ))}
    </section>
  );
}
