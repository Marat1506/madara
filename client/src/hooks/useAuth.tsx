import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LoginRequest, LoginResponse, AuthResponse } from "@shared/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === "admin";
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  // Check if user is teacher
  const isTeacher = (): boolean => {
    return user?.role === "teacher";
  };

  // Login function
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data: { success: boolean; data: LoginResponse } = await response.json();
        if (data.success) {
          setUser(data.data.user);
          // Store token in localStorage
          localStorage.setItem("auth_token", data.data.token);
          localStorage.setItem("auth_expires", data.data.expiresAt);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_expires");
  };

  // Check authentication status
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const expires = localStorage.getItem("auth_expires");

      if (!token || !expires) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (new Date() > new Date(expires)) {
        logout();
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: { success: boolean; data: AuthResponse } = await response.json();
        if (data.success && data.data.authenticated) {
          setUser(data.data.user!);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    hasPermission,
    isAdmin,
    isTeacher,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
