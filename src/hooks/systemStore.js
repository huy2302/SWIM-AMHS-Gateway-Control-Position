// systemStore.js
import { create } from 'zustand';

export const useSystemStore = create((set) => ({
  // 1. Khởi tạo state ban đầu
  unreadCount: null,
  isLoading: true,
  error: null,

  // 2. Hàm để GlobalSystemFetcher cập nhật dữ liệu liên tục vào store
  setSystemData: (newData) => set({ unreadCount: newData, isLoading: false }),
  
  // 3. Hàm để cập nhật lỗi nếu fetch thất bại (tùy chọn)
  setError: (err) => set({ error: err, isLoading: false }),
}));
