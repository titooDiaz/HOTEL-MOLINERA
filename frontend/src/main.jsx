import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RoomRequests from './pages/users/RoomRequests.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RoomRequests />
  </StrictMode>,
)
