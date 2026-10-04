import BookingCard from "../booking_card/BookingCard.jsx";
import RoomGallery from "../room_gallery/RoomGallery.jsx";
import RoomInfo from "../room_info/RoomInfo.jsx";
import "./RoomSection.css";

export default function RoomSection({ room, images, labels }) {
  return (
    <section className="px-3 px-md-5 py-4" id="habitaciones">
      <div className="room-grid">
        <RoomGallery images={images} labels={labels.gallery} />
        <RoomInfo room={room} descriptionLabel={labels.descriptionLabel} />
        <BookingCard room={room} labels={labels.booking} />
      </div>
    </section>
  );
}