// Compartimos el estado de acceso y las reservas del usuario.
import { useEffect, useState } from "react";
import { apiRequest, clearAuthToken, getAuthToken, saveAuthToken } from "../api.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  // Preparamos el usuario actual y la reserva activa.
  const [user, setUser] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAuthToken()));

  useEffect(() => {
    if (!getAuthToken()) return;

    const restoreSession = async () => {
      try {
        const { user: sessionUser } = await apiRequest("/api/auth/me");
        setUser(sessionUser);
        if (sessionUser.role === "guest") {
          try {
            const reservations = await apiRequest("/api/me/reservations");
            const latest = reservations[0];
            setReservation(latest ? {
              ...latest,
              roomName: latest.habitacion?.number
                ? `Habitación ${latest.habitacion.number}`
                : "Habitación por asignar",
            } : null);
          } catch (error) {
            console.error("No se pudieron cargar las reservas del huésped:", error);
          }
        }
      } catch (error) {
        clearAuthToken();
        console.error("No se pudo restaurar la sesión:", error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (identifier, password, remember = true) => {
    const { user: sessionUser, token } = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    saveAuthToken(token, remember);
    setUser(sessionUser);
    setReservation(null);
    return sessionUser;
  };

  const register = async (registerData, remember = true) => {
    const { user: sessionUser, token } = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(registerData),
    });
    saveAuthToken(token, remember);
    setUser(sessionUser);
    setReservation(null);
    return sessionUser;
  };

  const logout = async () => {
    try {
      if (getAuthToken()) await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      clearAuthToken();
      setUser(null);
      setReservation(null);
    }
  };

  const saveReservation = async (reservationData) => {
    if (!user) throw new Error("Debes iniciar sesión para reservar una habitación.");
    const reservationResponse = await apiRequest("/api/reservations", {
      method: "POST",
      body: JSON.stringify(reservationData),
    });
    const nextReservation = {
      ...reservationResponse,
      roomName: reservationResponse.habitacion?.number
        ? `Habitación ${reservationResponse.habitacion.number}`
        : reservationData.roomName,
    };
    setReservation(nextReservation);
    return nextReservation;
  };

  const updateProfile = async (profileData) => {
    const { user: updatedUser } = await apiRequest("/api/me/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        reservation,
        saveReservation,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
