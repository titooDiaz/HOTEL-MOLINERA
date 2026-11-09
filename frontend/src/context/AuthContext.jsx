// Compartimos el estado de acceso y las reservas del usuario.
import { useCallback, useEffect, useState } from "react";
import { apiRequest, clearAuthToken, getAuthToken, saveAuthToken } from "../api.js";
import { AuthContext } from "./authContext.js";
import { areNotificationsEnabled } from "../utils/userSettings.js";

export function AuthProvider({ children }) {
  // Preparamos el usuario actual y la reserva activa.
  const [user, setUser] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationRevision, setNotificationRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAuthToken()));
  const [notificationsEnabled, setNotificationsEnabled] = useState(areNotificationsEnabled);

  useEffect(() => {
    const refreshSettings = () => setNotificationsEnabled(areNotificationsEnabled());
    window.addEventListener("hotel-molinera-settings-change", refreshSettings);
    window.addEventListener("storage", refreshSettings);
    return () => {
      window.removeEventListener("hotel-molinera-settings-change", refreshSettings);
      window.removeEventListener("storage", refreshSettings);
    };
  }, []);

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

  const refreshNotifications = useCallback(async () => {
    const records = await apiRequest("/api/notifications", { cache: "no-store" });
    setNotifications((current) => {
      const merged = new Map(records.map((notification) => [notification.id, notification]));
      current.forEach((notification) => {
        if (!merged.has(notification.id)) merged.set(notification.id, notification);
      });
      return [...merged.values()]
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        .slice(0, 50);
    });
    setNotificationRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    if (!user?.id || !notificationsEnabled) {
      setNotifications([]);
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;
    let retryDelay = 1000;
    const sessionUser = user;

    const receiveNotification = (notification) => {
      retryDelay = 1000;
      setNotifications((current) => [
        notification,
        ...current.filter((item) => item.id !== notification.id),
      ].slice(0, 50));
      setNotificationRevision((revision) => revision + 1);
      if (sessionUser.role === "guest" && notification.type?.startsWith("reservation_")) {
        loadGuestReservation(sessionUser);
      }
    };

    const waitBeforeReconnect = (delay) => new Promise((resolve) => {
      const finish = () => {
        window.clearTimeout(timeoutId);
        signal.removeEventListener("abort", finish);
        resolve();
      };
      const timeoutId = window.setTimeout(finish, delay);
      signal.addEventListener("abort", finish, { once: true });
    });

    const connect = async () => {
      while (!signal.aborted) {
        try {
          const response = await fetch("/api/notifications/stream", {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
            signal,
          });
          if (response.status === 401 || response.status === 403) {
            console.error("La sesión ya no permite recibir notificaciones.");
            return;
          }
          if (!response.ok || !response.body) {
            throw new Error(`No se pudo abrir el canal de notificaciones (HTTP ${response.status}).`);
          }
          await refreshNotifications();
          if (sessionUser.role === "guest") await loadGuestReservation(sessionUser);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (!signal.aborted) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.indexOf("\n\n");
            while (boundary !== -1) {
              const block = buffer.slice(0, boundary).replace(/\r/g, "");
              buffer = buffer.slice(boundary + 2);
              const data = block.split("\n")
                .filter((line) => line.startsWith("data:"))
                .map((line) => line.slice(5).trim())
                .join("\n");
              if (data) receiveNotification(JSON.parse(data));
              boundary = buffer.indexOf("\n\n");
            }
          }
          if (!signal.aborted) await refreshNotifications();
        } catch (error) {
          if (signal.aborted) break;
          console.error("Se perdió el canal de notificaciones; se intentará reconectar:", error);
        }
        await waitBeforeReconnect(retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      }
    };

    connect();
    return () => controller.abort();
  }, [user, loadGuestReservation, refreshNotifications, notificationsEnabled]);

  const markNotificationRead = useCallback(async (notificationId) => {
    const updated = await apiRequest(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
    setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await apiRequest("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((current) => current.map((item) => item.readAt
      ? item
      : { ...item, readAt: new Date().toISOString() }));
  }, []);

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
  }, [loadGuestReservation]);

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
    setNotifications([]);
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
    setNotifications([]);
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
    setNotifications([]);
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
      setNotifications([]);
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
        notifications,
        notificationRevision,
        markNotificationRead,
        markAllNotificationsRead,
        notificationsEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
