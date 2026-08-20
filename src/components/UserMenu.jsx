import { useState } from "react";
import { UserRound, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useNavigate } from 'react-router-dom';
import { t } from "@/i18n/translator";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      console.error("Error occurred while logging out:", error);
    }
    setIsOpen(false);
    navigate('/login', { replace: true });
  };

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const roleText = isAdmin ? t("global.userMenu.adminRole") : t("global.userMenu.userRole");

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="mr-2">
          <UserRound className="w-5 h-5" />
        </div>

        <div className="hidden md:block text-left">
          <p className="text-sm font-medium">{user?.username || "User"}</p>
          <p className="text-xs text-gray-500">
            {roleText}
          </p>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {/* Hiển thị thông tin user */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold">{user?.username}</p>
              <p className="text-xs text-gray-500">
                {t("global.userMenu.role")}: {isAdmin ? t("global.userMenu.admin") : t("global.userMenu.user")}
              </p>
              {user?.expiresIn && (
                <p className="text-xs text-gray-400 mt-1">
                  {t("global.userMenu.session")}: {user.expiresIn}s
                </p>
              )}
            </div>

            <button
              onClick={() => {
                navigate("/settings", { state: { tab: "profile" } });
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <User size={18} />
              <span>{t("global.userMenu.profile")}</span>
            </button>

            <button
              onClick={() => {
                navigate("/settings", { state: { tab: "security" } });
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <Settings size={18} />
              <span>{t("global.userMenu.settings")}</span>
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <LogOut size={18} />
              <span>{t("global.userMenu.logout")}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
