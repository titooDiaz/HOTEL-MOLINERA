import { useNavigate } from "react-router-dom";
import "./HotelDashboard.css";
import PageHeader from "../../components/page_header/PageHeader.jsx";
import SummaryCards from "../../components/summary_cards/SummaryCards.jsx";
import RestaurantPanel from "../../components/restaurant_panel/RestaurantPanel.jsx";

const SUMMARY_CARDS = [
  { label: "Pedidos hoy", value: "24", sub: "en toda la propiedad" },
  { label: "Pendientes", value: "6", sub: "por entregar o cobrar" },
  { label: "Ingresos del día", value: "Bs. 612.000", sub: "VES acumulado" },
];

const ORDERS = [
  { room: "101", client: "Juan Pérez", item: "Hamburguesa clásica", amount: "$28.000", time: "1:24 p. m.", status: "Pagado", statusClass: "badge-pill-emerald" },
  { room: "201", client: "Laura Gómez", item: "Pizza margarita", amount: "$32.000", time: "7:42 p. m.", status: "Pagado", statusClass: "badge-pill-emerald" },
  { room: "305", client: "María Torres", item: "Ensalada de frutas", amount: "$12.000", time: "11:18 a. m.", status: "En preparación", statusClass: "badge-pill-amber" },
  { room: "401", client: "Andrés Ruiz", item: "Sándwich de pollo", amount: "$24.000", time: "9:03 p. m.", status: "Pendiente de pago", statusClass: "badge-pill-rose" },
  { room: "210", client: "Valentina Díaz", item: "Café americano", amount: "$8.000", time: "8:17 a. m.", status: "Pagado", statusClass: "badge-pill-emerald" },
  { room: "302", client: "Camilo Vargas", item: "Sándwich club", amount: "$28.000", time: "4:32 p. m.", status: "Entregado", statusClass: "badge-pill-blue" },
];

const MENU = [
  { name: "Hamburguesa clásica", category: "Platos fuertes", price: "$28.000", available: true },
  { name: "Pizza margarita", category: "Platos fuertes", price: "$32.000", available: true },
  { name: "Ensalada de frutas", category: "Entradas", price: "$12.000", available: true },
  { name: "Café americano", category: "Bebidas", price: "$8.000", available: false },
];

const RESTAURANT_COPY = {
  header: {
    title: "Restaurante",
    subtitle: "Gestiona los pedidos de alimentos y bebidas de todas las habitaciones.",
    action: "+ Nuevo pedido",
  },
  panel: {
    tabs: {
      orders: "Pedidos",
      menu: "Menú",
    },
    orderColumns: {
      room: "Habitación",
      client: "Cliente",
      item: "Pedido",
      amount: "Monto",
      time: "Hora",
      status: "Estado",
      actions: "Acciones",
    },
    menuColumns: {
      name: "Plato",
      category: "Categoría",
      price: "Precio",
      availability: "Disponibilidad",
      actions: "Acciones",
    },
    available: "Disponible",
    soldOut: "Agotado",
  },
};

export default function RestauranteAdmin() {
  const navigate = useNavigate();

  return (
    <>
          <PageHeader
            title={RESTAURANT_COPY.header.title}
            subtitle={RESTAURANT_COPY.header.subtitle}
            actionLabel={RESTAURANT_COPY.header.action}
            onAction={() => navigate("/admin/restaurante/nuevo")}
          />

          <SummaryCards cards={SUMMARY_CARDS} columnClass="col-12 col-sm-4" />

          <RestaurantPanel
            orders={ORDERS}
            menu={MENU}
            labels={RESTAURANT_COPY.panel}
          />
    </>
  );
}