import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/Navbar.jsx";
import Footer from "../components/footer/Footer.jsx";
import WhatsAppButton from "../components/whatsApp_button/WhatsAppButton.jsx";
import ReserveModal from "../components/navbar/ReserveModal.jsx";
import { useAuth } from "../context/authContext.js";
import { room, rooms } from "../roomData.js";

const DEFAULT_NAVBAR_LABELS = {
  brandInitials: "HM",
  logoFallback: "logo",
  rooms: "Habitaciones",
  plans: "Planes",
  restaurant: "Restaurante",
  contact: "Contacto",
  reserve: "RESERVAR",
};

export default function PublicLayout() {
  const [hotelData, setHotelData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(room);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const navigate = useNavigate();
  const { user, login, saveReservation } = useAuth();

  useEffect(() => {
    fetch("/api/hotel")
      .then((res) => res.json())
      .then((data) => setHotelData(data))
      .catch((err) =>
        console.error("Error al obtener información del hotel:", err),
      );
  }, []);

  const openReserveModal = (availableRoom = room) => {
    setSelectedRoom(availableRoom);
    setIsReserveOpen(true);
  };
  const closeReserveModal = () => setIsReserveOpen(false);

  const handleLogin = ({ email, password, remember }) => {
    const user = login(email, password, remember);
    closeReserveModal();
    navigate(user.role === "admin" ? "/admin" : "/mi-habitacion");
  };

  const handleRegister = (registerData) => {
    closeReserveModal();
    try {
      const user = login(registerData.email, registerData.password, true);
      navigate(user.role === "admin" ? "/admin" : "/mi-habitacion");
    } catch {
      alert(
        `¡Registro recibido para ${registerData.name}! Ahora puedes iniciar sesión con tu cuenta.`,
      );
    }
  };

  const handleReservation = (reservationData) => {
    saveReservation(reservationData);
    closeReserveModal();
    navigate("/mi-habitacion");
  };

  return (
    <div className="public-layout d-flex flex-column min-vh-100">
      <Navbar
        hotelName={hotelData?.name}
        labels={DEFAULT_NAVBAR_LABELS}
        onOpenReserve={openReserveModal}
      />

      <main className="public-main flex-grow-1">
        <Outlet context={{ hotelData, openReserveModal }} />
      </main>

      <Footer hotelName={hotelData?.name} />

      <WhatsAppButton ariaLabel="Contactar por WhatsApp" />

      <ReserveModal
        isOpen={isReserveOpen}
        onClose={closeReserveModal}
        hotelName={hotelData?.name}
        labels={DEFAULT_NAVBAR_LABELS}
        onLogin={handleLogin}
        onRegister={handleRegister}
        isAuthenticated={Boolean(user)}
        room={selectedRoom}
        rooms={rooms}
        onReserve={handleReservation}
      />
    </div>
  );
}
