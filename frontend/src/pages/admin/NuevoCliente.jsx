import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HotelDashboard.css";
import AdminNav from "../../components/nav/admin_nav.jsx";
import { NAV_ITEMS, SIDEBAR_COPY, buildTopbarCopy } from "../../components/nav/adminNavItems.jsx";
import DashboardTopbar from "../../components/dashboard_topbar/DashboardTopbar.jsx";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { postJson, todayISO } from "../../components/admin_form/formUtils.js";

const FORM_SECTIONS = [
  {
    id: "personal",
    title: "Datos personales",
    fields: [
      { id: "firstName", label: "Nombres", placeholder: "Ej. Juan Carlos", required: true },
      { id: "lastName", label: "Apellidos", placeholder: "Ej. Pérez Gómez", required: true },
      {
        id: "documentType",
        label: "Tipo de documento",
        defaultValue: "CC",
        options: [
          { value: "CC", label: "Cédula de ciudadanía" },
          { value: "CE", label: "Cédula de extranjería" },
          { value: "PA", label: "Pasaporte" },
          { value: "NIT", label: "NIT" },
          { value: "OTRO", label: "Otro" },
        ],
      },
      { id: "documentNumber", label: "Número de documento", placeholder: "Ej. 1098765432", required: true },
      { id: "birthDate", label: "Fecha de nacimiento", type: "date", max: todayISO() },
      { id: "nationality", label: "Nacionalidad", defaultValue: "Venezuela" },
    ],
  },
  {
    id: "contact",
    title: "Contacto",
    fields: [
      { id: "email", label: "Correo electrónico", type: "email", placeholder: "cliente@correo.com", required: true },
      { id: "phone", label: "Teléfono", type: "tel", placeholder: "+58 276-7883117", required: true },
      { id: "city", label: "Ciudad de residencia", placeholder: "Ej. Capacho" },
      { id: "address", label: "Dirección", placeholder: "RMFP+X4X, Capacho 5009, Táchira" },
    ],
  },
  {
    id: "extra",
    title: "Contacto de emergencia y notas",
    description: "Información opcional que ayuda a la recepción durante la estadía.",
    fields: [
      { id: "emergencyName", label: "Contacto de emergencia", placeholder: "Nombre completo" },
      { id: "emergencyPhone", label: "Teléfono de emergencia", type: "tel", placeholder: "+58 276-7883117" },
      {
        id: "notes",
        label: "Notas y preferencias",
        type: "textarea",
        rows: 3,
        colClass: "col-12",
        placeholder: "Alergias, preferencias de habitación, requerimientos de accesibilidad...",
      },
    ],
  },
];

const NEW_CLIENT_COPY = {
  topbar: buildTopbarCopy("Buscar cliente por nombre o email...", "Buscar clientes"),
  header: {
    title: "Registrar cliente",
    subtitle: "Agrega un nuevo huésped a la base de datos del hotel.",
    back: "← Volver a clientes",
  },
  form: {
    submit: "Registrar cliente",
    cancel: "Cancelar",
    sending: "Guardando...",
    successMessage: "Cliente registrado correctamente. Puedes registrar otro o volver al listado.",
    errorMessage: "No pudimos registrar al cliente. Inténtalo de nuevo.",
  },
};

// TODO: el backend aún no tiene la ruta POST /api/clients (ver backend/src/app.js)
const crearCliente = (datos) => postJson("/api/clients", datos);

export default function NuevoCliente() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-dashboard admin-view d-flex min-vh-100">
      <AdminNav
        items={NAV_ITEMS}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        brand={SIDEBAR_COPY.brand}
        logoutLabel={SIDEBAR_COPY.logoutLabel}
      />

      {/* Contenido principal */}
      <div className="flex-grow-1 min-w-0 d-flex flex-column">
        <DashboardTopbar
          onOpenSidebar={() => setSidebarOpen(true)}
          labels={NEW_CLIENT_COPY.topbar}
        />

        {/* Body */}
        <main className="flex-grow-1 dashboard-main">
          <PageHeader
            title={NEW_CLIENT_COPY.header.title}
            subtitle={NEW_CLIENT_COPY.header.subtitle}
          >
            <Link to="/admin/clientes" className="admin-action-button admin-action-button--outline">
              {NEW_CLIENT_COPY.header.back}
            </Link>
          </PageHeader>

          <AdminForm
            sections={FORM_SECTIONS}
            labels={NEW_CLIENT_COPY.form}
            onSubmit={crearCliente}
            onCancel={() => navigate("/admin/clientes")}
          />
        </main>
      </div>
    </div>
  );
}