import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import Navbar from "../../components/navbar/Navbar.jsx";
import Hero from "../../components/hero/Hero.jsx";
import WhatsAppButton from "../../components/whatsApp_button/WhatsAppButton.jsx";

const TEXTOS_PLANES = {
  navbar: {
    brandInitials: "HM",
    logoFallback: "logo",
    rooms: "Reservaciones",
    plans: "Planes",
    restaurant: "Restaurante",
    contact: "Contacto",
    reserve: "RESERVAR",
  },

  hero: {
    imageUrl:
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1",
    imageAlt: "Hotel",
    eyebrow: "VIVE LA EXPERIENCIA",
    title: "Planes",
    description:
      "Encuentra el plan ideal para disfrutar del hotel y crear una experiencia especial durante tu estadía.",
  },

  plans: {
    title: "Nuestros planes",
    description:
      "Elige entre diferentes opciones diseñadas para que aproveches al máximo tu estadía.",

    romantic: {
      title: "Plan Romántico",
      description:
        "Una experiencia especial para disfrutar en pareja, con detalles pensados para una estadía inolvidable.",
      price: "Desde $000.000",
      button: "Ver plan",
    },

    family: {
      title: "Plan Familiar",
      description:
        "Disfruta de una experiencia pensada para compartir y descansar en familia.",
      price: "Desde $000.000",
      button: "Ver plan",
    },

    adventure: {
      title: "Plan de Aventura",
      description:
        "Una opción para quienes buscan combinar descanso, naturaleza y nuevas experiencias.",
      price: "Desde $000.000",
      button: "Ver plan",
    },
  },

  reservation: {
    title: "¿Listo para reservar?",
    description:
      "Elige el plan que más te guste y ponte en contacto con nosotros para consultar disponibilidad.",
    button: "Reservar ahora",
  },

  whatsappLabel: "Contactar por WhatsApp",
};

function Planes() {
  const [hotelData, setHotelData] = useState(null);
  
    useEffect(() => {
      fetch("/api/hotel")
        .then(response => response.json())
        .then(data => setHotelData(data))
        .catch(error =>
          console.error("Error al conectar con el backend:", error)
        );
    }, []);
  
    return (
        <div className="app">
          <Navbar hotelName={hotelData?.name} labels={TEXTOS_PLANES.navbar} />
          <Hero
            hotelName={hotelData?.name}
            imageUrl={TEXTOS_PLANES.hero.imageUrl}
            labels={TEXTOS_PLANES.hero}
          />
          <WhatsAppButton ariaLabel={TEXTOS_PLANES.whatsappLabel} />
        </div>
      );
}

export default Planes;