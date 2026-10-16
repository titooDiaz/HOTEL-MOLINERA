import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ReservationsTable from "../../components/reservations_table/ReservationsTable.jsx";

const SUMMARY_CARDS = [
  { label: "Total reservas", value: "48", sub: "este mes" },
  { label: "Confirmadas", value: "32", sub: "listas para check-in" },
  { label: "En proceso", value: "9", sub: "pendientes de confirmar" },
  { label: "Check-ins hoy", value: "5", sub: "programados para hoy" },
];

const RESERVATIONS = [
  { id: "#1042", client: "Laura Gómez", room: "Doble (201)", checkin: "09/06/2025", checkout: "12/06/2025", status: "Confirmada", statusKey: "confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1041", client: "Andrés Ruiz", room: "Suite (401)", checkin: "08/06/2025", checkout: "11/06/2025", status: "Confirmada", statusKey: "confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1040", client: "María Torres", room: "Semi doble (305)", checkin: "07/06/2025", checkout: "10/06/2025", status: "En proceso", statusKey: "proceso", statusClass: "badge-pill-amber" },
  { id: "#1039", client: "Camilo Vargas", room: "Doble (102)", checkin: "07/06/2025", checkout: "09/06/2025", status: "Confirmada", statusKey: "confirmada", statusClass: "badge-pill-emerald" },
  { id: "#1038", client: "Valentina Díaz", room: "Individual (210)", checkin: "06/06/2025", checkout: "08/06/2025", status: "Check-in", statusKey: "checkin", statusClass: "badge-pill-orange" },
  { id: "#1037", client: "Sofía Ramírez", room: "Suite (302)", checkin: "05/06/2025", checkout: "07/06/2025", status: "Cancelada", statusKey: "cancelada", statusClass: "badge-pill-rose" },
];

const RESERVATIONS_COPY = {
  header: {
    title: "Reservas",
    subtitle: "Consulta, confirma y gestiona las reservas del hotel.",
    action: "+ Nueva reserva",
  },
  table: {
    title: "Todas las reservas",
    filterLabel: "Filtrar por estado",
    allValue: "todas",
    filterOptions: [
      { value: "todas", label: "Todos los estados" },
      { value: "confirmada", label: "Confirmadas" },
      { value: "proceso", label: "En proceso" },
      { value: "checkin", label: "Check-in" },
      { value: "cancelada", label: "Canceladas" },
    ],
    columns: {
      reservation: "# Reserva",
      client: "Cliente",
      room: "Habitación",
      checkIn: "Check-in",
      checkOut: "Check-out",
      status: "Estado",
      actions: "Acciones",
    },
    emptyText: "No hay reservas con este estado.",
  },
};

export default function Reservas() {
  const navigate = useNavigate();

  return (
    <>
          <PageHeader
            title={RESERVATIONS_COPY.header.title}
            subtitle={RESERVATIONS_COPY.header.subtitle}
            actionLabel={RESERVATIONS_COPY.header.action}
            onAction={() => navigate("/admin/reservas/nueva")}
          />

          <SummaryCards cards={SUMMARY_CARDS} />

          <ReservationsTable
            reservations={RESERVATIONS}
            labels={RESERVATIONS_COPY.table}
          />
    </>
  );
}