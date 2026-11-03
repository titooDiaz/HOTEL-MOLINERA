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
import { room, roomFromApi, rooms as defaultRooms } from "../../roomData.js";
import { apiRequest } from "../../api.js";
import { useEffect, useState } from "react";

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



const formatoCOP = (valor) => {
    return `Bs. ${Number(valor).toLocaleString("es-VE")}`;
};

const formatoFecha = (valor) => {
    if (!valor) return "No disponible";
    const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(fecha.getTime())) return "No disponible";
    return new Intl.DateTimeFormat("es-VE", {
        dateStyle: "long",
        timeZone: "UTC",
    }).format(fecha);
};


export default function MyRoom() {
    const { reservation, saveReservation } = useAuth();
    const [availableRooms, setAvailableRooms] = useState(defaultRooms);
    const [showReservationDetails, setShowReservationDetails] = useState(false);
    const totalHabitacion = Number(reservation?.total || 0);
    const totalPagado = Number(reservation?.advance || 0);
    const totalPendiente = Number(reservation?.balance ?? Math.max(0, totalHabitacion - totalPagado));

    useEffect(() => {
        apiRequest("/api/rooms")
            .then((records) => setAvailableRooms(records.map(roomFromApi)))
            .catch((error) => console.error("No se pudieron cargar las habitaciones:", error));
    }, []);


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
                                {availableRooms.map((availableRoom) => (
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
                            <ReservationForm room={availableRooms[0] || room} rooms={availableRooms.length ? availableRooms : [room]} onSubmit={saveReservation} />
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
                                onDetailsClick={() => setShowReservationDetails(true)}
                            />

                        </div>

                    </div>

                    {showReservationDetails && (
                        <div
                            className="reservation-details-backdrop"
                            onClick={() => setShowReservationDetails(false)}
                        >
                            <section
                                className="reservation-details-dialog"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="reservation-details-title"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                                    <div>
                                        <h2 className="h4 mb-1" id="reservation-details-title">Detalle de tu habitación</h2>
                                        <p className="text-secondary mb-0">
                                            Reserva {reservation.reservationCode || `#${reservation.id}`}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar detalle"
                                        onClick={() => setShowReservationDetails(false)}
                                    />
                                </div>

                                <dl className="reservation-details-list">
                                    <div><dt>Habitación</dt><dd>{reservation.roomName || "Pendiente de asignación"}</dd></div>
                                    <div><dt>Estado de reserva</dt><dd>{reservation.status || "No disponible"}</dd></div>
                                    <div><dt>Entrada</dt><dd>{formatoFecha(reservation.checkIn)}</dd></div>
                                    <div><dt>Salida</dt><dd>{formatoFecha(reservation.checkOut)}</dd></div>
                                    <div><dt>Noches</dt><dd>{reservation.nights ?? "No disponible"}</dd></div>
                                    <div><dt>Huéspedes</dt><dd>{reservation.guests ?? "No disponible"}</dd></div>
                                    <div><dt>Precio por noche</dt><dd>{formatoCOP(reservation.pricePerNight || 0)}</dd></div>
                                    <div><dt>Subtotal</dt><dd>{formatoCOP(reservation.subtotal ?? totalHabitacion)}</dd></div>
                                    <div><dt>Impuestos</dt><dd>{formatoCOP(reservation.taxes || 0)}</dd></div>
                                    <div><dt>Total de la habitación</dt><dd>{formatoCOP(totalHabitacion)}</dd></div>
                                    <div><dt>Pagado</dt><dd>{formatoCOP(totalPagado)}</dd></div>
                                    <div className="reservation-details-balance">
                                        <dt>Saldo pendiente</dt><dd>{formatoCOP(totalPendiente)}</dd>
                                    </div>
                                    {reservation.paymentMethod && (
                                        <div><dt>Método de pago</dt><dd>{reservation.paymentMethod}</dd></div>
                                    )}
                                    {reservation.specialRequests && (
                                        <div className="reservation-details-notes">
                                            <dt>Solicitudes especiales</dt><dd>{reservation.specialRequests}</dd>
                                        </div>
                                    )}
                                </dl>

                                <button
                                    type="button"
                                    className="btn account-button w-100"
                                    onClick={() => setShowReservationDetails(false)}
                                >
                                    Cerrar
                                </button>
                            </section>
                        </div>
                    )}

        </div>
    );
}
