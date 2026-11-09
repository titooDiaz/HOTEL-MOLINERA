// Página pública que presenta las actividades y servicios disponibles en el hotel.
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Hero from "../../components/hero/Hero.jsx";
import HotelActivity from "../../components/hotel_activity/HotelActivity.jsx";
import { apiRequest } from "../../api.js";
import { useAuth } from "../../context/authContext.js";
import PlanBookingModal from "../../components/plan_booking/PlanBookingModal.jsx";

const TEXTOS_PLANES = {
  hero: {
    imageUrl: "/images/places/piscina-dia.jpeg",
    imageAlt: "Fachada del hotel",
    eyebrow: "VIVE LA EXPERIENCIA",
    defaultHotelName: "Hotel Molinera",
    description:
      "Encuentra el plan ideal para disfrutar del hotel y crear una experiencia especial durante tu estadía.",
  },
};

function Planes() {
  const { hotelData, openReserveModal } = useOutletContext() || {};
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/plans").then(setPlans).catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    if (user?.role !== "guest") {
      setBookings([]);
      return;
    }
    apiRequest("/api/me/plan-bookings")
      .then(setBookings)
      .catch((requestError) => setError(requestError.message));
  }, [user]);

  const handleBooked = (booking) => {
    setBookings((current) => [booking, ...current]);
    setSelectedPlan(null);
  };

  const cancelBooking = async (booking) => {
    if (!window.confirm(`¿Cancelar la solicitud del plan ${booking.plan?.name || ""}?`)) return;
    setCancellingBookingId(booking.id);
    setError("");
    try {
      const updatedBooking = await apiRequest(`/api/me/plan-bookings/${booking.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setBookings((current) => current.map((item) => item.id === updatedBooking.id ? { ...item, ...updatedBooking } : item));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <>
      {/* Portada de la página con el nombre y la imagen del hotel. */}
      <Hero
        hotelName={hotelData?.name}
        imageUrl={TEXTOS_PLANES.hero.imageUrl}
        labels={TEXTOS_PLANES.hero}
      />

      {error && <p className="alert alert-danger mx-4" role="alert">{error}</p>}
      {plans.length ? plans.map((plan) => (
        <HotelActivity
          key={plan.id}
          image={plan.imageUrl || "/images/places/piscina-dia.jpeg"}
          title={plan.name}
          description={plan.description || plan.summary || ""}
          schedule={plan.price == null ? "Consulta disponibilidad y precio en recepción." : `Desde ${Number(plan.price).toLocaleString("es-VE")} ${plan.currency} por persona.`}
          bookHref={plan.price != null && !user
            ? `https://wa.me/584147015219?text=${encodeURIComponent(`Hola, quisiera consultar la disponibilidad del evento ${plan.name}.`)}`
            : undefined}
          onBook={plan.price == null
            ? undefined
            : user?.role === "guest"
              ? () => setSelectedPlan(plan)
              : user?.role === "admin"
                ? undefined
                : user
                  ? openReserveModal
                  : undefined}
          bookLabel={user?.role === "guest" ? "Agendar sin habitación" : "Consultar disponibilidad"}
        />
      )) : (
        <>
          <HotelActivity image="/images/places/piscina-dia.jpeg" title="Piscina" description="Disfruta de nuestra piscina en un ambiente tranquilo y rodeado de naturaleza." schedule="Todos los días de 8:00 a.m. a 8:00 p.m." />
          <HotelActivity image="/images/places/tejado-montana.jpeg" title="Senderismo" description="Recorre los senderos del hotel y disfruta de los paisajes naturales que rodean nuestras instalaciones." schedule="Todos los días de 7:00 a.m. a 5:00 p.m." />
          <HotelActivity image="/images/restaurant/interior-restaurante.jpeg" title="Restaurante" description="Disfruta de nuestra oferta gastronómica con platos preparados para complementar tu estadía." schedule="Desayuno: 7:00 a.m. - 10:00 a.m. | Almuerzo: 12:00 p.m. - 3:00 p.m. | Cena: 6:00 p.m. - 9:00 p.m." />
        </>
      )}
      {user?.role === "guest" && bookings.length > 0 && (
        <section className="container py-4">
          <h2 className="h4 mb-3">Mis experiencias reservadas</h2>
          <div className="d-grid gap-2">
            {bookings.map((booking) => (
              <article className="card border-0 shadow-sm rounded-3 p-3" key={booking.id}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div>
                    <strong>{booking.plan?.name || "Experiencia"}</strong>
                    <div className="small text-secondary">
                      {booking.scheduledFor} · {booking.guests} {booking.guests === 1 ? "participante" : "participantes"} ·
                      {" "}{Number(booking.total).toLocaleString("es-VE")} {booking.currency}
                    </div>
                    <span className="badge text-bg-light mt-1">{booking.status}</span>
                  </div>
                  {booking.status === "pendiente" && (
                    <button className="btn btn-outline-danger btn-sm" type="button" disabled={cancellingBookingId === booking.id} onClick={() => cancelBooking(booking)}>
                      {cancellingBookingId === booking.id ? "Cancelando..." : "Cancelar solicitud"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className="small text-secondary mt-2">Las solicitudes quedan pendientes de confirmación; coordina el pago con recepción.</p>
        </section>
      )}
      {selectedPlan && (
        <PlanBookingModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} onBooked={handleBooked} />
      )}
    </>
  );
}

export default Planes;