import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePermission?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requirePermission 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isAdmin, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">X</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">
            У вас нет прав для доступа к этой странице. Требуются права администратора.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  // Check specific permission requirement
  if (requirePermission && !hasPermission(requirePermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Недостаточно прав</h2>
          <p className="text-gray-600 mb-4">
            У вас нет необходимых прав для доступа к этой функции.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  // Render the protected content
  return <>{children}</>;
}

// Higher-order component for admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin>
      {children}
    </ProtectedRoute>
  );
}

// Higher-order component for permission-based routes
export function PermissionRoute({ 
  children, 
  permission 
}: { 
  children: React.ReactNode;
  permission: string;
}) {
  return (
    <ProtectedRoute requirePermission={permission}>
      {children}
    </ProtectedRoute>
  );
}
