import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Menu, X, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  isMobile?: boolean;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export function DashboardHeader({ isMobile = false, sidebarOpen = false, setSidebarOpen }: DashboardHeaderProps) {
  const { t } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/management') return 'management';
    if (location.pathname === '/schedule') return 'schedule';
    return 'analytics';
  });

  useEffect(() => {
    if (location.pathname === '/management') {
      setActiveTab('management');
    } else if (location.pathname === '/schedule') {
      setActiveTab('schedule');
    } else {
      setActiveTab('analytics');
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0] + (names[0][1] || "");
  };

  const getRoleDisplayText = () => {
    if (!user) return "";
    return user.role === "admin" ? "Администратор" : "Преподаватель";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 relative z-30 safe-area-top">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile Menu + Logo */}
        <div className="flex items-center">
          {/* Mobile Hamburger Menu */}
          {isMobile && setSidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-3 p-2 h-11 w-11 touch-manipulation"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}

          <div className="w-8 h-8 md:w-8 md:h-8 rounded-lg flex items-center justify-center mr-3 bg-white border border-gray-200">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fb29447aa955f4652a04346c7de1baa7e%2F3d9ff9429c9948d995f5b8dcdd0c387d?format=webp&width=800"
              alt="eMadrasa Logo"
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="text-xl md:text-xl font-semibold text-gray-900">eMadrasa</span>
        </div>

        {/* Center - Navigation (Desktop only) */}
        {!isMobile && (
          <nav className="flex items-center space-x-6">
            <Link
              to="/dashboard"
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics'
                ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50 font-medium border-b-2 border-blue-500 pb-1 text-sm px-2 py-1 rounded-t-md transition-colors"
                : "text-gray-500 hover:text-gray-600 hover:bg-gray-100 font-medium text-sm px-2 py-1 rounded-md transition-colors"
              }
            >
              {t('analytics')}
            </Link>
            <Link
              to="/schedule"
              onClick={() => setActiveTab('schedule')}
              className={activeTab === 'schedule'
                ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50 font-medium border-b-2 border-blue-500 pb-1 text-sm px-2 py-1 rounded-t-md transition-colors"
                : "text-gray-500 hover:text-gray-600 hover:bg-gray-100 font-medium text-sm px-2 py-1 rounded-md transition-colors"
              }
            >
              {t('schedule')}
            </Link>
            {isAdmin() && (
              <Link
                to="/management"
                onClick={() => setActiveTab('management')}
                className={activeTab === 'management'
                  ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50 font-medium border-b-2 border-blue-500 pb-1 text-sm px-2 py-1 rounded-t-md transition-colors"
                  : "text-gray-500 hover:text-gray-600 hover:bg-gray-100 font-medium text-sm px-2 py-1 rounded-md transition-colors"
                }
              >
                {t('management')}
              </Link>
            )}
          </nav>
        )}

        {/* Right side - Controls and Profile */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {!isMobile && <LanguageSwitcher />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`flex items-center space-x-1 md:space-x-2 ${isMobile ? 'p-2 h-11 w-11' : 'p-2'} touch-manipulation`}>
                <Avatar className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'}`}>
                  <AvatarImage src="/placeholder.svg" alt="Profile" />
                  <AvatarFallback className="text-xs bg-primary text-white">{getUserInitials()}</AvatarFallback>
                </Avatar>
                {!isMobile && (
                  <>
                    <div className="text-left">
                      <div className="text-sm font-medium">{user?.name || "Пользователь"}</div>
                      <div className="text-xs text-gray-500">{getRoleDisplayText()}</div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={isMobile ? "w-56" : "w-64"}>
              {isMobile && (
                <>
                  <div className="px-4 py-3 border-b">
                    <div className="font-medium">{user?.name || "Пользователь"}</div>
                    <div className="text-sm text-gray-500">{getRoleDisplayText()}</div>
                    {user?.email && <div className="text-sm text-gray-500">{user.email}</div>}
                  </div>
                </>
              )}
              {isMobile && (
                <DropdownMenuItem className="p-4">
                  <LanguageSwitcher />
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={`${isMobile ? "p-4 text-base" : ""} text-red-600 cursor-pointer`}
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <div className="mt-3 border-t border-gray-200 pt-3 pb-1">
          <nav className="flex space-x-1">
            <Link
              to="/dashboard"
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 text-center py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] flex items-center justify-center ${
                activeTab === 'analytics'
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200"
              }`}
            >
              {t('analytics')}
            </Link>
            <Link
              to="/schedule"
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 text-center py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] flex items-center justify-center ${
                activeTab === 'schedule'
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200"
              }`}
            >
              {t('schedule')}
            </Link>
            {isAdmin() && (
              <Link
                to="/management"
                onClick={() => setActiveTab('management')}
                className={`flex-1 text-center py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] flex items-center justify-center ${
                  activeTab === 'management'
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200"
                }`}
              >
                {t('management')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
