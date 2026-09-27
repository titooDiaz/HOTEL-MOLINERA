import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import Navbar from "./components/navbar/Navbar.jsx";
import Hero from "./components/hero/Hero.jsx";
import RoomSection from "./components/room_section/RoomSection.jsx";
import WhatsAppButton from "./components/whatsApp_button/WhatsAppButton.jsx";
import { room, roomImages } from "./roomData.js";

function App() {
  const [hotelData, setHotelData] = useState(null);

  useEffect(() => {
    fetch("/api/hotel")
      .then(response => response.json())
      .then(data => setHotelData(data))
      .catch(error => console.error("Error al conectar con el backend:", error));
  }, []);

  return (
    <div className="app">
      <Navbar hotelName={hotelData?.name} />
      <Hero hotelName={hotelData?.name} />
      <RoomSection room={room} images={roomImages} />
      <WhatsAppButton />
    </div>
  );
}

export default App;