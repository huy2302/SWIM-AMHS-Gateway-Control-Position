import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.22.160:8180/api', // Đổi port nếu Spring Boot chạy port khác
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth utility functions
export const authUtils = {
  // Lưu auth data sau khi login thành công
  saveAuth: (authData) => {
    const parseJwtExpiry = (token) => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : Date.now() + 3600 * 1000;
      } catch (err) {
        return Date.now() + 3600 * 1000;
      }
    };

    const expiresAt = authData.expiresAt
      ? typeof authData.expiresAt === 'string'
        ? Date.parse(authData.expiresAt)
        : authData.expiresAt
      : authData.token
        ? parseJwtExpiry(authData.token)
        : Date.now() + 3600 * 1000;

    const savedAuth = {
      ...authData,
      expiresAt,
    };

    localStorage.setItem('auth', JSON.stringify(savedAuth));
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

  // Kiểm tra phiên đăng nhập còn hiệu lực
  isAuthenticated: () => {
    const auth = authUtils.getAuth();
    if (!auth) return false;

    if (auth.expiresAt && Date.now() > auth.expiresAt) {
      authUtils.removeAuth();
      return false;
    }

    if (auth.token) {
      try {
        const payload = JSON.parse(atob(auth.token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp <= currentTime) {
          authUtils.removeAuth();
          return false;
        }
      } catch (error) {
        console.warn('Invalid token format:', error);
        authUtils.removeAuth();
        return false;
      }
    }

    return Boolean(auth.token || auth.user);
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

    console.error('❌ API Error:', originalRequest?.url, error.response?.status, error.response?.data);

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Nếu gặp lỗi 401 và chưa retry, thử refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axiosClient.post('/auth/refresh');
        const auth = authUtils.getAuth();

        authUtils.saveAuth({
          ...auth,
          token: refreshResponse.token,
        });

        originalRequest.headers.Authorization = `Bearer ${refreshResponse.token}`;
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
