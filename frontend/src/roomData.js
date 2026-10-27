export const roomImages = [
  {
    src: "/images/rooms/cama-blanca.jpeg",
    alt: "Cama blanca de la habitación",
  },
  {
    src: "/images/rooms/jacuzzi-bano.jpeg",
    alt: "Baño con jacuzzi",
  },
  {
    src: "/images/places/piscina-dia.jpeg",
    alt: "Piscina del hotel",
  },
  {
    src: "/images/places/tejado-montana.jpeg",
    alt: "Vista de los tejados y la montaña",
  },
];

const baseFeatures = [
  {
    icon: "beds",
    text: "2 camas Dobles (1.40 Mts) ó 2 Camas Semidobles (1.20 Mts)",
  },
  { icon: "tv", text: "TV por cable" },
  { icon: "person", text: "Aire acondicionado" },
  { icon: "safe", text: "Caja de seguridad" },
  { icon: "wifi", text: "Wi-Fi" },
  { icon: "work", text: "Estación de trabajo" },
  { icon: "minibar", text: "Mini bar" },
];

export const rooms = [
  {
    id: "habitacion-1",
    name: "Habitación 1",
    summary: "Ideal para parejas o viajeros de negocios",
    description:
      "Amplia y cómoda habitación con un diseño moderno, ideal para descansar y disfrutar de tu estancia.",
    features: baseFeatures,
    tags: ["Hasta 4 personas", "30 m²", "No fumadores"],
    price: "$120.000",
    checkIn: "3:00 p.m.",
    checkOut: "12:00 m.",
    maxGuests: 4,
    image: "/images/rooms/cama-blanca.jpeg",
    gallery: roomImages,
  },
  {
    id: "suite-familiar",
    name: "Suite Familiar",
    summary: "Más espacio para familias y grupos",
    description:
      "Suite amplia con zonas de descanso independientes y comodidades para una estadía familiar.",
    features: [
      { icon: "beds", text: "1 cama King y 2 camas individuales" },
      ...baseFeatures.slice(1),
    ],
    tags: ["Hasta 6 personas", "45 m²", "No fumadores"],
    price: "$180.000",
    checkIn: "3:00 p.m.",
    checkOut: "12:00 m.",
    maxGuests: 6,
    image: "/images/rooms/cama-verde.jpeg",
    gallery: [
      { src: "/images/rooms/cama-verde.jpeg", alt: "Cama verde de la suite" },
      { src: "/images/rooms/cama-azul.jpeg", alt: "Cama azul de la habitación" },
      ...roomImages.slice(1, 2),
    ],
  },
];

export const room = rooms[0];

export function roomFromApi(record) {
  const image = record.imageUrl || "/images/rooms/cama-blanca.jpeg";
  const roomGallery = Array.isArray(record.gallery) && record.gallery.length
    ? record.gallery.map((item) => typeof item === "string" ? { src: item, alt: record.type } : item)
    : [{ src: image, alt: `Habitación ${record.number}` }, ...roomImages.slice(1)];
  const amenities = [
    ["airConditioning", "Aire acondicionado", "person"],
    ["cableTv", "TV por cable", "tv"],
    ["safe", "Caja de seguridad", "safe"],
    ["workstation", "Estación de trabajo", "work"],
    ["wifi", "Wi-Fi", "wifi"],
    ["minibar", "Mini bar", "minibar"],
    ["privateBathroom", "Baño privado", "bath"],
    ["balcony", "Balcón", "balcony"],
  ].filter(([key]) => record[key]).map(([, text, icon]) => ({ icon, text }));

  return {
    id: String(record.id),
    roomId: record.id,
    number: record.number,
    name: `Habitación ${record.number}`,
    summary: record.description || `${record.type} · ${record.capacity} huéspedes`,
    description: record.description || `Habitación ${record.type} del Hotel Molinera.`,
    features: amenities,
    tags: [`Hasta ${record.capacity} personas`, record.area ? `${record.area} m²` : `Piso ${record.floor}`, record.smokeFree ? "No fumadores" : record.bedType || "Habitación"],
    priceAmount: Number(record.pricePerNight),
    price: `Bs. ${new Intl.NumberFormat("es-VE").format(Number(record.pricePerNight))}`,
    checkIn: record.checkInTime || "3:00 p.m.",
    checkOut: record.checkOutTime || "12:00 m.",
    maxGuests: record.capacity,
    image,
    gallery: roomGallery,
  };
}