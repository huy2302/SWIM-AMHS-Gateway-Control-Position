import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook quản lý polling tự động làm mới dữ liệu cho các bảng.
 *
 * @param {Object} options
 * @param {Function} options.onRefresh - Callback lấy dữ liệu, nhận tham số (isBackground: boolean)
 * @param {number} [options.defaultInterval=5000] - Chu kỳ mặc định tính bằng ms (mặc định 5000ms = 5s, 0 là tắt)
 * @param {boolean} [options.enabled=true] - Bật/tắt polling
 * @param {boolean} [options.pauseCondition=false] - Điều kiện tạm dừng (ví dụ: đang mở modal chỉnh sửa)
 * @returns {Object} { intervalTime, setIntervalTime, isRefreshing, triggerRefresh }
 */
export function useAutoRefresh({
  onRefresh,
  defaultInterval = 5000,
  enabled = true,
  pauseCondition = false,
}) {
  const [intervalTime, setIntervalTime] = useState(defaultInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefreshRef.current) {
        await onRefreshRef.current(false);
      }
    } catch (err) {
      console.error("Manual refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (!enabled || !intervalTime || intervalTime <= 0 || pauseCondition) {
      return;
    }

    const timer = setInterval(async () => {
      // Tạm dừng khi tab bị ẩn để tiết kiệm mạng và tài nguyên backend
      if (document.hidden) return;

      try {
        setIsRefreshing(true);
        if (onRefreshRef.current) {
          await onRefreshRef.current(true);
        }
      } catch (err) {
        console.error("Auto refresh failed:", err);
      } finally {
        setIsRefreshing(false);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [enabled, intervalTime, pauseCondition]);

  return {
    intervalTime,
    setIntervalTime,
    isRefreshing,
    triggerRefresh,
  };
}
