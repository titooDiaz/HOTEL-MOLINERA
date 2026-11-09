// Página de inicio pública: muestra la portada del hotel y las habitaciones disponibles.
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Hero from "./components/hero/Hero.jsx";
import RoomSection from "./components/room_section/RoomSection.jsx";
import "./App.css";

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

const AMENITIES = [
  ["wifi", "Wi‑Fi"],
  ["cableTv", "TV por cable"],
  ["privateBathroom", "Baño privado"],
  ["airConditioning", "Aire acondicionado"],
  ["safe", "Caja de seguridad"],
  ["balcony", "Balcón o terraza"],
  ["minibar", "Mini bar"],
];

function App() {
  // Tomamos los datos del hotel y la acción para abrir una reserva.
  const { hotelData, openReserveModal, rooms = [], roomsLoaded = false } = useOutletContext() || {};
  const availableRooms = rooms.filter((availableRoom) => availableRoom.isAvailable !== false);
  const [sort, setSort] = useState("default");
  const [capacity, setCapacity] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const types = useMemo(() => [...new Set(availableRooms.map((room) => room.type).filter(Boolean))].sort(), [availableRooms]);
  const filteredRooms = useMemo(() => {
    const result = availableRooms.filter((room) =>
      (!capacity || Number(room.maxGuests) >= Number(capacity))
      && (!type || room.type === type)
      && (!maxPrice || Number(room.priceAmount) <= Number(maxPrice))
      && amenities.every((amenity) => room[amenity]),
    );
    return [...result].sort((a, b) => {
      if (sort === "priceAsc") return a.priceAmount - b.priceAmount;
      if (sort === "priceDesc") return b.priceAmount - a.priceAmount;
      if (sort === "capacity") return b.maxGuests - a.maxGuests;
      if (sort === "number") return String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
      return 0;
    });
  }, [amenities, availableRooms, capacity, maxPrice, sort, type]);
  const toggleAmenity = (value) => {
    setAmenities((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  };
  const clearFilters = () => {
    setSort("default");
    setCapacity("");
    setType("");
    setMaxPrice("");
    setAmenities([]);
  };
  const activeFilters = Number(Boolean(capacity)) + Number(Boolean(type)) + Number(Boolean(maxPrice)) + amenities.length;

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
        <div className="container py-4">
          <div className={`room-filters${filtersOpen ? " is-open" : ""}`}>
            <div className="room-filters-bar">
              <div>
                <h2 className="room-filters-title">Habitaciones</h2>
                <p className="room-filters-summary">
                  {activeFilters ? `${activeFilters} filtro${activeFilters === 1 ? "" : "s"} activo${activeFilters === 1 ? "" : "s"}` : "Busca una habitación a tu medida"}
                </p>
              </div>
              <button
                type="button"
                className="room-filters-toggle"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="room-filters-panel"
              >
                <span aria-hidden="true">☷</span>
                {filtersOpen ? "Ocultar filtros" : "Filtrar y ordenar"}
                {activeFilters > 0 && <strong>{activeFilters}</strong>}
              </button>
            </div>
            <div id="room-filters-panel" className="room-filters-panel">
              <div className="room-filters-grid">
                <label className="room-filter-field" htmlFor="room-sort">
                  <span>Ordenar por</span>
                  <select id="room-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                    <option value="default">Recomendadas</option>
                    <option value="priceAsc">Precio: menor a mayor</option>
                    <option value="priceDesc">Precio: mayor a menor</option>
                    <option value="capacity">Mayor capacidad</option>
                    <option value="number">Número de habitación</option>
                  </select>
                </label>
                <label className="room-filter-field" htmlFor="room-capacity">
                  <span>Personas</span>
                  <select id="room-capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)}>
                    <option value="">Cualquier capacidad</option>
                    {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>Al menos {value} {value === 1 ? "persona" : "personas"}</option>)}
                  </select>
                </label>
                <label className="room-filter-field" htmlFor="room-type">
                  <span>Tipo</span>
                  <select id="room-type" value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="">Todos los tipos</option>
                    {types.map((roomType) => <option key={roomType} value={roomType}>{roomType}</option>)}
                  </select>
                </label>
                <label className="room-filter-field" htmlFor="room-price">
                  <span>Precio máximo</span>
                  <input id="room-price" type="number" min="0" step="1000" placeholder="Sin límite" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
                </label>
              </div>
              <fieldset className="room-filter-amenities">
                <legend>Servicios</legend>
                <div>
                  {AMENITIES.map(([value, label]) => (
                    <label className="room-filter-check" key={value}>
                      <input type="checkbox" checked={amenities.includes(value)} onChange={() => toggleAmenity(value)} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="room-filters-footer">
                <span aria-live="polite">Mostrando {filteredRooms.length} de {availableRooms.length} disponibles.</span>
                <button type="button" className="room-filters-clear" onClick={clearFilters}>Limpiar filtros</button>
              </div>
            </div>
          </div>
        </div>
        {filteredRooms.map((availableRoom) => (
          <RoomSection
            key={availableRoom.id}
            room={availableRoom}
            images={availableRoom.gallery}
            labels={TEXTOS_PORTADA.room}
            onReserve={() => openReserveModal(availableRoom)}
          />
        ))}
        {roomsLoaded && availableRooms.length > 0 && filteredRooms.length === 0 && (
          <div className="container py-5 text-center" role="status">
            <h2 className="h4">No hay habitaciones con esos filtros</h2>
            <p className="text-secondary mb-0">Prueba quitando algún servicio o ampliando el precio máximo.</p>
          </div>
        )}
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