import { useState } from "react";
import Icon from "../icon/Icon.jsx";
import "./RoomGallery.css";

export default function RoomGallery({ images }) {
  const [currentImage, setCurrentImage] = useState(0);

  const showPreviousImage = () => {
    setCurrentImage((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const showNextImage = () => {
    setCurrentImage((current) => (current + 1) % images.length);
  };

  return (
    <div>
      <div className="position-relative rounded-4 overflow-hidden bg-light main-image-wrap">
        <img
          src={images[currentImage].src}
          alt={images[currentImage].alt}
          className="w-100 h-100 object-fit-cover"
        />
        <span className="image-counter">
          {currentImage + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={showPreviousImage}
          className="position-absolute top-50 start-0 translate-middle-y ms-2 btn-nav-circle"
          aria-label="Imagen anterior"
        >
          <Icon size={16}><path d="M15 18l-6-6 6-6" /></Icon>
        </button>
        <button
          type="button"
          onClick={showNextImage}
          className="position-absolute top-50 end-0 translate-middle-y me-2 btn-nav-circle"
          aria-label="Imagen siguiente"
        >
          <Icon size={16}><path d="M9 18l6-6-6-6" /></Icon>
        </button>
      </div>

      <div className="thumbs-grid mt-2">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setCurrentImage(index)}
            className={`thumb-button ${currentImage === index ? "selected" : ""}`}
            aria-label={`Ver imagen: ${image.alt}`}
            aria-pressed={currentImage === index}
          >
            <img src={image.src} alt="" className="thumb-img w-100 rounded-3" />
          </button>
        ))}
      </div>
    </div>
  );
}