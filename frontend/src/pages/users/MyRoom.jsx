import {
    BedDouble,
    CheckCircle2,
    Settings,
    Utensils,
} from "lucide-react";

import GuestSidebar from "../../components/guest_sidebar/GuestSidebar.jsx";
import GuestTopbar from "../../components/guest_topbar/GuestTopbar.jsx";
import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import OrderStatistics from "../../components/order_statistics/OrderStatistics.jsx";
import AccountSummary from "../../components/account_summary/AccountSummary.jsx";
import ReceptionHelp from "../../components/reception_help/ReceptionHelp.jsx";

import "./RoomRequests.css";
import "./MyRoom.css";


const HUESPED = {
    nombre: "Juan Pérez",
    habitacion: "Habitación 101",
};


const IMAGEN_FONDO_PEDIDOS =
    "https://peopleenespanol.com/thmb/lFB2yQjHVJ2q-FJcY2BfxMd5t24=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-905083708-2000-59fc054b9e5b4fad8be53a055f3eab2c.jpg";


const TEXTO_PAGINA = {

    sidebar: {
        brand: {
            initials: "HM",
            name: "Hotel Moderno",
            tagline: "Tu estadía, nuestra prioridad",
        },

        items: [
            {
                label: "Mi habitación",
                icon: BedDouble,
            },
            {
                label: "Alimentos y bebidas",
                icon: Utensils,
            },
            {
                label: "Configuración",
                icon: Settings,
            },
        ],

        activeItem: "Mi habitación",
        logoutLabel: "Cerrar sesión",
    },


    notificationLabel: "Notificaciones",


    hero: {
        eyebrow: "MI HABITACIÓN",
        title: "Tu habitación",
        description:
            "Revisa el detalle de tu habitación y el estado de tus pagos.",
    },


    account: {
        title: "Pago de tu habitación",
        totalLabel: "Valor habitación",
        paidLabel: "Pagado",
        pendingLabel: "Pendiente",
        totalToPayLabel: "Total a pagar",
        detailsButtonLabel: "Ver detalle completo →",
    },


    reception: {
        title: "¿Dudas con algún consumo?",

        description:
            "Si crees que hay un error en algún consumo de tu habitación, por favor comunícate con recepción.",

        buttonLabel: "Contactar recepción",
    },
};



const HABITACION = {
    valor: 400000,
    pagado: 300000,
};


const formatoCOP = (valor) => {
    return `$${valor.toLocaleString("es-CO")} COP`;
};


export default function MyRoom() {


    const totalHabitacion = HABITACION.valor;

    const totalPagado = HABITACION.pagado;

    const totalPendiente =
        totalHabitacion - totalPagado;


    return (

        <div className="hotel-layout d-flex min-vh-100">

            <GuestSidebar
                {...TEXTO_PAGINA.sidebar}
            />


            <main className="main-content flex-grow-1">

                <GuestTopbar
                    guest={HUESPED}
                    notificationLabel={
                        TEXTO_PAGINA.notificationLabel
                    }
                />


                <div className="container-fluid p-4">

                    <RoomRequestsHero
                        {...TEXTO_PAGINA.hero}
                        imageUrl={IMAGEN_FONDO_PEDIDOS}
                    />


                    <div className="row g-4">

                        {}

                        <div className="col-12 col-lg-8 order-statistics-container">

                            <OrderStatistics
                                items={[
                                    {
                                        icon: CheckCircle2,
                                        iconBg: "#DDF3E4",
                                        iconColor: "#1D9A5D",
                                        label: "Noches acordadas",
                                        value: 4,
                                        sub: "desde tu llegada",
                                    },

                                    {
                                        icon: CheckCircle2,
                                        iconBg: "#DDF3E4",
                                        iconColor: "#1D9A5D",
                                        label: "Estado habitación",
                                        value: "Disponible",
                                        sub: "",
                                    },
                                ]}
                            />


                            <div className="reception-help-container">

                                <ReceptionHelp
                                    labels={TEXTO_PAGINA.reception}
                                />

                            </div>

                        </div>


                        { }

                        <div className="col-12 col-lg-4">

                            <AccountSummary
                                totalConsumos={totalHabitacion}
                                totalPagado={totalPagado}
                                totalPendiente={totalPendiente}
                                formatCurrency={formatoCOP}
                                labels={TEXTO_PAGINA.account}
                            />

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}
