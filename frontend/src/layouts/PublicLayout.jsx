import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/Navbar.jsx";
import Footer from "../components/footer/Footer.jsx";
import WhatsAppButton from "../components/whatsApp_button/WhatsAppButton.jsx";
import ReserveModal from "../components/navbar/ReserveModal.jsx";
import { useAuth } from "../context/authContext.js";
import { room, roomFromApi, rooms as defaultRooms } from "../roomData.js";
import { apiRequest } from "../api.js";

const DEFAULT_NAVBAR_LABELS = {
  brandInitials: "HM",
  logoFallback: "logo",
  rooms: "Habitaciones",
  plans: "Planes",
  restaurant: "Restaurante",
  contact: "Contacto",
  reserve: "RESERVAR",
};
const WHATSAPP_NUMBER = "584147015219";

export default function PublicLayout() {
  const [hotelData, setHotelData] = useState(null);
  const [apiRooms, setApiRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(room);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const navigate = useNavigate();
  const { user, login, register, saveReservation } = useAuth();
  const rooms = apiRooms ?? defaultRooms;

  useEffect(() => {
    apiRequest("/api/hotel").then((hotel) => {
      const savedInfo = JSON.parse(localStorage.getItem("hotel-molinera-info") || "{}");
      setHotelData({ ...hotel, name: savedInfo["hotel-name"] || hotel.name });
    }).catch((err) => console.error("Error al obtener información del hotel:", err));
    apiRequest("/api/rooms")
      .then((records) => setApiRooms(records.map(roomFromApi)))
      .catch((err) => console.error("Error al obtener habitaciones:", err));
  }, []);

  const openReserveModal = (availableRoom = room) => {
    setSelectedRoom(availableRoom);
    setIsReserveOpen(true);
  };
  const closeReserveModal = () => setIsReserveOpen(false);

  const handleLogin = async ({ email, password, remember }) => {
    const user = await login(email, password, remember);
    closeReserveModal();
    navigate(user.role === "admin" ? "/admin" : "/mi-habitacion");
  };

  const handleRegister = async (registerData) => {
    await register({
      name: registerData.name,
      email: registerData.email,
      phone: registerData.phone,
      password: registerData.password,
    });
    closeReserveModal();
    navigate("/mi-habitacion");
  };

  const handleReservation = async (reservationData) => {
    await saveReservation(reservationData);
    closeReserveModal();
    navigate("/mi-habitacion");
  };

  return (
    <div className="public-layout d-flex flex-column min-vh-100">
      <Navbar
        hotelName={hotelData?.name}
        labels={DEFAULT_NAVBAR_LABELS}
        whatsappNumber={WHATSAPP_NUMBER}
        onOpenReserve={openReserveModal}
      />

      <main className="public-main flex-grow-1">
        <Outlet context={{ hotelData, openReserveModal, rooms }} />
      </main>

      <Footer hotelName={hotelData?.name} />

      <WhatsAppButton ariaLabel="Contactar por WhatsApp" phone={WHATSAPP_NUMBER} />

      <ReserveModal
        isOpen={isReserveOpen}
        onClose={closeReserveModal}
        hotelName={hotelData?.name}
        labels={DEFAULT_NAVBAR_LABELS}
        whatsappNumber={WHATSAPP_NUMBER}
        onLogin={handleLogin}
        onRegister={handleRegister}
        isAuthenticated={Boolean(user)}
        room={rooms.find(({ id }) => id === selectedRoom.id) || rooms[0] || selectedRoom}
        rooms={rooms}
        onReserve={handleReservation}
      />
    </div>
  );
}
