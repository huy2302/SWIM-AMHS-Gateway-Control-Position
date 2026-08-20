import axios from 'axios';
import toast from 'react-hot-toast';
import { useLanguageStore } from '../store/languageStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.22.160:8180/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Decode JWT Payload (base64url)
const decodeJwtPayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (err) {
    return null;
  }
};

// Auth utility functions
export const authUtils = {
  saveAuth: (authData) => {
    const parseJwtExpiry = (token) => {
      const payload = decodeJwtPayload(token);
      return payload?.exp ? payload.exp * 1000 : Date.now() + 3600 * 1000;
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

  getAuth: () => {
    const authData = localStorage.getItem('auth');
    return authData ? JSON.parse(authData) : null;
  },

  removeAuth: () => {
    localStorage.removeItem('auth');
  },

  isAuthenticated: () => {
    const auth = authUtils.getAuth();
    if (!auth) return false;

    if (auth.expiresAt && Date.now() > auth.expiresAt) {
      authUtils.removeAuth();
      return false;
    }

    if (auth.token) {
      const payload = decodeJwtPayload(auth.token);
      if (!payload) {
        console.warn('Invalid token format');
        authUtils.removeAuth();
        return false;
      }
      const currentTime = Date.now() / 1000;
      if (payload.exp && payload.exp <= currentTime) {
        authUtils.removeAuth();
        return false;
      }
    }

    return Boolean(auth.token || auth.user);
  },

  getRole: () => {
    const auth = authUtils.getAuth();
    if (!auth?.token) return null;
    const payload = decodeJwtPayload(auth.token);
    return payload?.role || null;
  }
};

axiosClient.interceptors.request.use(
  (config) => {
    const auth = authUtils.getAuth();
    if (auth?.token) {
      config.headers['Authorization'] = `Bearer ${auth.token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Bóc tách ApiResponse & Bọc Alias Đồng Nhất 100% cho FE
axiosClient.interceptors.response.use(
  (response) => {
    const resData = response.data;
    if (resData && typeof resData === 'object' && 'success' in resData) {
      if (!resData.success) {
        return Promise.reject(new Error(resData.message || 'API Request Failed'));
      }
      return resData.data;
    }
    return resData;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error('API Error:', originalRequest?.url, error.response?.status, error.response?.data);

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      const lang = (useLanguageStore.getState().language || 'en').split('-')[0];
      const message =
        error.response?.data?.message || error.response?.data?.error ||
        (lang === 'vi' ? 'Bạn không có quyền thực hiện thao tác này' : 'You do not have permission to perform this action');
      toast.error(message);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axiosClient.post('/auth/refresh');
        const auth = authUtils.getAuth();

        authUtils.saveAuth({
          user: auth?.user,
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
