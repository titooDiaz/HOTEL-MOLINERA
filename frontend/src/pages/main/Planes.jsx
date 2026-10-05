import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import Navbar from "../../components/navbar/Navbar.jsx";
import Hero from "../../components/hero/Hero.jsx";
import RoomSection from "../../components/room_section/RoomSection.jsx";
import WhatsAppButton from "../../components/whatsApp_button/WhatsAppButton.jsx";
import HotelActivity from "../../components/hotel_activity/HotelActivity.jsx";

import { room, roomImages } from "../../roomData.js";

const TEXTOS_PLANES = {
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
    eyebrow: "VIVE LA EXPERIENCIA",
    defaultHotelName: "Hotel Moderno",
    titleSuffix: "y Confortable",
    description:
      "Encuentra el plan ideal para disfrutar del hotel y crear una experiencia especial durante tu estadía.",
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
      <Navbar
        hotelName={hotelData?.name}
        labels={TEXTOS_PLANES.navbar}
      />

      <Hero
        hotelName={hotelData?.name}
        imageUrl={TEXTOS_PLANES.hero.imageUrl}
        labels={TEXTOS_PLANES.hero}
      />

      <HotelActivity
        image="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1"
        title="Piscina"
        description="Disfruta de nuestra piscina en un ambiente tranquilo y rodeado de naturaleza."
        schedule="Todos los días de 8:00 a.m. a 8:00 p.m."
      />

      <HotelActivity
        image="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1"
        title="Senderismo"
        description="Recorre los senderos del hotel y disfruta de los paisajes naturales que rodean nuestras instalaciones."
        schedule="Todos los días de 7:00 a.m. a 5:00 p.m."
      />

      <HotelActivity
        image="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1"
        title="Restaurante"
        description="Disfruta de nuestra oferta gastronómica con platos preparados para complementar tu estadía."
        schedule="Desayuno: 7:00 a.m. - 10:00 a.m. | Almuerzo: 12:00 p.m. - 3:00 p.m. | Cena: 6:00 p.m. - 9:00 p.m."
      />

      <WhatsAppButton
        ariaLabel={TEXTOS_PLANES.whatsappLabel}
      />
    </div>
  );
}

export default Planes;