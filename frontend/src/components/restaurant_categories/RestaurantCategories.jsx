import Icon from "../icon/Icon.jsx";
import "./RestaurantCategories.css";

export default function RestaurantCategories({ categories }) {
  return (
    <section className="px-3 px-md-5 py-5">
      <div className="restaurant-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="restaurant-category"
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