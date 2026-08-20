// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authUtils } from '../api/axiosClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('auth'); 
  };

  // Helper functions
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
      loading,
      isAdmin,
      getUsername,
      getRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};