import { createContext, useContext, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "hotel-molinera-theme";

export const ThemeContext = createContext(null);

function getStoredDarkMode() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(getStoredDarkMode);

  useEffect(() => {
    document.body.classList.toggle("guest-dark-mode", isDarkMode);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
    } catch {
      // The theme still applies for the current session if storage is unavailable.
    }

    return () => document.body.classList.remove("guest-dark-mode");
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((enabled) => !enabled);

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
