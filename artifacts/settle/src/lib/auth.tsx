import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem("settle_auth_token")
  );

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("settle_auth_token", newToken);
    } else {
      localStorage.removeItem("settle_auth_token");
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
