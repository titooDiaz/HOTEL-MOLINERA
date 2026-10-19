// Compartimos el tema visual elegido en toda la aplicación.
import { useEffect, useState } from "react";
import { ThemeContext } from "./themeContext.js";

const THEME_STORAGE_KEY = "hotel-molinera-theme";

function getInitialTheme() {
  // Leemos el tema guardado o la preferencia del sistema.
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved !== null) {
      return saved === "dark";
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  // Guardamos si el modo oscuro está activo.
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    // Aplicamos el tema actual al documento y lo guardamos.
    const root = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
      body.classList.add("dark", "guest-dark-mode");
    } else {
      root.setAttribute("data-theme", "light");
      root.classList.remove("dark");
      body.classList.remove("dark", "guest-dark-mode");
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
    } catch {
      // Storage unavailable
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    // Cambiamos entre el modo claro y el modo oscuro.
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
