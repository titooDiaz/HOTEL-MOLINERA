import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ClientsTable from "../../components/clients_table/ClientsTable.jsx";

const SUMMARY_CARDS = [
  { label: "Total clientes", value: "286", sub: "registrados en total" },
  { label: "Huéspedes activos", value: "32", sub: "actualmente en el hotel" },
  { label: "Nuevos este mes", value: "41", sub: "desde el 1 de junio" },
];

const CLIENTS = [
  { name: "Juan Pérez", email: "juan.perez@mail.com", phone: "+58 414-7015219", room: "101", spent: "Bs. 132.000", status: "Activo", statusClass: "badge-pill-emerald" },
  { name: "Laura Gómez", email: "laura.gomez@mail.com", phone: "+58 414-7015219", room: "201", spent: "Bs. 210.000", status: "Activo", statusClass: "badge-pill-emerald" },
  { name: "Andrés Ruiz", email: "andres.ruiz@mail.com", phone: "+58 414-7015219", room: "401", spent: "Bs. 98.500", status: "Activo", statusClass: "badge-pill-emerald" },
  { name: "María Torres", email: "maria.torres@mail.com", phone: "+58 414-7015219", room: "305", spent: "Bs. 0", status: "Check-in pendiente", statusClass: "badge-pill-amber" },
  { name: "Carlos Rojas", email: "carlos.rojas@mail.com", phone: "+58 414-7015219", room: "—", spent: "Bs. 340.000", status: "Anterior", statusClass: "badge-pill-slate" },
  { name: "Valentina Díaz", email: "valentina.diaz@mail.com", phone: "+58 414-7015219", room: "210", spent: "Bs. 76.000", status: "Activo", statusClass: "badge-pill-emerald" },
];

const CLIENTS_COPY = {
  header: {
    title: "Clientes",
    subtitle: "Consulta el historial y los datos de contacto de tus huéspedes.",
    action: "+ Registrar cliente",
  },
  table: {
    title: "Listado de clientes",
    columns: {
      client: "Cliente",
      contact: "Contacto",
      room: "Habitación",
      spent: "Total gastado",
      status: "Estado",
      actions: "Acciones",
    },
  },
};

export default function Clientes() {
  const navigate = useNavigate();

  return (
    <>
          <PageHeader
            title={CLIENTS_COPY.header.title}
            subtitle={CLIENTS_COPY.header.subtitle}
            actionLabel={CLIENTS_COPY.header.action}
            onAction={() => navigate("/admin/clientes/nuevo")}
          />

          <SummaryCards cards={SUMMARY_CARDS} columnClass="col-12 col-sm-4" />

          <ClientsTable clients={CLIENTS} labels={CLIENTS_COPY.table} />
    </>
  );
}