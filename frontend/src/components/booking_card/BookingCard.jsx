import Icon from "../icon/Icon.jsx";
import InfoRow from "../info_row/InfoRow.jsx";
import "./BookingCard.css";

export default function BookingCard({ room }) {
  return (
    <div className="booking-card">
      <p className="small text-secondary mb-1">Desde</p>
      <p className="fw-bold text-dark mb-0 price">{room.price}</p>
      <p className="small text-secondary mb-4">por noche</p>

      <button className="w-100 btn-reserve booking-button mb-4">
        Reservar ahora
        <Icon size={16}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
      </button>

      <div className="d-flex align-items-start gap-3 pb-4 mb-4 border-bottom">
        <div className="security-icon">✓</div>
        <div>
          <p className="small fw-semibold text-dark mb-0">Cancelación gratuita</p>
          <p className="small text-secondary mb-0">Hasta 24h antes de la llegada</p>
        </div>
      </div>

      <div className="d-flex flex-column gap-3 small text-secondary">
        <InfoRow>
          <Icon size={16}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </Icon>
          Check-in: {room.checkIn}
        </InfoRow>
        <InfoRow>
          <Icon size={16}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </Icon>
          Check-out: {room.checkOut}
        </InfoRow>
        <InfoRow>
          <Icon size={16}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </Icon>
          Máx. {room.maxGuests} personas
        </InfoRow>
      </div>
    </div>
  );
}