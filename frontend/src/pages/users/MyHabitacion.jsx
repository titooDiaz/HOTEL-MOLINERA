// Página del huésped para ver su habitación, pagos y reservar si aún no tiene una asignada.
import {
    CheckCircle2,
} from "lucide-react";

import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import OrderStatistics from "../../components/order_statistics/OrderStatistics.jsx";
import AccountSummary from "../../components/account_summary/AccountSummary.jsx";
import ReceptionHelp from "../../components/reception_help/ReceptionHelp.jsx";
import ReservationForm from "../../components/booking/ReservationForm.jsx";
import { useAuth } from "../../context/authContext.js";
import { room, rooms } from "../../roomData.js";

import "./Alimentos.css";
import "./MyHabitacion.css";


const IMAGEN_FONDO_PEDIDOS = "/images/rooms/cama-blanca.jpeg";


const TEXTO_PAGINA = {

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
    return `Bs. ${valor.toLocaleString("es-VE")}`;
};


export default function MyRoom() {
    const { reservation, saveReservation } = useAuth();
    const totalHabitacion = HABITACION.valor;

    const totalPagado = HABITACION.pagado;

    const totalPendiente =
        totalHabitacion - totalPagado;


    if (!reservation) {
        return (
            <div className="container-fluid p-4">
                {/* Sin una reserva activa, ofrece ver habitaciones y comenzar una reserva. */}
                <RoomRequestsHero
                    {...TEXTO_PAGINA.hero}
                    title="Reserva una habitación"
                    description="Todavía no tienes una habitación asignada. Elige una de nuestras habitaciones disponibles para comenzar tu estadía."
                    imageUrl={IMAGEN_FONDO_PEDIDOS}
                />
                <div className="row g-4 align-items-start">
                    <div className="col-12 col-xl-7">
                        <div className="card border-0 shadow-sm p-4">
                            <h2 className="h4 mb-2">Habitaciones disponibles</h2>
                            <p className="text-secondary mb-4">Encuentra el espacio ideal para tu visita.</p>
                            <div className="d-grid gap-3">
                                {rooms.map((availableRoom) => (
                                    <div className="border rounded-3 p-3" key={availableRoom.id}>
                                        <div className="d-flex justify-content-between gap-3 flex-wrap">
                                            <img
                                                src={availableRoom.image}
                                                alt={availableRoom.name}
                                                className="rounded-3 object-fit-cover"
                                                style={{ width: "140px", height: "100px" }}
                                            />
                                            <div>
                                                <h3 className="h5 mb-1">{availableRoom.name}</h3>
                                                <p className="text-secondary mb-2">{availableRoom.summary}</p>
                                                <p className="small mb-0">{availableRoom.tags.join(" · ")}</p>
                                            </div>
                                            <strong className="text-nowrap">{availableRoom.price} <small>/ noche</small></strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-xl-5">
                        <div className="card border-0 shadow-sm p-4">
                            <h2 className="h4 mb-3">Reserva tu habitación</h2>
                            <ReservationForm room={room} rooms={rooms} onSubmit={saveReservation} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (

        <div className="container-fluid p-4">

                    {/* Encabezado del resumen de la habitación asignada. */}
                    <RoomRequestsHero
                        {...TEXTO_PAGINA.hero}
                        imageUrl={IMAGEN_FONDO_PEDIDOS}
                    />


                    <div className="row g-4">

                        {}

                        <div className="col-12 col-lg-8 order-statistics-container">

                            {/* Muestra el período de estadía y el estado actual de la habitación. */}
                            <OrderStatistics
                                items={[
                                    {
                                        icon: CheckCircle2,
                                        iconBg: "#DDF3E4",
                                        iconColor: "#1D9A5D",
                                        label: "Noches acordadas",
                                        value: reservation.checkIn && reservation.checkOut ? `${reservation.checkIn} - ${reservation.checkOut}` : "Pendiente",
                                        sub: "desde tu llegada",
                                    },

                                    {
                                        icon: CheckCircle2,
                                        iconBg: "#DDF3E4",
                                        iconColor: "#1D9A5D",
                                        label: "Estado habitación",
                                        value: reservation.roomName,
                                        sub: "",
                                    },
                                ]}
                            />


                            <div className="reception-help-container">

                                {/* Ayuda para reportar dudas sobre cargos o consumos. */}
                                <ReceptionHelp
                                    labels={TEXTO_PAGINA.reception}
                                />

                            </div>

                        </div>


                        { }

                        <div className="col-12 col-lg-4">

                            {/* Resumen de pagos de la habitación. */}
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
    );
}
