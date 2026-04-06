import { create } from 'zustand';

const DEFAULT_API_URL = import.meta.env.VITE_MESSAGE_API_URL || '/api/messages';

/**
 * Zustand store for managing message data and statistics.
 * Provides state management for messages, loading states, errors, and computed stats.
 * Includes methods to set messages, add new messages, load sample data, and fetch from API.
 */
export const useMessageStore = create((set) => ({
  messages: [], // Array of message objects
  stats: { total: 0, failed: 0, vip: 0 }, // Computed statistics
  loading: false, // Loading state for API calls
  error: null, // Error message if any

  /**
   * Sets the messages array and updates statistics.
   * Limits messages to the first 50 items.
   * @param {Array} messages - Array of message objects.
   */
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

  /**
   * Adds a new message to the beginning of the messages array.
   * Updates statistics accordingly and maintains max 50 messages.
   * @param {Object} msg - The message object to add.
   */
  addMessage: (msg) => set((state) => ({
    messages: [msg, ...state.messages].slice(0, 50),
    stats: {
      total: state.stats.total + 1,
      failed: msg.status === 'FAILED' ? state.stats.failed + 1 : state.stats.failed,
      vip: msg.priority === 'VIP' ? state.stats.vip + 1 : state.stats.vip,
    },
  })),

  /**
   * Loads sample data for demonstration purposes.
   * Sets loading to false, clears error, and populates with sample messages.
   */
  loadSampleData: () => {
    const sample = [
      { id: '1', time: new Date().toISOString(), flight: 'HVN123', type: 'FPL', status: 'SUCCESS', priority: 'NORMAL' },
      { id: '2', time: new Date(Date.now() - 60000).toISOString(), flight: 'DAD456', type: 'CHG', status: 'FAILED', priority: 'VIP' },
      { id: '3', time: new Date(Date.now() - 120000).toISOString(), flight: 'SGN789', type: 'NEW', status: 'SUCCESS', priority: 'NORMAL' },
    ];
    set({ loading: false, error: null, messages: sample, stats: { total: sample.length, failed: 1, vip: 1 } });
  },

  /**
   * Fetches messages from the API endpoint.
   * Sets loading state, handles errors, and updates messages and stats on success.
   * @param {string} url - The API URL to fetch from (defaults to DEFAULT_API_URL).
   */
  fetchMessages: async (url = DEFAULT_API_URL) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned error ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('API data is not an array');
      }
      set((state) => ({ ...state, loading: false, error: null, messages: data.slice(0, 50), stats: {
        total: data.length,
        failed: data.filter((m) => m.status === 'FAILED').length,
        vip: data.filter((m) => m.priority === 'VIP').length,
      }}));
    } catch (err) {
      set({ loading: false, error: err.message || 'Failed to fetch data from API' });
    }
  },
}));