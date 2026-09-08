import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUptime, setSystemError, setUsedProcess } from "../store/systemSlice";
import gatewayApi from "../api/gatewayApi";
import {
  showWarningToast
} from '../constants/toastIcons'; 
import toast from "react-hot-toast";
import { useSystemStore } from '../hooks/systemStore';

export default function GlobalSystemFetcher() {
  const dispatch = useDispatch();
  
  const setSystemData = useSystemStore((state) => state.setSystemData);
  const setError = useSystemStore((state) => state.setError);
  
  // Lấy danh sách event đã toast từ sessionStorage
  const getToastedIds = () => {
    const saved = sessionStorage.getItem('toastedEventIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  };

  // Lưu danh sách event đã toast
  const saveToastedIds = (ids) => {
    sessionStorage.setItem('toastedEventIds', JSON.stringify([...ids]));
  };

  const status = [
    "ROUTING_DELETED",
    "ROUTING_UPDATED",
    "HIGH_MEMORY",
    "APPLICATION_START",
    "APPLICATION_STOP",
    "HIGH_CPU"
  ]

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const toastedIds = getToastedIds();
    
    const fetchSystemHistories = async () => {
      try {
        const response = await gatewayApi.getSystemEventsByUser({
          page: 0,
          size: 1,
          userId: user?.userId
        });
        setSystemData(response.unreadCount);

        const historiesList = response?.histories?.items || response?.histories?.content || [];
        const systemEvent = historiesList[0];
        if (!systemEvent) return;

        if (!toastedIds.has(systemEvent.id) && status.includes(systemEvent.eventType)) {
          // Chỉ nổ Toast màn hình cho các cảnh báo tài nguyên hệ thống quan trọng (Tránh nổ 2 toast khi sửa định tuyến)
          if (systemEvent.eventType === "HIGH_MEMORY" || systemEvent.eventType === "HIGH_CPU") {
            showWarningToast(systemEvent.title, toast);
          }

          // Đánh dấu event này đã toast
          toastedIds.add(systemEvent.id);
          saveToastedIds(toastedIds);
        }
      } catch (err) {
        setError(err.message);
        console.error("FETCH SYSTEM HISTORIES FAILED:", err.message);
      }
    };

    fetchSystemHistories();

    const interval = setInterval(fetchSystemHistories, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSystem = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // timeout 3s

      try {
        const response = await gatewayApi.getSystemHealth({
          signal: controller.signal, // truyền signal vào axios/fetch
          headers: { "Cache-Control": "no-store" }, // tránh cache
        });
        
        clearTimeout(timeoutId);
        
        const uptime = response?.gatewayCp?.jvmUptimeSeconds;
        dispatch(setUptime(uptime));
        dispatch(setUsedProcess({
          gatewayCp: response?.gatewayCp,
          mysql: response?.mysql,
          // Nhãn thời gian tạo ở đây để reducer giữ được tính thuần
          timeLabel: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
        }));
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("FETCH SYSTEM FAILED:", err.message);

        dispatch(setSystemError("System monitoring service is down"));
      }
    };

    // gọi lần đầu
    fetchSystem();

    // polling mỗi 1s
    const interval = setInterval(fetchSystem, 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return null;
}
