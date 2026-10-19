// Muestra categorías seleccionables para filtrar los productos del restaurante.
import Icon from "../icon/Icon.jsx";
import "./RestaurantCategories.css";

export default function RestaurantCategories({
  categories,
  activeCategory,
  onSelectCategory,
}) {
  return (
    <section className="px-3 px-md-5 py-5">
      <div className="restaurant-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`restaurant-category ${
              activeCategory === category.id ? "active" : ""
            }`}
            onClick={() =>
              onSelectCategory &&
              onSelectCategory(
                activeCategory === category.id ? null : category.id,
              )
            }
          >
            <div className="restaurant-category-icon">
              <Icon size={20}>
                {category.icon}
              </Icon>
            </div>

            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}