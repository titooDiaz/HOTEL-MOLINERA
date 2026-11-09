// Página del huésped para ver su habitación, pagos y reservar si aún no tiene una asignada.
import {
    CheckCircle2,
} from "lucide-react";

import RoomRequestsHero from "../../components/room_requests_hero/RoomRequestsHero.jsx";
import OrderStatistics from "../../components/order_statistics/OrderStatistics.jsx";
import AccountSummary from "../../components/account_summary/AccountSummary.jsx";
import ReceptionHelp from "../../components/reception_help/ReceptionHelp.jsx";
import ReservationForm from "../../components/booking/ReservationForm.jsx";
import PaymentHistory from "../../components/payment_history/PaymentHistory.jsx";
import { useAuth } from "../../context/authContext.js";
import { roomFromApi } from "../../roomData.js";
import { apiRequest, downloadProtectedFile } from "../../api.js";
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
    const { reservation: authReservation, saveReservation } = useAuth();
    const [currentReservation, setCurrentReservation] = useState(authReservation);
    const reservation = currentReservation || authReservation;
    const [availableRooms, setAvailableRooms] = useState([]);
    const [showReservationDetails, setShowReservationDetails] = useState(false);
    const [foodOrders, setFoodOrders] = useState([]);
    const [downloadingStatement, setDownloadingStatement] = useState(false);
    const [statementError, setStatementError] = useState("");
    const totalHabitacion = Number(reservation?.total || 0);
    const totalPagado = Number(reservation?.advance || 0);
    const totalPendiente = Number(reservation?.balance ?? Math.max(0, totalHabitacion - totalPagado));
    const roomFoodOrders = foodOrders.filter((order) => order.paymentMethod === "cargo" && order.status !== "cancelado");
    const foodTotal = roomFoodOrders.reduce((total, order) => total + Number(order.total || 0), 0);
    const foodPending = roomFoodOrders
        .filter((order) => order.paymentStatus !== "pagado")
        .reduce((total, order) => total + Number(order.total || 0), 0);
    const foodPaid = foodTotal - foodPending;

    const downloadStatement = async () => {
        setDownloadingStatement(true);
        setStatementError("");
        try {
            await downloadProtectedFile(
                `/api/me/reservations/${reservation.id}/receipt.pdf`,
                `estado-cuenta-${reservation.reservationCode || reservation.id}.pdf`,
            );
        } catch (error) {
            setStatementError(error.message);
        } finally {
            setDownloadingStatement(false);
        }
    };

    useEffect(() => {
        apiRequest("/api/rooms")
            .then((records) => setAvailableRooms(records.map(roomFromApi)))
            .catch((error) => console.error("No se pudieron cargar las habitaciones:", error));
    }, []);

    useEffect(() => {
        setCurrentReservation(authReservation);
    }, [authReservation]);

    useEffect(() => {
        if (!reservation) return undefined;
        const loadFoodOrders = () => apiRequest("/api/me/orders")
            .then((orders) => setFoodOrders(orders))
            .catch((error) => console.error("No se pudieron cargar los consumos:", error));
        loadFoodOrders();
        const loadReservation = () => apiRequest("/api/me/reservations", { cache: "no-store" })
            .then((reservations) => {
                const next = reservations[0];
                if (next) setCurrentReservation({
                    ...next,
                    roomName: next.habitacion?.number ? `Habitación ${next.habitacion.number}` : "Habitación por asignar",
                });
            })
            .catch((error) => console.error("No se pudo actualizar el pago de la habitación:", error));
        loadReservation();
        const intervalId = window.setInterval(() => {
            loadFoodOrders();
            loadReservation();
        }, 10000);
        return () => window.clearInterval(intervalId);
    }, [reservation]);


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
                            {availableRooms.length ? (
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
                            ) : (
                                <p className="text-secondary mb-0" role="status">
                                    Todas las habitaciones están ocupadas por el momento.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="col-12 col-xl-5">
                        <div className="card border-0 shadow-sm p-4">
                            <h2 className="h4 mb-3">Reserva tu habitación</h2>
                            {availableRooms.length ? (
                                <ReservationForm room={availableRooms[0]} rooms={availableRooms} onSubmit={saveReservation} />
                            ) : (
                                <p className="text-secondary mb-0" role="status">
                                    No hay habitaciones disponibles para reservar en este momento.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <PaymentHistory />
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

                    {reservation.status === "proceso" && (
                        <div className="alert alert-info mt-3" role="status">
                            Tu solicitud para {reservation.roomName || "la habitación seleccionada"} está pendiente de aprobación. Ya no necesitas enviarla de nuevo.
                        </div>
                    )}
                    {reservation.status === "confirmada" && (
                        <div className="alert alert-success mt-3" role="status">
                            Tu reserva está confirmada. La información de la habitación ya está actualizada.
                        </div>
                    )}


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
                                totalConsumos={totalHabitacion + foodTotal}
                                totalPagado={totalPagado + foodPaid}
                                totalPendiente={totalPendiente + foodPending}
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
                                    <div><dt>Estado de reserva</dt><dd>{reservation.status === "proceso" ? "Pendiente de aprobación" : reservation.status === "confirmada" ? "Confirmada" : reservation.status || "No disponible"}</dd></div>
                                    <div><dt>Entrada</dt><dd>{formatoFecha(reservation.checkIn)}</dd></div>
                                    <div><dt>Salida</dt><dd>{formatoFecha(reservation.checkOut)}</dd></div>
                                    <div><dt>Noches</dt><dd>{reservation.nights ?? "No disponible"}</dd></div>
                                    <div><dt>Huéspedes</dt><dd>{reservation.guests ?? "No disponible"}</dd></div>
                                    <div><dt>Precio por noche</dt><dd>{formatoCOP(reservation.pricePerNight || 0)}</dd></div>
                                    <div><dt>Subtotal</dt><dd>{formatoCOP(reservation.subtotal ?? totalHabitacion)}</dd></div>
                                    <div><dt>Impuestos</dt><dd>{formatoCOP(reservation.taxes || 0)}</dd></div>
                                    <div><dt>Total de la habitación</dt><dd>{formatoCOP(totalHabitacion)}</dd></div>
                                    <div><dt>Consumos de alimentos</dt><dd>{formatoCOP(foodTotal)}</dd></div>
                                    <div><dt>Total habitación y consumos</dt><dd>{formatoCOP(totalHabitacion + foodTotal)}</dd></div>
                                    <div><dt>Pagado</dt><dd>{formatoCOP(totalPagado + foodPaid)}</dd></div>
                                    <div className="reservation-details-balance">
                                        <dt>Saldo pendiente</dt><dd>{formatoCOP(totalPendiente + foodPending)}</dd>
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

                                <section className="reservation-food-orders mt-4" aria-labelledby="reservation-food-orders-title">
                                    <h3 className="h5 mb-3" id="reservation-food-orders-title">Detalle de alimentos cargados a la habitación</h3>
                                    {roomFoodOrders.length ? roomFoodOrders.map((order) => (
                                        <article className="border rounded-3 p-3 mb-3" key={order.id}>
                                            <div className="d-flex justify-content-between gap-2 mb-2">
                                                <strong>Pedido {order.orderCode || `#${order.id}`}</strong>
                                                <span>{formatoCOP(order.total)}</span>
                                            </div>
                                            <ul className="list-unstyled mb-0 small">
                                                {(order.detalles || []).map((line) => (
                                                    <li className="d-flex justify-content-between gap-3 py-1" key={line.id}>
                                                        <span>{line.quantity} × {line.foodName}</span>
                                                        <span>{formatoCOP(line.totalPrice)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="small text-secondary mt-2">
                                                Estado: {order.status === "preparando" ? "En preparación" : order.status === "preparado" ? "Preparado" : order.status === "en_camino" ? "En camino" : order.status === "entregado" ? "Entregado" : "Pendiente"}
                                            </div>
                                        </article>
                                    )) : <p className="text-secondary small mb-0">Todavía no hay consumos de alimentos cargados a esta habitación.</p>}
                                </section>

                                {statementError && <p className="alert alert-danger mt-3" role="alert">{statementError}</p>}
                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary flex-fill"
                                        onClick={downloadStatement}
                                        disabled={downloadingStatement}
                                    >
                                        {downloadingStatement ? "Generando PDF..." : "Descargar estado de cuenta PDF"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn account-button flex-fill"
                                        onClick={() => setShowReservationDetails(false)}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    <PaymentHistory />
        </div>
    );
}
