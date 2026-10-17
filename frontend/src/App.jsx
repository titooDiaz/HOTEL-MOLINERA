import { useOutletContext } from "react-router-dom";
import Hero from "./components/hero/Hero.jsx";
import RoomSection from "./components/room_section/RoomSection.jsx";
import { roomImages, rooms } from "./roomData.js";

const TEXTOS_PORTADA = {
  hero: {
    imageUrl: "/images/places/entrada-interior.jpeg",
    imageAlt: "Fachada del hotel",
    eyebrow: "TU ESCAPADA PERFECTA",
    defaultHotelName: "Hotel Molinera",
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
};

function App() {
  const { hotelData, openReserveModal } = useOutletContext() || {};

  return (
    <>
      <Hero
        hotelName={hotelData?.name}
        imageUrl={TEXTOS_PORTADA.hero.imageUrl}
        labels={TEXTOS_PORTADA.hero}
      />
      <section id="habitaciones" aria-label="Habitaciones disponibles">
        {rooms.map((availableRoom) => (
          <RoomSection
            key={availableRoom.id}
            room={availableRoom}
            images={availableRoom.gallery ?? roomImages}
            labels={TEXTOS_PORTADA.room}
            onReserve={() => openReserveModal(availableRoom)}
          />
        ))}
      </section>
    </>
  );
}

export default App;