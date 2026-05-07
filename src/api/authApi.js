import axiosClient, { authUtils } from './axiosClient';

export const authApi = {
  // Đăng nhập
  login: async (username, password) => {
    try {
      const response = await axiosClient.post('/auth/login', {
        username,
        password
      });

      // Lưu auth data vào localStorage
      authUtils.saveAuth(response);

      return response;
    } catch (error) {
      throw error;
    }
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

  // Kiểm tra đăng nhập
  isAuthenticated: () => {
    return authUtils.isAuthenticated();
  }
};

export default authApi;