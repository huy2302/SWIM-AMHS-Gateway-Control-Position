import dayjs from "dayjs";
import React from "react";

export default function SystemHealth() {
  const useClock = () => {
    const [time, setTime] = React.useState(new Date());
    React.useEffect(() => {
      const tick = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(tick);
    }, []);
    return (
      time.toLocaleTimeString("vi-VN") +
      " | " +
      time.toLocaleDateString("vi-VN")
    );
  };

  const currentTime = useClock();
  return (
    <>
      <div className="systemHealth">
        <b>SỨC KHỎE HỆ THỐNG:</b>
        AMHS: [MAIN <span className="acp">OK</span>]
        [STBY: <span className="acp">OK</span>]
        [STBY2: <span className="err">DISCONNECT</span>]
        [GATEWAY: <span className="acp">ACTIVE</span>]
        [SOLACE/SWIM: <span className="acp">CONNECTED</span>]
        <span className="time" style={{color: '#ccc'}}>{currentTime}</span>
      </div>
    </>
  );
}
