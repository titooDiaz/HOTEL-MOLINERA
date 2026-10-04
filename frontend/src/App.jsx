import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import Navbar from "./components/navbar/Navbar.jsx";
import Hero from "./components/hero/Hero.jsx";
import RoomSection from "./components/room_section/RoomSection.jsx";
import WhatsAppButton from "./components/whatsApp_button/WhatsAppButton.jsx";
import { room, roomImages } from "./roomData.js";

const TEXTOS_PORTADA = {
  navbar: {
    brandInitials: "HM",
    logoFallback: "logo",
    rooms: "Habitaciones",
    plans: "Planes",
    restaurant: "Restaurante",
    contact: "Contacto",
    reserve: "RESERVAR",
  },
  hero: {
    imageUrl:
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1",
    imageAlt: "Fachada del hotel",
    eyebrow: "TU ESCAPADA PERFECTA",
    defaultHotelName: "Hotel Moderno",
    titleSuffix: "y Confortable",
    description:
      "Disfruta de una experiencia única en un entorno natural, con todas las comodidades que necesitas.",
  },
  room: {
    gallery: {
      previousImage: "Imagen anterior",
      nextImage: "Imagen siguiente",
      viewImage: "Ver imagen",
    },
    descriptionLabel: "Descripción",
    booking: {
      from: "Desde",
      perNight: "por noche",
      reserve: "Reservar ahora",
      freeCancellation: "Cancelación gratuita",
      cancellationDescription: "Hasta 24h antes de la llegada",
      checkIn: "Check-in",
      checkOut: "Check-out",
      maxGuests: "Máx.",
      guests: "personas",
    },
  },
  whatsappLabel: "Contactar por WhatsApp",
};

function App() {
  const [hotelData, setHotelData] = useState(null);

  useEffect(() => {
    fetch("/api/hotel")
      .then(response => response.json())
      .then(data => setHotelData(data))
      .catch(error => console.error("Error al conectar con el backend:", error));
  }, []);

  return (
    <div className="app">
      <Navbar hotelName={hotelData?.name} labels={TEXTOS_PORTADA.navbar} />
      <Hero
        hotelName={hotelData?.name}
        imageUrl={TEXTOS_PORTADA.hero.imageUrl}
        labels={TEXTOS_PORTADA.hero}
      />
      <RoomSection room={room} images={roomImages} labels={TEXTOS_PORTADA.room} />
      <WhatsAppButton ariaLabel={TEXTOS_PORTADA.whatsappLabel} />
    </div>
  );
}

export default App;