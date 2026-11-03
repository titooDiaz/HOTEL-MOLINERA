// Compartimos el estado de acceso y las reservas del usuario.
import { useCallback, useEffect, useState } from "react";
import { apiRequest, clearAuthToken, getAuthToken, saveAuthToken } from "../api.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  // Preparamos el usuario actual y la reserva activa.
  const [user, setUser] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAuthToken()));

  const loadGuestReservation = useCallback(async (sessionUser) => {
    if (sessionUser.role !== "guest") {
      setReservation(null);
      return;
    }

    try {
      const reservations = await apiRequest("/api/me/reservations", { cache: "no-store" });
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
  }, []);

  useEffect(() => {
    if (user?.role !== "guest") return undefined;

    const refreshVisibleReservation = () => {
      if (document.visibilityState === "visible") loadGuestReservation(user);
    };
    const intervalId = window.setInterval(refreshVisibleReservation, 5000);
    document.addEventListener("visibilitychange", refreshVisibleReservation);
    window.addEventListener("focus", refreshVisibleReservation);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshVisibleReservation);
      window.removeEventListener("focus", refreshVisibleReservation);
    };
  }, [user, loadGuestReservation]);

  useEffect(() => {
    if (!getAuthToken()) return;

    const restoreSession = async () => {
      try {
        const { user: sessionUser } = await apiRequest("/api/auth/me");
        setUser(sessionUser);
        await loadGuestReservation(sessionUser);
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
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    // Si la cuenta tiene verificación en dos pasos, todavía no hay sesión: devolvemos el desafío.
    if (response.twoFactorRequired) {
      const { challengeToken, email, codeMinutes, resendSeconds } = response;
      return { twoFactorRequired: true, challengeToken, email, codeMinutes, resendSeconds };
    }
    saveAuthToken(response.token, remember);
    setUser(response.user);
    await loadGuestReservation(response.user);
    return response.user;
  };

  // Segundo paso del inicio de sesión: cambia el código del correo por la sesión.
  const verifyTwoFactor = async ({ challengeToken, code, remember = true }) => {
    const { user: sessionUser, token } = await apiRequest("/api/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ challengeToken, code }),
    });
    saveAuthToken(token, remember);
    setUser(sessionUser);
    await loadGuestReservation(sessionUser);
    return sessionUser;
  };

  const resendTwoFactor = (challengeToken) =>
    apiRequest("/api/auth/2fa/resend", {
      method: "POST",
      body: JSON.stringify({ challengeToken }),
    });

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
        verifyTwoFactor,
        resendTwoFactor,
        updateSessionUser: setUser,
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
