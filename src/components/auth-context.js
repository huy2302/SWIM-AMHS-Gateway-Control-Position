import { createContext, useContext } from 'react';

/**
 * Context và hook đọc trạng thái đăng nhập.
 *
 * Tách khỏi file component (AuthProvider.jsx) vì Fast Refresh của Vite chỉ hoạt động khi một
 * file chỉ export component; để chung hook với component thì mỗi lần sửa sẽ reload cả trang
 * thay vì cập nhật tại chỗ.
 */
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
