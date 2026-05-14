import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUptime, setSystemError, setUsedProcess  } from "../store/systemSlice";
import gatewayApi from "../api/gatewayApi";

export default function GlobalSystemFetcher() {
  const dispatch = useDispatch();

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

        const uptime = response?.gatewayCp?.serviceUptimeSec ?? 0;
        dispatch(setUptime(uptime));
        dispatch(setUsedProcess({
          cpu: response.gatewayCp.systemCpu,
          memory: response.gatewayCp.totalRamPercent
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
