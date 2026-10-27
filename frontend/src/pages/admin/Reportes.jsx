// Panel de reportes con métricas y exportación basadas en reservas reales.
import { useEffect, useMemo, useState } from "react";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ReportsAnalytics from "../../components/reports_analytics/ReportsAnalytics.jsx";
import { apiRequest } from "../../api.js";
import { formatCOP } from "../../components/admin_form/formUtils.js";

const COPY = {
  rangeLabel: "Rango de fechas",
  ranges: [{ value: "7", label: "Últimos 7 días" }, { value: "30", label: "Últimos 30 días" }, { value: "90", label: "Últimos 90 días" }],
  analytics: {
    revenueTitle: "Anticipos recibidos en el tiempo",
    roomTypesTitle: "Anticipos por tipo de habitación",
    detailTitle: "Detalle por tipo de habitación",
    reservationsShort: "res.",
    columns: { type: "Tipo de habitación", reservations: "Reservas", revenue: "Anticipos recibidos" },
  },
};

function downloadCsv(rows) {
  const contents = [
    ["Tipo de habitación", "Reservas", "Anticipos VES"],
    ...rows.map((room) => [room.type, room.reservations, room.rawRevenue]),
  ].map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "reporte-hotel.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reportes() {
  const [range, setRange] = useState("30");
  const [records, setRecords] = useState({ reservations: [], rooms: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([apiRequest("/api/reservations"), apiRequest("/api/rooms")])
      .then(([reservations, rooms]) => setRecords({ reservations, rooms }))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const report = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(range));
    const filtered = records.reservations.filter((reservation) => new Date(reservation.createdAt) >= cutoff);
    const grouped = new Map();
    filtered.forEach((reservation) => {
      const type = reservation.habitacion?.type || "Sin tipo";
      const row = grouped.get(type) || { type, reservations: 0, rawRevenue: 0 };
      row.reservations += 1;
      row.rawRevenue += Number(reservation.advance || 0);
      grouped.set(type, row);
    });
    const roomTypeStats = [...grouped.values()].map((row) => ({ ...row, revenue: formatCOP(row.rawRevenue) }));
    const weeklyTotals = [0, 0, 0, 0];
    filtered.forEach((reservation) => {
      const age = Math.floor((now - new Date(reservation.createdAt).getTime()) / 86400000);
      const bucket = Math.min(3, Math.floor(age / Math.max(1, Number(range) / 4)));
      weeklyTotals[3 - bucket] += Number(reservation.advance || 0);
    });
    const today = new Date(now).toISOString().slice(0, 10);
    const occupied = new Set(records.reservations
      .filter((reservation) => reservation.checkIn <= today && reservation.checkOut > today && !["cancelada", "cancelado"].includes(reservation.status))
      .map((reservation) => String(reservation.roomId))).size;
    const revenue = filtered.reduce((sum, reservation) => sum + Number(reservation.advance || 0), 0);
    return {
      filtered,
      roomTypeStats,
      revenue: { labels: ["Período 1", "Período 2", "Período 3", "Período 4"], values: weeklyTotals },
      stats: [
        { label: "Anticipos recibidos", value: formatCOP(revenue), sub: `últimos ${range} días` },
        { label: "Ocupación actual", value: `${records.rooms.length ? Math.round(occupied / records.rooms.length * 100) : 0}%`, sub: "habitaciones ocupadas" },
        { label: "Anticipo promedio", value: formatCOP(filtered.length ? revenue / filtered.length : 0), sub: "por reserva" },
        { label: "Reservas totales", value: String(filtered.length), sub: `últimos ${range} días` },
      ],
    };
  }, [now, records, range]);

  return (
    <>
      <PageHeader title="Reportes" subtitle="Indicadores clave de desempeño del hotel." actionLabel="Exportar CSV" actionVariant="outline" onAction={() => downloadCsv(report.roomTypeStats)}>
        <label className="d-flex align-items-center gap-2">
          <span>{COPY.rangeLabel}</span>
          <select className="filter-select" value={range} onChange={(event) => setRange(event.target.value)} aria-label={COPY.rangeLabel}>
            {COPY.ranges.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </PageHeader>
      {loading && <p role="status">Cargando reportes...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        <SummaryCards cards={report.stats} />
        <ReportsAnalytics revenue={report.revenue} roomTypeStats={report.roomTypeStats} labels={COPY.analytics} />
      </>}
    </>
  );
}
