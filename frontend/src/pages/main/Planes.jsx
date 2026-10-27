// Página pública que presenta las actividades y servicios disponibles en el hotel.
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Hero from "../../components/hero/Hero.jsx";
import HotelActivity from "../../components/hotel_activity/HotelActivity.jsx";
import { apiRequest } from "../../api.js";

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
  const { hotelData } = useOutletContext() || {};
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/plans")
      .then(setPlans)
      .catch((requestError) => setError(requestError.message));
  }, []);

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
          schedule={plan.price == null ? "Consulta disponibilidad en recepción." : `Desde ${Number(plan.price).toLocaleString("es-VE")} ${plan.currency} por persona.`}
        />
      )) : (
        <>
          <HotelActivity image="/images/places/piscina-dia.jpeg" title="Piscina" description="Disfruta de nuestra piscina en un ambiente tranquilo y rodeado de naturaleza." schedule="Todos los días de 8:00 a.m. a 8:00 p.m." />
          <HotelActivity image="/images/places/tejado-montana.jpeg" title="Senderismo" description="Recorre los senderos del hotel y disfruta de los paisajes naturales que rodean nuestras instalaciones." schedule="Todos los días de 7:00 a.m. a 5:00 p.m." />
          <HotelActivity image="/images/restaurant/interior-restaurante.jpeg" title="Restaurante" description="Disfruta de nuestra oferta gastronómica con platos preparados para complementar tu estadía." schedule="Desayuno: 7:00 a.m. - 10:00 a.m. | Almuerzo: 12:00 p.m. - 3:00 p.m. | Cena: 6:00 p.m. - 9:00 p.m." />
        </>
      )}
    </>
  );
}

export default Planes;