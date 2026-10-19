// Compartimos el estado de acceso y las reservas del usuario.
import { useState } from "react";
import { AuthContext } from "./authContext.js";

const AUTH_STORAGE_KEY = "hotel-molinera-auth";

const USERS = [
  {
    id: "admin-1",
    email: "admin@hotelmolinera.com",
    password: "admin123",
    name: "Administrador",
    role: "admin",
  },
  {
    id: "guest-1",
    email: "huesped@hotelmolinera.com",
    password: "huesped123",
    name: "Juan Perez",
    role: "guest",
  },
];

function getStoredUser() {
  // Recuperamos la sesión guardada cuando la aplicación inicia.
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // Preparamos el usuario actual y la reserva activa.
  const [user, setUser] = useState(getStoredUser);
  const [reservation, setReservation] = useState(null);

  const login = (email, password, remember = true) => {
    // Buscamos un usuario que coincida con los datos recibidos.
    const authenticatedUser = USERS.find(
      (candidate) =>
        candidate.email === email.trim().toLowerCase() &&
        candidate.password === password
    );

    if (!authenticatedUser) {
      throw new Error("El correo o la contraseña no son válidos.");
    }

    const sessionUser = {
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
    };

    setUser(sessionUser);
    setReservation(null);

    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    return sessionUser;
  };

  const logout = () => {
    // Limpiamos la sesión y la reserva al salir.
    setUser(null);
    setReservation(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const saveReservation = (reservationData) => {
    // Guardamos la reserva asociada al usuario autenticado.
    if (!user) {
      throw new Error("Debes iniciar sesión para reservar una habitación.");
    }

    const nextReservation = {
      ...reservationData,
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };

    setReservation(nextReservation);
    return nextReservation;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        logout,
        reservation,
        saveReservation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
