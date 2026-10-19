// Panel de reportes con indicadores de ingresos, ocupación y reservas por habitación.
import { useState } from "react";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ReportsAnalytics from "../../components/reports_analytics/ReportsAnalytics.jsx";

const KPI_CARDS = [
  { label: "Ingresos totales", value: "$18.240.000", sub: "últimos 30 días", trend: "+12%" },
  { label: "Ocupación promedio", value: "78%", sub: "últimos 30 días", trend: "+5%" },
  { label: "Ticket promedio", value: "$123.243", sub: "por reserva", trend: "+3%" },
  { label: "Reservas totales", value: "148", sub: "últimos 30 días", trend: "-2%" },
];

const REVENUE = {
  labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
  values: [3900000, 4300000, 4500000, 5540000],
};

const ROOM_TYPE_STATS = [
  { type: "Suite", reservations: 38, revenue: "$6.840.000" },
  { type: "Doble", reservations: 52, revenue: "$5.980.000" },
  { type: "Semi doble", reservations: 34, revenue: "$3.260.000" },
  { type: "Individual", reservations: 24, revenue: "$2.160.000" },
];

const REPORTS_COPY = {
  header: {
    title: "Reportes",
    subtitle: "Indicadores clave de desempeño del hotel.",
    export: "Exportar",
    rangeLabel: "Rango de fechas",
    defaultRange: "30",
    rangeOptions: [
      { value: "7", label: "Últimos 7 días" },
      { value: "30", label: "Últimos 30 días" },
      { value: "90", label: "Últimos 90 días" },
    ],
  },
  analytics: {
    revenueTitle: "Ingresos en el tiempo",
    roomTypesTitle: "Ingresos por tipo de habitación",
    detailTitle: "Detalle por tipo de habitación",
    reservationsShort: "res.",
    columns: {
      type: "Tipo de habitación",
      reservations: "Reservas",
      revenue: "Ingresos generados",
    },
  },
};

export default function Reportes() {
  // Mantiene el rango seleccionado en el control de fechas del encabezado.
  const [range, setRange] = useState(REPORTS_COPY.header.defaultRange);

  return (
    <>
          {/* Encabezado con selector del período y acción de exportación. */}
          <PageHeader
            title={REPORTS_COPY.header.title}
            subtitle={REPORTS_COPY.header.subtitle}
            actionLabel={REPORTS_COPY.header.export}
            actionVariant="outline"
          >
            <select
              className="filter-select"
              aria-label={REPORTS_COPY.header.rangeLabel}
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              {REPORTS_COPY.header.rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </PageHeader>

          {/* Indicadores principales y desgloses gráficos y tabulares del período. */}
          <SummaryCards cards={KPI_CARDS} />

          <ReportsAnalytics
            revenue={REVENUE}
            roomTypeStats={ROOM_TYPE_STATS}
            labels={REPORTS_COPY.analytics}
          />
    </>
  );
}