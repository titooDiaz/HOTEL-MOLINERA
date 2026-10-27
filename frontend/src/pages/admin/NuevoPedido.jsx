// Formulario administrativo para registrar pedidos con menú y habitaciones reales.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import AdminForm from "../../components/admin_form/AdminForm.jsx";
import { apiRequest } from "../../api.js";
import { formatCOP, postJson } from "../../components/admin_form/formUtils.js";

const COPY = {
  form: {
    submit: "Registrar pedido",
    cancel: "Cancelar",
    sending: "Guardando...",
    successMessage: "Pedido registrado correctamente.",
    errorMessage: "No pudimos registrar el pedido.",
    decrease: "Quitar uno de",
    increase: "Agregar uno de",
  },
  emptyItems: "Agrega al menos un producto al pedido.",
};

function createSections(reservations, foods) {
  const activeByRoom = new Map();
  const today = new Date().toISOString().slice(0, 10);
  reservations
    .filter((reservation) => reservation.checkIn <= today && reservation.checkOut > today && !["cancelada", "cancelado"].includes(reservation.status))
    .forEach((reservation) => {
      if (!activeByRoom.has(String(reservation.roomId))) activeByRoom.set(String(reservation.roomId), reservation);
    });

  return [
    {
      id: "order",
      title: "Datos del pedido",
      fields: [
        {
          id: "roomId",
          label: "Habitación",
          placeholder: "Selecciona una habitación con huésped",
          required: true,
          options: [...activeByRoom.values()].map((reservation) => ({
            value: String(reservation.roomId),
            label: `Hab. ${reservation.habitacion.number} · ${reservation.usuario.huesped.firstName} ${reservation.usuario.huesped.lastName}`,
          })),
        },
        {
          id: "paymentMethod",
          label: "Forma de pago",
          defaultValue: "cargo",
          options: [
            { value: "cargo", label: "Cargar a la habitación" },
            { value: "efectivo", label: "Efectivo" },
            { value: "tarjeta", label: "Tarjeta" },
          ],
        },
        { id: "notes", label: "Notas para la cocina", type: "textarea", rows: 3, colClass: "col-12" },
      ],
    },
    {
      id: "items",
      title: "Productos",
      description: "Elige los platos y bebidas con el botón +.",
      items: foods.map((food) => ({
        id: String(food.id),
        label: food.name,
        description: food.categoria?.name || "Menú",
        price: Number(food.price),
        max: 20,
      })),
    },
  ];
}

export default function NuevoPedido() {
  const navigate = useNavigate();
  const [data, setData] = useState({ reservations: [], foods: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest("/api/reservations"), apiRequest("/api/foods")])
      .then(([reservations, foods]) => setData({ reservations, foods }))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const sections = useMemo(() => createSections(data.reservations, data.foods), [data]);
  const validate = (payload) => payload.items.length ? null : COPY.emptyItems;
  const renderSummary = (payload) => {
    if (!payload.items.length) return null;
    const selected = payload.items.map((line) => ({
      ...line,
      food: data.foods.find((food) => String(food.id) === String(line.id)),
    })).filter((line) => line.food);
    const total = selected.reduce((sum, line) => sum + Number(line.food.price) * line.quantity, 0);
    return (
      <>
        <h2 className="aform-summary-title">Resumen del pedido</h2>
        <dl className="aform-summary-list">
          {selected.map((line) => (
            <div className="aform-summary-row" key={line.id}>
              <dt>{line.quantity} × {line.food.name}</dt>
              <dd>{formatCOP(Number(line.food.price) * line.quantity)}</dd>
            </div>
          ))}
          <div className="aform-summary-row aform-summary-row--total"><dt>Total del pedido</dt><dd>{formatCOP(total)}</dd></div>
        </dl>
      </>
    );
  };
  const hasActiveRooms = sections[0].fields[0].options.length > 0;

  return (
    <>
      <PageHeader title="Nuevo pedido" subtitle="Registra un pedido de alimentos y bebidas para una habitación.">
        <Link to="/admin/restaurante" className="admin-action-button admin-action-button--outline">← Volver al restaurante</Link>
      </PageHeader>
      {loading && <p role="status">Cargando menú y habitaciones...</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && (
        hasActiveRooms && data.foods.length ? (
          <AdminForm
            sections={sections}
            labels={COPY.form}
            validate={validate}
            summary={renderSummary}
            onSubmit={(values) => postJson("/api/orders", values)}
            onCancel={() => navigate("/admin/restaurante")}
          />
        ) : <p className="alert alert-warning">Se necesita una estadía activa y al menos un producto disponible para registrar el pedido.</p>
      )}
    </>
  );
}
