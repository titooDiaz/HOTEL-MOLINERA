// Creamos el contexto y el acceso a la configuración visual.
import { createContext, useContext } from "react";

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export function useTheme() {
  // Permitimos consultar y cambiar el tema desde cualquier componente.
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider.");
  }
  return context;
}
