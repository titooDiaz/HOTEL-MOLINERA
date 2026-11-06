// Muestra categorías seleccionables para filtrar los productos del restaurante.
import Icon from "../icon/Icon.jsx";
import "./RestaurantCategories.css";

const CATEGORY_ICONS = {
  coffee: <><path d="M5 8h12v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" /><path d="M17 10h1a2 2 0 1 1 0 4h-2M7 4v2M11 4v2M15 4v2" /></>,
  utensils: <><path d="M4 3v7M7 3v7M10 3v7M7 10v11M17 3v18M17 3c-3 3-3 7 0 9" /></>,
  beverage: <><path d="M7 3h10l-1 18H8L7 3Z" /><path d="M8 8h8M12 3V1" /></>,
  dessert: <><path d="M4 12h16l-2 8H6l-2-8ZM6 9a6 6 0 0 1 12 0v3H6V9Z" /><path d="M12 3V1M9 5l-1-2M15 5l1-2" /></>,
};
const DEFAULT_ICON = <><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /></>;

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
              <Icon size={20}>{CATEGORY_ICONS[category.icon] || DEFAULT_ICON}</Icon>
            </div>

            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}