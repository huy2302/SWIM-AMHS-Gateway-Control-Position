import { useState } from "react";
import { UserRound, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useNavigate } from 'react-router-dom';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleProfile = () => {
    console.log("Đi tới trang cá nhân");
    // navigate('/profile');
    setIsOpen(false);
  };

  const handleSettings = () => {
    console.log("Đi tới cài đặt");
    // navigate('/settings');
    setIsOpen(false);
  };

  const handleLogout = () => {
    // Xóa token, clear session, v.v.
    logout();
    try {
        logout();
    } catch (error) {
        console.error("Error occurred while logging out:", error);
    }
    // redirect to login page after logout
    setIsOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="mr-4">
          <UserRound className="w-5 h-5" />
        </div>

        <div className="hidden md:block text-left">
          <p className="text-sm font-medium">{user?.username || "User"}</p>
          <p className="text-xs text-gray-500">
            {user?.role?.toLowerCase() === "admin" ? "Quản trị viên" : "Người dùng"}
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
                Vai trò: {user?.role?.toLowerCase() === "admin" ? "Administrator" : "User"}
              </p>
              {user?.expiresIn && (
                <p className="text-xs text-gray-400 mt-1">
                  Phiên đăng nhập: {user.expiresIn}s
                </p>
              )}
            </div>

            <button
              onClick={() => {
                navigate("/settings", { state: { tab: "profile" } });
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User size={18} />
              <span>Trang cá nhân</span>
            </button>

            <button
              onClick={() => {
                navigate("/settings", { state: { tab: "security" } });
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings size={18} />
              <span>Cài đặt</span>
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
