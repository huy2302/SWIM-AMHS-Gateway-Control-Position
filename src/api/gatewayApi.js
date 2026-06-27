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

  updateRouting: async (id, data) => {
    try {
      const response = await axiosClient.put(`/routing/${id}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      console.error("API updateRouting error:", error);

      if (error.response) {
        // Server trả về lỗi (ví dụ: 404 Not Found hoặc 400 Bad Request)
        throw new Error(error.response.data?.message || "Server error occurred while updating");
      } else if (error.request) {
        // Request đã gửi nhưng không nhận được phản hồi (lỗi mạng/gateway)
        throw new Error("Cannot connect to Gateway API");
      } else {
        // Lỗi thiết lập request
        throw new Error(error.message);
      }
    }
  },

  deleteRouting: (uuid) => {
    return axiosClient.delete(`/routing/${uuid}`);
  },

  getMessageLog: async () => {
    const data = await axiosClient.get('/traffic-logs');

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

  getSystemEvents: (params) => {
    // Lấy dữ liệu từ bảng system_history (System Events)
    return axiosClient.get('/system-history', { params });
  },

  getSystemEventsByUser: (params) => {
    if (params.userId) {
      // Lấy dữ liệu từ bảng system_history (System Events)
      return axiosClient.get('/system-history/user', { params });
    } else {
      return axiosClient.get('/system-history', { params });
    }
  },

  postReadNotify: async (userId, historyId) => {
    return axiosClient.put(`/user-system-history/user/${userId}/history/${historyId}/read`);
  },

  postReadAllNotify: async (userId) => {
    return axiosClient.put(`/user-system-history/user/${userId}/read-all`);
  },

  // --- 5. USER MANAGEMENT (Quản lý người dùng và vai trò) ---
  getUsers: (params) => {
    return axiosClient.get('/users', { params });
  },

  createUser: (data) => {
    return axiosClient.post('/users', data);
  },

  updateUser: (id, data) => {
    return axiosClient.put(`/users/${id}`, data);
  },

  deleteUser: (id) => {
    return axiosClient.delete(`/users/${id}`);
  },

  activateUser: (id) => {
    return axiosClient.put(`/users/${id}/activate`);
  },

  deactivateUser: (id) => {
    return axiosClient.put(`/users/${id}/deactivate`);
  },

  getUserRoles: () => {
    return axiosClient.get('/metadata/roles');
  },

  getMessageTypes: () => {
    return axiosClient.get('/metadata/message-types');
  },

  // --- 6. UNROUTED QUEUE & STATISTICS (Quản lý hàng đợi định tuyến lỗi) ---
  getUnroutedMessages: (params) => {
    return axiosClient.get('/addressing/unrouted', { params });
  },

  manualRoute: (msgid, data) => {
    return axiosClient.post(`/addressing/unrouted/${msgid}/route`, data);
  },

  rejectUnrouted: (msgid, data) => {
    return axiosClient.post(`/addressing/unrouted/${msgid}/reject`, data);
  },

  batchRouteUnrouted: (data) => {
    return axiosClient.post('/addressing/unrouted/batch-route', data);
  },

  getAddressingDistribution: (period) => {
    return axiosClient.get('/addressing/stats/distribution', { params: { period } });
  },

  getAddressingSuccessRate: (period) => {
    return axiosClient.get('/addressing/stats/success-rate', { params: { period } });
  },

  // --- 7. ALERTS MANAGEMENT (Quản lý cảnh báo lỗi) ---
  getAlerts: () => {
    return axiosClient.get('/alerts');
  },

  getAlertsByStatus: (status) => {
    return axiosClient.get(`/alerts/status/${status}`);
  },

  acknowledgeAlert: (id) => {
    return axiosClient.put(`/alerts/${id}/ack`);
  },

  resolveAlert: (id) => {
    return axiosClient.put(`/alerts/${id}/resolve`);
  },

  bulkAcknowledgeAlerts: () => {
    return axiosClient.put('/alerts/bulk-ack');
  },

  bulkResolveAlerts: () => {
    return axiosClient.put('/alerts/bulk-resolve');
  },

  // --- 8. SYSTEM CONFIGURATION (Quản lý cấu hình cổng) ---
  getConfigs: () => {
    return axiosClient.get('/config');
  },

  getConfig: (key) => {
    return axiosClient.get(`/config/${key}`);
  },

  updateConfig: (key, value) => {
    return axiosClient.put(`/config/${key}`, { value });
  },

  // --- 9. MESSAGE OPERATIONS (Thao tác trên điện văn) ---
  retryInboundMessage: (id) => {
    return axiosClient.post(`/messages/inbound/${id}/retry`);
  },

  resolveInboundMessage: (id) => {
    return axiosClient.post(`/messages/inbound/${id}/resolve`);
  },

  cancelInboundMessage: (id) => {
    return axiosClient.post(`/messages/inbound/${id}/cancel`);
  },

  deleteInboundMessage: (id) => {
    return axiosClient.delete(`/messages/inbound/${id}`);
  },

  retryOutboundMessage: (id) => {
    return axiosClient.post(`/messages/outbound/${id}/retry`);
  },

  resolveOutboundMessage: (id) => {
    return axiosClient.post(`/messages/outbound/${id}/resolve`);
  },

  cancelOutboundMessage: (id) => {
    return axiosClient.post(`/messages/outbound/${id}/cancel`);
  },

  deleteOutboundMessage: (id) => {
    return axiosClient.delete(`/messages/outbound/${id}`);
  },

  // --- 10. SYSTEM MAINTENANCE & DIAGNOSTICS (Bảo trì và chẩn đoán) ---
  deleteOldData: () => {
    return axiosClient.delete('/admin/data/old', { data: {} });
  },

  runMaintenance: () => {
    return axiosClient.post('/admin/maintenance');
  },

  getDiagnostics: () => {
    return axiosClient.post('/admin/diagnostic');
  },

  convertAddress: (address) => {
    return axiosClient.post('/admin/address/convert', { address });
  },
};

export default gatewayApi;
