import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const THEME_STORAGE_KEY = "hotel-molinera-theme";

export const ThemeContext = createContext(null);

function getStoredDarkMode(userId) {
  if (!userId) return false;

  try {
    return sessionStorage.getItem(`${THEME_STORAGE_KEY}-${userId}`) === "dark";
  } catch {
    return false;
  }
}

function removeStoredDarkMode(userId) {
  if (!userId) return;

  try {
    sessionStorage.removeItem(`${THEME_STORAGE_KEY}-${userId}`);
  } catch {
    // The in-memory theme still resets when storage is unavailable.
  }
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [themeState, setThemeState] = useState(() => ({
    userId,
    isDarkMode: getStoredDarkMode(userId),
  }));
  const previousUserId = useRef(userId);
  const isDarkMode = userId !== null
    && themeState.userId === userId
    && themeState.isDarkMode;

  useEffect(() => {
    if (previousUserId.current === userId) return;

    removeStoredDarkMode(previousUserId.current);
    previousUserId.current = userId;
    setThemeState({
      userId,
      isDarkMode: getStoredDarkMode(userId),
    });
  }, [userId]);

  useEffect(() => {
    document.body.classList.toggle("guest-dark-mode", isDarkMode);

    return () => document.body.classList.remove("guest-dark-mode");
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    if (!userId) return;

    const nextDarkMode = !isDarkMode;

    try {
      sessionStorage.setItem(
        `${THEME_STORAGE_KEY}-${userId}`,
        nextDarkMode ? "dark" : "light",
      );
    } catch {
      // The theme still applies for the current session if storage is unavailable.
    }

    setThemeState({ userId, isDarkMode: nextDarkMode });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider.");
  }

  return context;
}
