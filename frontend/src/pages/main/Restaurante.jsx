import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import Navbar from "../../components/navbar/Navbar.jsx";
import Hero from "../../components/hero/Hero.jsx";
import WhatsAppButton from "../../components/whatsApp_button/WhatsAppButton.jsx";

const TEXTO_PORTADA = {
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
    imageAlt: "Restaurante del hotel",
    eyebrow: "SABORES QUE COMPLEMENTAN TU ESTADÍA",
    title: "Restaurante",
    description:
      "Disfruta de una propuesta gastronómica pensada para acompañar tu estadía, con platos preparados con ingredientes frescos y un ambiente agradable.",
  },

  menu: {
    title: "Nuestro menú",
    description:
      "Descubre nuestra selección de platos, bebidas y opciones para disfrutar durante tu estadía.",

    categories: {
      breakfast: "Desayunos",
      lunch: "Almuerzos",
      dinner: "Cenas",
      drinks: "Bebidas",
    },

    viewMenu: "Ver menú",
  },

  schedule: {
    title: "Horarios",
    breakfast: "Desayuno",
    lunch: "Almuerzo",
    dinner: "Cena",
  },

  reservation: {
    title: "Reserva tu mesa",
    description:
      "Reserva con anticipación y disfruta de una experiencia gastronómica sin preocupaciones.",
    button: "Reservar mesa",
  },

  whatsappLabel: "Contactar por WhatsApp",
};
function Restaurante() {
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
            <Navbar hotelName={hotelData?.name} labels={TEXTO_PORTADA.navbar} />
            <Hero
            hotelName={hotelData?.name}
            imageUrl={TEXTO_PORTADA.hero.imageUrl}
            labels={TEXTO_PORTADA.hero}
            />
            <WhatsAppButton ariaLabel={TEXTO_PORTADA.whatsappLabel} />
        </div>
    );
}

export default Restaurante;