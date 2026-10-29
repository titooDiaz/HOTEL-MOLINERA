// Formulario administrativo para registrar una habitación y sus características.
import { Link, useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import RoomForm from "../../components/room_form/RoomForm.jsx";
import { apiRequest } from "../../api.js";

const FORM_SECTIONS = [
  {
    id: "general",
    title: "Información general",
    description: "Datos básicos para identificar la habitación dentro del hotel.",
    fields: [
      { id: "number", label: "Número de habitación", placeholder: "Ej. 104", required: true },
      { id: "floor", label: "Piso", type: "number", min: 1, max: 50, step: 1, defaultValue: 1, required: true },
      {
        id: "type",
        label: "Tipo de habitación",
        defaultValue: "Doble",
        options: [
          { value: "Individual", label: "Individual" },
          { value: "Semi doble", label: "Semi doble" },
          { value: "Doble", label: "Doble" },
          { value: "Suite", label: "Suite" },
        ],
      },
      {
        id: "status",
        label: "Estado inicial",
        defaultValue: "disponible",
        options: [
          { value: "disponible", label: "Disponible" },
          { value: "limpieza", label: "En limpieza" },
          { value: "mantenimiento", label: "En mantenimiento" },
        ],
      },
      { id: "capacity", label: "Capacidad máxima (personas)", type: "number", min: 1, max: 12, step: 1, defaultValue: 2, required: true },
      { id: "area", label: "Área (m²)", type: "number", min: 0, step: 1, placeholder: "Ej. 30" },
    ],
  },
  {
    id: "beds",
    title: "Camas",
    description: "Cuántas camas tiene la habitación y de qué tipo.",
    fields: [
      { id: "beds", label: "Número de camas", type: "number", min: 1, max: 10, step: 1, defaultValue: 1, required: true },
      {
        id: "bedType",
        label: "Tipo de cama",
        defaultValue: "doble",
        options: [
          { value: "sencilla", label: "Sencilla (0.90 m)" },
          { value: "semidoble", label: "Semidoble (1.20 m)" },
          { value: "doble", label: "Doble (1.40 m)" },
          { value: "queen", label: "Queen (1.60 m)" },
          { value: "king", label: "King (2.00 m)" },
        ],
      },
    ],
  },
  {
    id: "amenities",
    title: "Servicios y comodidades",
    description: "Marca lo que incluye la habitación. Lo que no marques se guardará como no incluido.",
    amenities: [
      { id: "airConditioning", label: "Aire acondicionado", description: "Climatización dentro de la habitación" },
      { id: "cableTv", label: "TV por cable", description: "Canales por suscripción" },
      { id: "safe", label: "Caja de seguridad", description: "Para guardar objetos de valor" },
      { id: "workstation", label: "Estación de trabajo", description: "Escritorio y silla" },
      { id: "wifi", label: "Wi-Fi", description: "Internet inalámbrico", defaultChecked: true },
      { id: "minibar", label: "Mini bar", description: "Bebidas y snacks" },
      { id: "privateBathroom", label: "Baño privado", description: "Ducha y sanitario propios", defaultChecked: true },
      { id: "balcony", label: "Balcón o terraza" },
      { id: "smokeFree", label: "Libre de humo", description: "Habitación para no fumadores" },
    ],
  },
  {
    id: "pricing",
    title: "Tarifa y descripción",
    fields: [
      {
        id: "pricePerNight",
        label: "Precio por noche (VES)",
        type: "number",
        prefix: "Bs.",
        min: 0,
        step: 1000,
        placeholder: "120000",
        hint: "Se mostrará como precio base en el sitio público.",
        required: true,
      },
      {
        id: "imageFiles",
        label: "Imágenes de la habitación",
        type: "file",
        accept: "image/jpeg,image/png,image/webp,image/gif",
        multiple: true,
        required: true,
        hint: "Selecciona entre 1 y 4 imágenes. Formatos JPG, PNG, WEBP o GIF; máximo 5 MB cada una.",
      },
      {
        id: "description",
        label: "Descripción",
        type: "textarea",
        rows: 4,
        colClass: "col-12",
        placeholder: "Describe la habitación: ambiente, vista, ideal para quién...",
      },
    ],
  },
];

const NEW_ROOM_COPY = {
  header: {
    title: "Nueva habitación",
    subtitle: "Completa los datos para agregar una habitación al hotel.",
    back: "← Volver a habitaciones",
  },
  form: {
    submit: "Guardar habitación",
    cancel: "Cancelar",
    sending: "Guardando...",
    successMessage: "Habitación creada correctamente. Puedes agregar otra o volver al listado.",
    errorMessage: "No pudimos guardar la habitación. Inténtalo de nuevo.",
    included: "Incluido",
    notIncluded: "No incluido",
  },
};

const crearHabitacion = (datos) => {
  const body = new FormData();
  const imageFiles = datos.imageFiles || [];
  if (!imageFiles.length || imageFiles.length > 4) {
    throw new Error("Selecciona entre 1 y 4 imágenes para la habitación.");
  }

  Object.entries(datos).forEach(([key, value]) => {
    if (key === "amenities") {
      body.append(key, JSON.stringify(value));
    } else if (key === "imageFiles") {
      value.forEach((file) => body.append("images", file));
    } else {
      body.append(key, value == null ? "" : String(value));
    }
  });

  return apiRequest("/api/rooms", { method: "POST", body });
};

export default function NuevaHabitacion() {
  const navigate = useNavigate();
  const volverAHabitaciones = () => navigate("/admin/habitaciones");

  return (
    <>
          {/* Encabezado con enlace de regreso al listado de habitaciones. */}
          <PageHeader
            title={NEW_ROOM_COPY.header.title}
            subtitle={NEW_ROOM_COPY.header.subtitle}
          >
            <Link
              to="/admin/habitaciones"
              className="admin-action-button admin-action-button--outline"
            >
              {NEW_ROOM_COPY.header.back}
            </Link>
          </PageHeader>

          {/* Formulario agrupado para registrar datos, servicios y tarifa. */}
          <RoomForm
            sections={FORM_SECTIONS}
            labels={NEW_ROOM_COPY.form}
            onSubmit={crearHabitacion}
            onCancel={volverAHabitaciones}
          />
    </>
  );
}