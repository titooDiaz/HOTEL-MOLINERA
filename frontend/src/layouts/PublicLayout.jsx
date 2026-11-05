import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/Navbar.jsx";
import Footer from "../components/footer/Footer.jsx";
import WhatsAppButton from "../components/whatsApp_button/WhatsAppButton.jsx";
import Chatbot from "../components/chatbot/Chatbot.jsx";
import ReserveModal from "../components/navbar/ReserveModal.jsx";
import { useAuth } from "../context/authContext.js";
import { room as defaultRoom, roomFromApi } from "../roomData.js";
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
  const [apiRooms, setApiRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(defaultRoom);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const navigate = useNavigate();
  const { user, reservation, login, verifyTwoFactor, resendTwoFactor, register, saveReservation } = useAuth();
  const rooms = apiRooms;
  const reservableRooms = rooms.filter((currentRoom) => currentRoom.isAvailable !== false);

  useEffect(() => {
    apiRequest("/api/hotel").then((hotel) => {
      const savedInfo = JSON.parse(localStorage.getItem("hotel-molinera-info") || "{}");
      setHotelData({ ...hotel, name: savedInfo["hotel-name"] || hotel.name });
    }).catch((err) => console.error("Error al obtener información del hotel:", err));
    apiRequest("/api/rooms?catalog=true", { cache: "no-store" })
      .then((records) => setApiRooms(records.map(roomFromApi)))
      .catch((err) => console.error("Error al obtener habitaciones:", err));
  }, []);

  const openReserveModal = (requestedRoom = null) => {
    if (user?.role === "guest" && reservation) {
      navigate("/mi-habitacion");
      return;
    }
    const availableRoom = requestedRoom?.isAvailable !== false && requestedRoom
      ? requestedRoom
      : reservableRooms[0] || rooms[0] || selectedRoom;
    setSelectedRoom(availableRoom);
    setIsReserveOpen(true);
  };
  const closeReserveModal = () => setIsReserveOpen(false);

  const handleLogin = async ({ identifier, password, remember }) => {
    const result = await login(identifier, password, remember);
    // Con verificación en dos pasos el modal pide el código antes de abrir sesión.
    if (result.twoFactorRequired) return result;
    closeReserveModal();
    navigate(result.role === "admin" ? "/admin" : "/mi-habitacion");
  };

  const handleVerifyTwoFactor = async (data) => {
    const verifiedUser = await verifyTwoFactor(data);
    closeReserveModal();
    navigate(verifiedUser.role === "admin" ? "/admin" : "/mi-habitacion");
  };

  const handleRegister = async (registerData) => {
    await register({
      name: registerData.name,
      email: registerData.email,
      documentType: registerData.documentType,
      documentNumber: registerData.documentNumber,
      birthDate: registerData.birthDate,
      nationality: registerData.nationality,
      phone: registerData.phone,
      city: registerData.city,
      address: registerData.address,
      emergencyName: registerData.emergencyName,
      emergencyPhone: registerData.emergencyPhone,
      notes: registerData.notes,
      password: registerData.password,
      captchaToken: registerData.captchaToken,
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
      <Chatbot />

      <ReserveModal
        isOpen={isReserveOpen}
        onClose={closeReserveModal}
        hotelName={hotelData?.name}
        labels={DEFAULT_NAVBAR_LABELS}
        whatsappNumber={WHATSAPP_NUMBER}
        onLogin={handleLogin}
        onVerifyTwoFactor={handleVerifyTwoFactor}
        onResendTwoFactor={resendTwoFactor}
        onRegister={handleRegister}
        isAuthenticated={Boolean(user)}
        room={rooms.find(({ id }) => id === selectedRoom.id) || reservableRooms[0] || rooms[0] || selectedRoom}
        rooms={rooms}
        onReserve={handleReservation}
      />
    </div>
  );
}
