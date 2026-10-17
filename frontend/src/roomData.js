export const roomImages = [
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4VoP9LLtK1H6EIR1sxNbrFmnmcRYSZHC1JdgvG6fr6nTZJT0TDwd96T1Y&s=10",
    alt: "Habitación",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3KOS4X4Y4yzcD2Yz4kx8rtWYJfeuIuTq5kipD0SwMDzwhaLCov0JHT0Q&s=10",
    alt: "Baño",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQj7AGHgisyuSPIwIUYk-ivllgUQlHVjs-JxJH4qA5wKBAu6idd_RGvHbw&s=10",
    alt: "Piscina",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjscLbHuJ6F99F1BSw41ahbDOL0zPyP87-FeHDiD6NgIBJJOOwTrLFgg&s=10",
    alt: "Vista",
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
    image: roomImages[0].src,
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
    image: roomImages[1].src,
  },
];

export const room = rooms[0];