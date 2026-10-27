// Página pública del restaurante con menú y categorías recuperados de la base de datos.
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Hero from "../../components/hero/Hero.jsx";
import RestaurantCategories from "../../components/restaurant_categories/RestaurantCategories.jsx";
import FoodCard from "../../components/food_card/FoodCard.jsx";
import { apiRequest } from "../../api.js";

const HERO_LABELS = {
  imageUrl: "/images/restaurant/interior-restaurante.jpeg",
  imageAlt: "Restaurante del hotel",
  eyebrow: "SABORES QUE COMPLEMENTAN TU ESTADÍA",
  defaultHotelName: "Hotel Molinera",
  description: "Disfruta de una propuesta gastronómica preparada con ingredientes frescos durante tu estadía.",
};
const GENERIC_ICON = <><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /></>;
const WHATSAPP_RESERVATION_URL = "https://wa.me/584147015219?text=Hola%2C%20quiero%20reservar%20una%20mesa.";

export default function Restaurante() {
  const { hotelData } = useOutletContext() || {};
  const [activeCategory, setActiveCategory] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/foods")
      .then(setFoods)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const unique = new Map();
    foods.forEach((food) => {
      if (food.categoria) unique.set(String(food.categoria.id), food.categoria);
    });
    return [{ id: "todos", name: "Todos", icon: GENERIC_ICON }, ...[...unique.values()].map((category) => ({
      id: String(category.id),
      name: category.name,
      icon: GENERIC_ICON,
    }))];
  }, [foods]);
  const displayedFoods = activeCategory && activeCategory !== "todos"
    ? foods.filter((food) => String(food.categoryId) === activeCategory)
    : foods;

  return (
    <>
      <Hero hotelName={hotelData?.name} imageUrl={HERO_LABELS.imageUrl} labels={HERO_LABELS} />
      <section className="px-3 px-md-5 py-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark">Nuestro menú</h2>
          <p className="text-secondary">Descubre nuestra selección de platos, bebidas y opciones disponibles.</p>
        </div>
        <RestaurantCategories categories={categories} activeCategory={activeCategory} onSelectCategory={(id) => setActiveCategory(id || null)} />
        {loading && <p className="text-center" role="status">Cargando menú...</p>}
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        {!loading && !error && (
          displayedFoods.length ? (
            <div className="container"><div className="row g-4">
              {displayedFoods.map((food) => (
                <div key={food.id} className="col-12 col-md-6 col-lg-4">
                  <FoodCard
                    image={food.imageUrl || "/images/restaurant/ravioli-pan-ajo.jpeg"}
                    name={food.name}
                    description={food.description || food.categoria?.name || ""}
                    price={`Bs. ${Number(food.price).toLocaleString("es-VE")}`}
                  />
                </div>
              ))}
            </div></div>
          ) : <p className="text-center text-secondary">No hay productos disponibles en el menú.</p>
        )}
      </section>
      <section className="px-3 px-md-5 py-5 text-center">
        <h2 className="fw-bold text-dark">Reserva tu mesa</h2>
        <p className="text-secondary">Reserva con anticipación y disfruta de una experiencia gastronómica sin preocupaciones.</p>
        <a href={WHATSAPP_RESERVATION_URL} target="_blank" rel="noopener noreferrer" className="btn-reserve">Reservar mesa</a>
      </section>
    </>
  );
}
