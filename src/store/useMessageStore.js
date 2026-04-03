import { create } from 'zustand';

const DEFAULT_API_URL = import.meta.env.VITE_MESSAGE_API_URL || '/api/messages';

export const useMessageStore = create((set) => ({
  messages: [],
  stats: { total: 0, failed: 0, vip: 0 },
  loading: false,
  error: null,

  setMessages: (messages = []) => set((state) => ({
    messages: messages.slice(0, 50),
    stats: {
      total: messages.length,
      failed: messages.filter((m) => m.status === 'FAILED').length,
      vip: messages.filter((m) => m.priority === 'VIP').length,
    },
    loading: false,
    error: null,
  })),

  addMessage: (msg) => set((state) => ({
    messages: [msg, ...state.messages].slice(0, 50),
    stats: {
      total: state.stats.total + 1,
      failed: msg.status === 'FAILED' ? state.stats.failed + 1 : state.stats.failed,
      vip: msg.priority === 'VIP' ? state.stats.vip + 1 : state.stats.vip,
    },
  })),

  loadSampleData: () => {
    const sample = [
      { id: '1', time: new Date().toISOString(), flight: 'HVN123', type: 'FPL', status: 'SUCCESS', priority: 'NORMAL' },
      { id: '2', time: new Date(Date.now() - 60000).toISOString(), flight: 'DAD456', type: 'CHG', status: 'FAILED', priority: 'VIP' },
      { id: '3', time: new Date(Date.now() - 120000).toISOString(), flight: 'SGN789', type: 'NEW', status: 'SUCCESS', priority: 'NORMAL' },
    ];
    set({ loading: false, error: null, messages: sample, stats: { total: sample.length, failed: 1, vip: 1 } });
  },

  fetchMessages: async (url = DEFAULT_API_URL) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API trả về lỗi ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Dữ liệu API không phải dạng mảng');
      }
      set((state) => ({ ...state, loading: false, error: null, messages: data.slice(0, 50), stats: {
        total: data.length,
        failed: data.filter((m) => m.status === 'FAILED').length,
        vip: data.filter((m) => m.priority === 'VIP').length,
      }}));
    } catch (err) {
      set({ loading: false, error: err.message || 'Không thể lấy dữ liệu từ API' });
    }
  },
}));