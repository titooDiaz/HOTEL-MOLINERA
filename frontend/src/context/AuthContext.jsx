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
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = (email, password, remember = true) => {
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

    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
