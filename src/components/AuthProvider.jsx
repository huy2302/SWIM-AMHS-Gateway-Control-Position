import { useState } from 'react';
import { authUtils } from '../api/axiosClient';
import { AuthContext } from './auth-context';

/**
 * Đọc phiên đăng nhập đã lưu trong localStorage.
 * Trả về null nếu thiếu token hoặc dữ liệu hỏng.
 */
const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return storedUser && token ? JSON.parse(storedUser) : null;
  } catch {
    // localStorage bị chặn hoặc dữ liệu không phải JSON hợp lệ - coi như chưa đăng nhập
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Khởi tạo trực tiếp từ localStorage thay vì đọc trong useEffect rồi setState:
  // dữ liệu đã có sẵn ngay lần render đầu nên không cần render lại lần hai.
  const [user, setUser] = useState(readStoredUser);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    authUtils.saveAuth({ user: userData, token });
  };

  const logout = () => {
    setUser(null);
    authUtils.removeAuth();
  };

  // role lấy từ claim trong JWT hiện tại (nguồn duy nhất, luôn đồng bộ qua các lần refresh token),
  // fallback về user.role (response /auth/login) nếu vì lý do gì đó chưa decode được token
  const getRole = () => authUtils.getRole() || user?.role;
  const isAdmin = () => getRole()?.toLowerCase() === 'admin';
  const getUsername = () => user?.username;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin,
      getUsername,
      getRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};
