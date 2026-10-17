import { useOutletContext } from "react-router-dom";
import Hero from "../../components/hero/Hero.jsx";
import HotelActivity from "../../components/hotel_activity/HotelActivity.jsx";

const TEXTOS_PLANES = {
  hero: {
    imageUrl:
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1",
    imageAlt: "Fachada del hotel",
    eyebrow: "VIVE LA EXPERIENCIA",
    defaultHotelName: "Hotel Molinera",
    description:
      "Encuentra el plan ideal para disfrutar del hotel y crear una experiencia especial durante tu estadía.",
  },
};

function Planes() {
  const { hotelData } = useOutletContext() || {};

  return (
    <>
      <Hero
        hotelName={hotelData?.name}
        imageUrl={TEXTOS_PLANES.hero.imageUrl}
        labels={TEXTOS_PLANES.hero}
      />

      <HotelActivity
        image="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1"
        title="Piscina"
        description="Disfruta de nuestra piscina en un ambiente tranquilo y rodeado de naturaleza."
        schedule="Todos los días de 8:00 a.m. a 8:00 p.m."
      />

      <HotelActivity
        image="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1"
        title="Senderismo"
        description="Recorre los senderos del hotel y disfruta de los paisajes naturales que rodean nuestras instalaciones."
        schedule="Todos los días de 7:00 a.m. a 5:00 p.m."
      />

      <HotelActivity
        image="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/22/ac/fd/b1/el-pozzo-hotel-campestre.jpg?w=900&h=500&s=1"
        title="Restaurante"
        description="Disfruta de nuestra oferta gastronómica con platos preparados para complementar tu estadía."
        schedule="Desayuno: 7:00 a.m. - 10:00 a.m. | Almuerzo: 12:00 p.m. - 3:00 p.m. | Cena: 6:00 p.m. - 9:00 p.m."
      />
    </>
  );
}

export default Planes;