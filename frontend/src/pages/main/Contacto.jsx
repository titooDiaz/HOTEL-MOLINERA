import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import Navbar from "../../components/navbar/Navbar.jsx";
import Hero from "../../components/hero/Hero.jsx";
import WhatsAppButton from "../../components/whatsApp_button/WhatsAppButton.jsx";


const TEXTOS_CONTACTO = {
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
    eyebrow: "ESTAMOS PARA AYUDARTE",
    title: "Contacto",
    description:
      "¿Tienes alguna pregunta o necesitas más información? Estamos aquí para ayudarte a planear tu estadía.",
  },

  information: {
    title: "Información de contacto",
    description:
      "Comunícate con nosotros para resolver tus dudas, consultar disponibilidad o recibir información sobre nuestros servicios.",

    phone: {
      label: "Teléfono",
      value: "000 000 0000",
    },

    email: {
      label: "Correo electrónico",
      value: "contacto@hotel.com",
    },

    address: {
      label: "Dirección",
      value: "Dirección del hotel",
    },
  },

  form: {
    title: "Envíanos un mensaje",

    name: "Nombre",
    namePlaceholder: "Tu nombre",

    email: "Correo electrónico",
    emailPlaceholder: "tu@email.com",

    subject: "Asunto",
    subjectPlaceholder: "¿En qué podemos ayudarte?",

    message: "Mensaje",
    messagePlaceholder: "Escribe tu mensaje aquí...",

    submit: "Enviar mensaje",
  },

  whatsappLabel: "Contactar por WhatsApp",
};

function Contacto() {
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
        <Navbar hotelName={hotelData?.name} labels={TEXTOS_CONTACTO.navbar} />
        <Hero
          hotelName={hotelData?.name}
          imageUrl={TEXTOS_CONTACTO.hero.imageUrl}
          labels={TEXTOS_CONTACTO.hero}
        />
        <WhatsAppButton ariaLabel={TEXTOS_CONTACTO.whatsappLabel} />
      </div>
    );
}

export default Contacto;