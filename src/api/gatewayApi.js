import axiosClient from './axiosClient';

const gatewayApi = {
  // --- 1. ACCOUNT MANAGEMENT (Quản lý kết nối/tài khoản) ---
  getAccounts: () => {
    return axiosClient.get('/accounts');
  },
  
  createAccount: (data) => {
    return axiosClient.post('/accounts', data);
  },

  updateAccount: async (uuid, account) => {
    console.log("Updating account with UUID:", uuid, "Data:", account);
    try {
      const response = await axiosClient.put(`/accounts/${uuid}`, account, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      return response;
    } catch (error) {
      console.error("API updateAccount error:", error);

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

  deleteAccount: (uuid) => {
    return axiosClient.delete(`/accounts/${uuid}`);
  },

  updateBindStatus: (uuid, status) => {
    // Cập nhật trạng thái Bind (kết nối) của tài khoản
    return axiosClient.patch(`/accounts/${uuid}/bind-status`, { status });
  },

  // --- 2. ROUTING CONFIGURATION (Cấu hình định tuyến) ---
  getRoutings: async () => {
    const data = await axiosClient.get('/routing');

    return {
      a2s: data.filter(r => r.direction === "OUT"),
      s2a: data.filter(r => r.direction === "IN"),
    };
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

  getMessageLog: async () => {
    const data = await axiosClient.get('/message-logs/latest');

    return data;
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

  getSystemHealth: () => {
    // Thông tin sức khỏe hệ thống (CPU, RAM, Disk, MySQL)
    return axiosClient.get('/system/health');
  },

  // Lấy số liệu tổng hợp cho dashboard (các card thống kê)
  getDashboardStats: () => {
    return axiosClient.get('/monitor/stats');
  },

  // --- 4. MESSAGE ARCHIVE & LOGS (Tra cứu điện văn và Log) ---
  getAllSwimMessages: (params) => {
    // Lấy toàn bộ điện văn đã lưu trữ (có phân trang/lọc)
    return axiosClient.get('/messages/inbound', { params });
  },

  getAllAmhsMessages: (params) => {
    // Lấy toàn bộ điện văn đã lưu trữ (có phân trang/lọc)
    return axiosClient.get('/messages/outbound', { params });
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
