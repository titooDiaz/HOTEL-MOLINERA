// Panel de clientes con información de huéspedes y usuarios almacenados.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import ClientsTable from "../../components/clients_table/ClientsTable.jsx";
import { apiRequest } from "../../api.js";
import { formatCOP } from "../../components/admin_form/formUtils.js";

const LABELS = {
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
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/api/clients"), apiRequest("/api/reservations")])
      .then(([profiles, reservations]) => {
        const today = new Date().toISOString().slice(0, 10);
        const clientRows = profiles.map((profile) => {
          const current = reservations.find((reservation) =>
            reservation.userId === profile.userId &&
            reservation.checkIn <= today &&
            reservation.checkOut > today &&
            !["cancelada", "cancelado"].includes(reservation.status),
          );
          return {
            id: profile.id,
            name: `${profile.firstName} ${profile.lastName}`,
            email: profile.usuario.email,
            phone: profile.phone || "Sin teléfono",
            room: current?.habitacion?.number || "—",
            spent: formatCOP(Number(current?.total || 0)),
            status: current ? "Hospedado" : "Registrado",
            statusClass: current ? "badge-pill-emerald" : "badge-pill-slate",
          };
        });
        const monthStart = new Date();
        monthStart.setDate(1);
        setClients(clientRows);
        setStats([
          { label: "Total clientes", value: String(clientRows.length), sub: "registrados en total" },
          { label: "Huéspedes activos", value: String(clientRows.filter((client) => client.room !== "—").length), sub: "actualmente en el hotel" },
          { label: "Nuevos este mes", value: String(profiles.filter((profile) => new Date(profile.createdAt) >= monthStart).length), sub: "desde el inicio del mes" },
        ]);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Clientes" subtitle="Consulta el historial y los datos de contacto de tus huéspedes." actionLabel="+ Registrar cliente" onAction={() => navigate("/admin/clientes/nuevo")} />
      {loading && <p role="status">Cargando clientes...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && <>
        <SummaryCards cards={stats} columnClass="col-12 col-sm-4" />
        <ClientsTable clients={clients} labels={LABELS.table} />
      </>}
    </>
  );
}
