import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api', // Đổi port nếu Spring Boot chạy port khác
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để xử lý dữ liệu hoặc lỗi tập trung (tùy chọn)
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
