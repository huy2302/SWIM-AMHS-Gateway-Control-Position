import axiosClient, { authUtils } from './axiosClient';

export const authApi = {
  // Đăng nhập
  login: async (username, password) => {
    const response = await axiosClient.post('/auth/login', {
      username,
      password,
    });

    const user = response.user || response;
    const safeUser = { ...user };
    if (safeUser.password) {
      delete safeUser.password;
    }

    const authPayload = {
      user: safeUser,
      token: response.token || response.accessToken || response.authToken || null,
      expiresAt: response.expiresAt || response.exp || null,
    };

    authUtils.saveAuth(authPayload);

    return response;
  },

  // Đăng xuất
  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Luôn xóa local data
      authUtils.removeAuth();
    }
  },

  // Refresh token
  refreshToken: async () => {
    const auth = authUtils.getAuth();
    if (!auth?.token) {
      authUtils.removeAuth();
      throw new Error('No token available to refresh');
    }
    try {
      const response = await axiosClient.post('/auth/refresh');
      authUtils.saveAuth(response);
      return response;
    } catch (error) {
      authUtils.removeAuth();
      throw error;
    }
  },

  // Đổi mật khẩu
  changePassword: async (oldPassword, newPassword) => {
    const response = await axiosClient.post('/auth/change-password', {
      oldPassword,
      newPassword
    });
    return response;
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: () => {
    return authUtils.getAuth();
  },

  verifyPassword: async (userId, password) => {
    try {
      const response = await axiosClient.post('/auth/verify-password', { userId, password });
      return response?.success === true;
    } catch (error) {
      console.warn('Password verification failed:', error);
      return false;
    }
  },

  // Kiểm tra đăng nhập
  isAuthenticated: () => {
    return authUtils.isAuthenticated();
  }
};

export default authApi;