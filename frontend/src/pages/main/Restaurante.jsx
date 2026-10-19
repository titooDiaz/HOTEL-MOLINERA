// Página del restaurante con su menú, categorías filtrables y opción para reservar mesa.
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Hero from "../../components/hero/Hero.jsx";
import RestaurantCategories from "../../components/restaurant_categories/RestaurantCategories.jsx";
import FoodCard from "../../components/food_card/FoodCard.jsx";

const TEXTO_PORTADA = {
  hero: {
    imageUrl: "/images/restaurant/interior-restaurante.jpeg",
    imageAlt: "Restaurante del hotel",
    eyebrow: "SABORES QUE COMPLEMENTAN TU ESTADÍA",
    defaultHotelName: "Hotel Molinera",
    description:
      "Disfruta de una propuesta gastronómica pensada para acompañar tu estadía, con platos preparados con ingredientes frescos y un ambiente agradable.",
  },
  menu: {
    title: "Nuestro menú",
    description:
      "Descubre nuestra selección de platos, bebidas y opciones para disfrutar durante tu estadía.",
  },
  reservation: {
    title: "Reserva tu mesa",
    description:
      "Reserva con anticipación y disfruta de una experiencia gastronómica sin preocupaciones.",
    button: "Reservar mesa",
  },
};
const WHATSAPP_RESERVATION_URL =
  "https://wa.me/584147015219?text=Hola%2C%20quiero%20reservar%20una%20mesa.";

const CATEGORIAS = [
  {
    id: "desayunos",
    name: "Desayunos",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16" />
      </>
    ),
  },
  {
    id: "almuerzos",
    name: "Almuerzos",
    icon: (
      <>
        <path d="M6 3v18" />
        <path d="M3 3v7a3 3 0 0 0 6 0V3" />
        <path d="M6 3v5" />
        <path d="M15 3v18" />
        <path d="M15 3c3 2 4 5 4 8h-4" />
      </>
    ),
  },
  {
    id: "cenas",
    name: "Cenas",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
  {
    id: "bebidas",
    name: "Bebidas",
    icon: (
      <>
        <path d="M7 3h10l-1 18H8L7 3z" />
        <path d="M9 7h6" />
      </>
    ),
  },
];

const COMIDAS = [
  {
    id: 1,
    category: "desayunos",
    name: "Desayuno Campestre",
    description:
      "Huevos, arepa, queso, fruta fresca y una bebida caliente.",
    price: "$18.000",
    image: "/images/restaurant/ravioli-pan-ajo.jpeg",
  },
  {
    id: 2,
    category: "desayunos",
    name: "Sandwich con Papas Fritas",
    description:
      "Sandwich de jamón y queso acompañado de papas fritas.",
    price: "$14.000",
    image: "/images/restaurant/sandwich-papas.jpeg",
  },
  {
    id: 3,
    category: "almuerzos",
    name: "Pollo Desmenuzado con Papas Fritas",
    description:
      "Pollo desmenuzado acompañado de papas fritas.",
    price: "$28.000",
    image: "/images/restaurant/pollo-desmenuzado-y-papas-fritas.jpg",
  },
  {
    id: 4,
    category: "cenas",
    name: "Tacos Mexicanos con Pollo",
    description:
      "Tacos rellenos de pollo, preparados al estilo mexicano.",
    price: "$32.000",
    image: "/images/restaurant/tacos-mexicanos-con-pollo.jpg",
  },
  {
    id: 5,
    category: "almuerzos",
    name: "Carne Asada con Salsa",
    description:
      "Carne asada servida con salsa y sus acompañamientos.",
    price: "$24.000",
    image: "/images/restaurant/carne-asada-con-salsa.jpg",
  },
  {
    id: 6,
    category: "bebidas",
    name: "Jugo Natural",
    description:
      "Jugo natural preparado con fruta fresca.",
    price: "$8.000",
    image: "/images/restaurant/cerveza-piscina.jpeg",
  },
];

function Restaurante() {
  const { hotelData } = useOutletContext() || {};
  // La selección determina qué productos se muestran en el menú.
  const [activeCategory, setActiveCategory] = useState(null);

  const displayedFoods = activeCategory
    ? COMIDAS.filter((food) => food.category === activeCategory)
    : COMIDAS;

  return (
    <>
      {/* Presentación del restaurante con la información general del hotel. */}
      <Hero
        hotelName={hotelData?.name}
        imageUrl={TEXTO_PORTADA.hero.imageUrl}
        labels={TEXTO_PORTADA.hero}
      />

      {/* Menú de productos; las categorías actualizan la lista visible. */}
      <section className="px-3 px-md-5 py-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark">
            {TEXTO_PORTADA.menu.title}
          </h2>

          <p className="text-secondary">
            {TEXTO_PORTADA.menu.description}
          </p>
        </div>

        <RestaurantCategories
          categories={CATEGORIAS}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        <div className="container">
          <div className="row g-4">
            {displayedFoods.map((food) => (
              <div
                key={food.id}
                className="col-12 col-md-6 col-lg-4"
              >
                <FoodCard
                  image={food.image}
                  name={food.name}
                  description={food.description}
                  price={food.price}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enlace para solicitar una reserva de mesa por WhatsApp. */}
      <section className="px-3 px-md-5 py-5 text-center">
        <h2 className="fw-bold text-dark">
          {TEXTO_PORTADA.reservation.title}
        </h2>

        <p className="text-secondary">
          {TEXTO_PORTADA.reservation.description}
        </p>

        <a
          href={WHATSAPP_RESERVATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-reserve"
        >
          {TEXTO_PORTADA.reservation.button}
        </a>
      </section>
    </>
  );
}

export default Restaurante;