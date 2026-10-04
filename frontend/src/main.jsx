import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RoomRequests from './pages/users/RoomRequests.jsx'
import HotelDashboard from './pages/admin/HotelDashboard.jsx'
import MyRoom from './pages/users/MyRoom.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HotelDashboard />
  </StrictMode>,
)
