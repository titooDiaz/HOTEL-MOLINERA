import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import Navbar from "../../components/navbar/Navbar.jsx";
import Hero from "../../components/hero/Hero.jsx";
import WhatsAppButton from "../../components/whatsApp_button/WhatsAppButton.jsx";

import RestaurantCategories from "../../components/restaurant_categories/RestaurantCategories.jsx";
import FoodCard from "../../components/food_card/FoodCard.jsx";

const TEXTO_PORTADA = {
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
  },

  reservation: {
    title: "Reserva tu mesa",
    description:
      "Reserva con anticipación y disfruta de una experiencia gastronómica sin preocupaciones.",
    button: "Reservar mesa",
  },

  whatsappLabel: "Contactar por WhatsApp",
};

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
    image:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666",
  },

  {
    id: 2,
    category: "desayunos",
    name: "Huevos con Arepa",
    description:
      "Huevos preparados al gusto acompañados de arepa y queso.",
    price: "$14.000",
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8",
  },

  {
    id: 3,
    category: "almuerzos",
    name: "Pollo a la Parrilla",
    description:
      "Pechuga de pollo a la parrilla acompañada de arroz, ensalada y papas.",
    price: "$28.000",
    image:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435",
  },

  {
    id: 4,
    category: "almuerzos",
    name: "Bandeja Campestre",
    description:
      "Una combinación tradicional con carne, arroz, frijoles, ensalada y acompañamientos.",
    price: "$32.000",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554",
  },

  {
    id: 5,
    category: "cenas",
    name: "Pasta de la Casa",
    description:
      "Pasta preparada con nuestra salsa especial y acompañamientos.",
    price: "$24.000",
    image:
      "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0",
  },

  {
    id: 6,
    category: "bebidas",
    name: "Jugo Natural",
    description:
      "Jugo natural preparado con fruta fresca.",
    price: "$8.000",
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba",
  },
];

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

      <Navbar
        hotelName={hotelData?.name}
        labels={TEXTO_PORTADA.navbar}
      />

      <Hero
        hotelName={hotelData?.name}
        imageUrl={TEXTO_PORTADA.hero.imageUrl}
        labels={TEXTO_PORTADA.hero}
      />

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
        />

        <div className="container">
          <div className="row g-4">

            {COMIDAS.map((food) => (
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

      <section className="px-3 px-md-5 py-5 text-center">
        <h2 className="fw-bold text-dark">
          {TEXTO_PORTADA.reservation.title}
        </h2>

        <p className="text-secondary">
          {TEXTO_PORTADA.reservation.description}
        </p>

        <button className="btn-reserve">
          {TEXTO_PORTADA.reservation.button}
        </button>
      </section>

      <WhatsAppButton
        ariaLabel={TEXTO_PORTADA.whatsappLabel}
      />

    </div>
  );
}

export default Restaurante;