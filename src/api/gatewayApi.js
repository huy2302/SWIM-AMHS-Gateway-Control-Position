import axiosClient from './axiosClient';

const gatewayApi = {
  // --- 1. ACCOUNT MANAGEMENT (Quản lý kết nối/tài khoản) ---
  getAccounts: () => {
    return axiosClient.get('/accounts');
  },
  
  createAccount: (data) => {
    return axiosClient.post('/accounts', data);
  },

  updateBindStatus: (uuid, status) => {
    // Cập nhật trạng thái Bind (kết nối) của tài khoản
    return axiosClient.patch(`/accounts/${uuid}/bind-status`, { status });
  },

  // --- 2. ROUTING CONFIGURATION (Cấu hình định tuyến) ---
  getRoutingA2s: () => {
    return axiosClient.get('/routing/a2s');
  },

  getRoutingS2a: () => {
    return axiosClient.get('/routing/s2a');
  },

  getRoutings: () => {
    return Promise.all([
      axiosClient.get('/routing/a2s'),
      axiosClient.get('/routing/s2a'),
    ]).then(([a2s, s2a]) => ({ a2s, s2a }));
  },

  createRouting: async (data) => {
    try {
      const response = await axiosClient.post("/routing", data, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("API createRouting error:", error);

      if (error.response) {
        // server trả lỗi
        throw new Error(error.response.data?.message || "Server error");
      } else if (error.request) {
        // không gọi được API
        throw new Error("Cannot connect to Gateway API");
      } else {
        throw new Error(error.message);
      }
    }
  },

  deleteRouting: (uuid) => {
    return axiosClient.delete(`/routing/${uuid}`);
  },

  // --- 3. MONITORING & PERFORMANCE (Giám sát hệ thống) ---
  getLatestMetrics: () => {
    // Lấy thông số CPU, RAM, Message count mới nhất để vẽ biểu đồ
    return axiosClient.get('/metrics/latest');
  },

  getSystemStatus: () => {
    // Trạng thái tổng quát của SWIM
    return axiosClient.get('/swim/status');
  },

  // --- 4. MESSAGE ARCHIVE & LOGS (Tra cứu điện văn và Log) ---
  getAllArchives: (params) => {
    // Lấy toàn bộ điện văn đã lưu trữ (có phân trang/lọc)
    return axiosClient.get('/archive/all', { params });
  },

  updateArchiveStatus: (uuid, status) => {
    // Cập nhật trạng thái xử lý của điện văn (ví dụ: đánh dấu đã xử lý lại)
    return axiosClient.patch(`/archive/${uuid}/status`, { status });
  },

  searchMessages: (query) => {
    // Tìm kiếm điện văn theo nội dung hoặc metadata
    return axiosClient.get('/archive/search', { params: { q: query } });
  },

  getGatewayLogs: (params) => {
    // Log chi tiết luồng xử lý của Gateway (AMHS <-> SWIM)
    return axiosClient.get('/gateway-logs', { params });
  },

  getSystemLogsByModule: (module) => {
    // Lọc log hệ thống theo từng module cụ thể (Control Position, Adapter...)
    return axiosClient.get(`/system-logs/module/${module}`);
  },

  // Lấy dữ liệu từ bảng message_conversion_log (X.400)
  getConversionLogs: (params) => {
    return axiosClient.get('/conversions', { params });
  },
};

export default gatewayApi;
