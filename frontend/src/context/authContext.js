// Creamos el contexto y el acceso a la información de autenticación.
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuth() {
  // Permitimos consultar la sesión desde cualquier componente.
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
