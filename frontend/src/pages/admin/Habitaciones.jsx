// Panel para consultar y filtrar habitaciones, con acceso al formulario de creación.
import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import RoomsGrid from "../../components/rooms_grid/RoomsGrid.jsx";

const SUMMARY_CARDS = [
  { label: "Total habitaciones", value: "24", sub: "en el hotel" },
  { label: "Disponibles", value: "4", sub: "listas para check-in", dotClass: "summary-dot--emerald" },
  { label: "Ocupadas", value: "18", sub: "75% de ocupación", dotClass: "summary-dot--rose" },
  { label: "En mantenimiento", value: "2", sub: "fuera de servicio", dotClass: "summary-dot--slate" },
];

const ROOMS = [
  { number: "101", type: "Doble", floor: "1er piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "Juan Pérez" },
  { number: "102", type: "Doble", floor: "1er piso", status: "Disponible", statusKey: "disponible", statusClass: "badge-pill-emerald", guest: null },
  { number: "103", type: "Individual", floor: "1er piso", status: "Limpieza", statusKey: "limpieza", statusClass: "badge-pill-amber", guest: null },
  { number: "201", type: "Suite", floor: "2do piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "Laura Gómez" },
  { number: "202", type: "Semi doble", floor: "2do piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "Andrés Ruiz" },
  { number: "203", type: "Doble", floor: "2do piso", status: "Mantenimiento", statusKey: "mantenimiento", statusClass: "badge-pill-slate", guest: null },
  { number: "301", type: "Doble", floor: "3er piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "María Torres" },
  { number: "302", type: "Suite", floor: "3er piso", status: "Disponible", statusKey: "disponible", statusClass: "badge-pill-emerald", guest: null },
  { number: "401", type: "Suite", floor: "4to piso", status: "Ocupada", statusKey: "ocupada", statusClass: "badge-pill-rose", guest: "Camilo Vargas" },
];

const ROOMS_COPY = {
  header: {
    title: "Habitaciones",
    subtitle: "Gestiona el estado y la disponibilidad de todas las habitaciones.",
    action: "+ Nueva habitación",
  },
  grid: {
    title: "Todas las habitaciones",
    filterLabel: "Filtrar por estado",
    allValue: "todas",
    filterOptions: [
      { value: "todas", label: "Todos los estados" },
      { value: "disponible", label: "Disponibles" },
      { value: "ocupada", label: "Ocupadas" },
      { value: "limpieza", label: "En limpieza" },
      { value: "mantenimiento", label: "Mantenimiento" },
    ],
    guestPrefix: "Huésped:",
    noGuest: "Sin huésped asignado",
    emptyText: "No hay habitaciones con este estado.",
  },
};

export default function Habitaciones() {
  const navigate = useNavigate();

  return (
    <>
          {/* Encabezado con acceso al formulario para agregar habitaciones. */}
          <PageHeader
            title={ROOMS_COPY.header.title}
            subtitle={ROOMS_COPY.header.subtitle}
            actionLabel={ROOMS_COPY.header.action}
            onAction={() => navigate("/admin/habitaciones/nueva")}
          />

          {/* Resumen de disponibilidad y listado filtrable de habitaciones. */}
          <SummaryCards cards={SUMMARY_CARDS} />

          <RoomsGrid rooms={ROOMS} labels={ROOMS_COPY.grid} />
    </>
  );
}