import "./FoodCard.css";

export default function FoodCard({
  image,
  name,
  description,
  price,
}) {
  return (
    <article className="food-card">
      <div className="food-image-wrap">
        <img
          src={image}
          alt={name}
          className="food-image"
        />
      </div>

      <div className="food-content">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <h3 className="food-title">
            {name}
          </h3>

          <span className="food-price">
            {price}
          </span>
        </div>

        <p className="food-description">
          {description}
        </p>
      </div>
    </article>
  );
}