// Página de inicio pública: muestra la portada del hotel y las habitaciones disponibles.
import { useOutletContext } from "react-router-dom";
import Hero from "./components/hero/Hero.jsx";
import RoomSection from "./components/room_section/RoomSection.jsx";

// Reunimos los textos que usan la portada y las habitaciones.
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
      reserved: "Reservada",
      unavailable: "No disponible",
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
  // Tomamos los datos del hotel y la acción para abrir una reserva.
  const { hotelData, openReserveModal, rooms = [], roomsLoaded = false } = useOutletContext() || {};
  const availableRooms = rooms.filter((availableRoom) => availableRoom.isAvailable !== false);

  return (
    <>
      {/* Mostramos la bienvenida principal del hotel. */}
      <Hero
        hotelName={hotelData?.name}
        imageUrl={TEXTOS_PORTADA.hero.imageUrl}
        labels={TEXTOS_PORTADA.hero}
      />
      {/* Recorremos las habitaciones disponibles para mostrarlas. */}
      <section id="habitaciones" aria-label="Habitaciones del hotel">
        {availableRooms.map((availableRoom) => (
          <RoomSection
            key={availableRoom.id}
            room={availableRoom}
            images={availableRoom.gallery}
            labels={TEXTOS_PORTADA.room}
            onReserve={() => openReserveModal(availableRoom)}
          />
        ))}
        {roomsLoaded && availableRooms.length === 0 && (
          <div className="container py-5 text-center" role="status">
            <h2 className="h4">Todas las habitaciones están ocupadas por el momento</h2>
            <p className="text-secondary mb-0">Vuelve a consultar más tarde o contáctanos para revisar otras fechas.</p>
          </div>
        )}
      </section>
    </>
  );
}

export default App;