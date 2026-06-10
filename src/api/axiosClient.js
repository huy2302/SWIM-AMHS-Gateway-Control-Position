import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.22.188:8180/api', // Đổi port nếu Spring Boot chạy port khác
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth utility functions
export const authUtils = {
  // Lưu auth data sau khi login thành công
  saveAuth: (authData) => {
    localStorage.setItem('auth', JSON.stringify(authData));
  },

  // Lấy auth data
  getAuth: () => {
    const authData = localStorage.getItem('auth');
    return authData ? JSON.parse(authData) : null;
  },

  // Xóa auth data (logout)
  removeAuth: () => {
    localStorage.removeItem('auth');
  },

  // Kiểm tra có token hợp lệ không
  isAuthenticated: () => {
    const auth = authUtils.getAuth();
    if (!auth?.token) return false;

    try {
      // Giải mã JWT để kiểm tra expiration (đơn giản)
      const payload = JSON.parse(atob(auth.token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.warn('Invalid token format:', error);
      return false;
    }
  }
};

axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ auth utils
    const auth = authUtils.getAuth();
    if (auth?.token) {
      config.headers['Authorization'] = `Bearer ${auth.token}`;
      // console.log('🔐 Sending request with JWT token:', config.url);
    } else {
      // console.log('🚫 Sending request without token:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý dữ liệu hoặc lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => {
    // console.log('✅ API Response:', response.config.url, response.status);
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('❌ API Error:', error.config?.url, error.response?.status, error.response?.data);

    // Nếu gặp lỗi 401 và chưa retry, thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axiosClient.post('/auth/refresh');

        const auth = authUtils.getAuth();
        const newAuthData = {
          ...auth,
          token: refreshResponse.token
        };
        authUtils.saveAuth(newAuthData);

        originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.token}`;
        return axiosClient(originalRequest);

      } catch (refreshError) {
        authUtils.removeAuth();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
