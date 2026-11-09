// Muestra las imágenes de una habitación con controles de navegación y miniaturas.
import { useState } from "react";
import Icon from "../icon/Icon.jsx";
import Tooltip from "../tooltip/Tooltip.jsx";
import "./RoomGallery.css";

export default function RoomGallery({ images, labels }) {
  const [currentImage, setCurrentImage] = useState(0);

  if (!images?.length) {
    return (
      <div className="room-image-empty main-image-wrap rounded-4" role="status">
        El administrador aún no ha subido imágenes para esta habitación.
      </div>
    );
  }

  const showPreviousImage = () => {
    setCurrentImage((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const showNextImage = () => {
    setCurrentImage((current) => (current + 1) % images.length);
  };

  return (
    <div>
      <div className="position-relative rounded-4 bg-light main-image-wrap">
        {images[currentImage].type === "video" || /\.(mp4|webm|ogv|mov)$/i.test(images[currentImage].src || "") ? (
          <video
            src={images[currentImage].src}
            controls
            preload="metadata"
            playsInline
            className="w-100 h-100 object-fit-cover rounded-4"
            aria-label={images[currentImage].alt}
          />
        ) : (
          <img
            src={images[currentImage].src}
            alt={images[currentImage].alt}
            className="w-100 h-100 object-fit-cover rounded-4"
          />
        )}
        <span className="image-counter">
          {currentImage + 1} / {images.length}
        </span>
        <Tooltip label={labels.previousImage} className="gallery-control gallery-control--previous">
          <button
            type="button"
            onClick={showPreviousImage}
            className="btn-nav-circle"
            aria-label={labels.previousImage}
          >
            <Icon size={20}><path d="M15 18l-6-6 6-6" /></Icon>
          </button>
        </Tooltip>
        <Tooltip label={labels.nextImage} className="gallery-control gallery-control--next">
          <button
            type="button"
            onClick={showNextImage}
            className="btn-nav-circle"
            aria-label={labels.nextImage}
          >
            <Icon size={20}><path d="M9 18l6-6-6-6" /></Icon>
          </button>
        </Tooltip>
      </div>

      <div className="thumbs-grid mt-2">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setCurrentImage(index)}
            className={`thumb-button ${currentImage === index ? "selected" : ""}`}
            aria-label={`${labels.viewImage}: ${image.alt}`}
            aria-pressed={currentImage === index}
          >
            {image.type === "video" || /\.(mp4|webm|ogv|mov)$/i.test(image.src || "") ? (
              <video src={image.src} muted preload="metadata" className="thumb-img w-100 rounded-3" aria-label={image.alt} />
            ) : (
              <img src={image.src} alt="" className="thumb-img w-100 rounded-3" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}