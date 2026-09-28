import { useState } from "react";
import { CheckCircle2, Clock, ShoppingBag } from "lucide-react";
import GuestSidebar from "../../components/guest_sidebar/GuestSidebar.jsx";
import GuestTopbar from "../../components/guest_topbar/GuestTopbar.jsx";
import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import OrderStatistics from "../../components/order_statistics/OrderStatistics.jsx";
import OrdersList from "../../components/orders_list/OrdersList.jsx";
import AccountSummary from "../../components/account_summary/AccountSummary.jsx";
import ReceptionHelp from "../../components/reception_help/ReceptionHelp.jsx";
import "./RoomRequests.css";

const HUESPED = {
    nombre: "Juan Pérez",
    habitacion: "Habitación 101",
};

const PEDIDOS = [
    {
        id: 1,
        nombre: "Hamburguesa clásica",
        detalle: "1 Hamburguesa + Papas + Bebida",
        fecha: "8 jun. 2025 · 1:24 p. m.",
        monto: 28000,
        estado: "pagado",
        imagen:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
    },
    {
        id: 2,
        nombre: "Pizza margarita",
        detalle: "1 Pizza mediana",
        fecha: "7 jun. 2025 · 7:42 p. m.",
        monto: 32000,
        estado: "pagado",
        imagen:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=100&h=100&fit=crop",
    },
    {
        id: 3,
        nombre: "Ensalada de frutas",
        detalle: "1 Ensalada de frutas",
        fecha: "7 jun. 2025 · 11:18 a. m.",
        monto: 12000,
        estado: "pagado",
        imagen:
        "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=100&h=100&fit=crop",
    },
    {
        id: 4,
        nombre: "Sándwich de pollo",
        detalle: "1 Sándwich + Bebida",
        fecha: "6 jun. 2025 · 9:03 p. m.",
        monto: 24000,
        estado: "pendiente",
        imagen:
        "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=100&h=100&fit=crop",
    },
    {
        id: 5,
        nombre: "Café americano",
        detalle: "1 Café americano",
        fecha: "6 jun. 2025 · 8:17 a. m.",
        monto: 8000,
        estado: "pagado",
        imagen:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop",
    },
    {
        id: 6,
        nombre: "Sándwich club",
        detalle: "1 Sándwich + Papas",
        fecha: "5 jun. 2025 · 4:32 p. m.",
        monto: 28000,
        estado: "pendiente",
        imagen:
        "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=100&h=100&fit=crop",
    },
];

const formatoCOP = (valor) => `$${valor.toLocaleString("es-CO")} COP`;

export default function RoomRequests() {
    const [filtro, setFiltro] = useState("todos");
    const pedidosFiltrados =
        filtro === "todos"
        ? PEDIDOS
        : PEDIDOS.filter((pedido) => pedido.estado === filtro);
    const pagados = PEDIDOS.filter((pedido) => pedido.estado === "pagado");
    const pendientes = PEDIDOS.filter((pedido) => pedido.estado === "pendiente");
    const totalPagado = pagados.reduce((total, pedido) => total + pedido.monto, 0);
    const totalPendiente = pendientes.reduce(
        (total, pedido) => total + pedido.monto,
        0,
    );
    const totalConsumos = totalPagado + totalPendiente;

    return (
        <div className="hotel-layout d-flex min-vh-100">
        <GuestSidebar />

        <main className="main-content flex-grow-1">
            <GuestTopbar guest={HUESPED} />

            <div className="container-fluid p-4">
            <RoomRequestsHero />

            <div className="row g-4">
                <div className="col-12 col-lg-8">
                <OrderStatistics
                    items={[
                    {
                        icon: ShoppingBag,
                        iconBg: "#FBE3E1",
                        iconColor: "#C0392B",
                        label: "Total de pedidos",
                        value: PEDIDOS.length,
                        sub: "desde tu llegada",
                    },
                    {
                        icon: CheckCircle2,
                        iconBg: "#DDF3E4",
                        iconColor: "#1D9A5D",
                        label: "Pedidos pagados",
                        value: pagados.length,
                        sub: formatoCOP(totalPagado),
                    },
                    {
                        icon: Clock,
                        iconBg: "#FDF0D5",
                        iconColor: "#C98A1C",
                        label: "Pedidos pendientes",
                        value: pendientes.length,
                        sub: formatoCOP(totalPendiente),
                    },
                    ]}
                />

                <OrdersList
                    orders={pedidosFiltrados}
                    filter={filtro}
                    onFilterChange={setFiltro}
                    formatCurrency={formatoCOP}
                />
                </div>

                <div className="col-12 col-lg-4">
                <AccountSummary
                    totalConsumos={totalConsumos}
                    totalPagado={totalPagado}
                    totalPendiente={totalPendiente}
                    formatCurrency={formatoCOP}
                />
                <ReceptionHelp />
                </div>
            </div>
            </div>
        </main>
        </div>
    );
}