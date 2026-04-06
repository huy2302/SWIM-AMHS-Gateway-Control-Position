import React from "react";

export default function Bottombar() {
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
    <div className="flex justify-between pl-4 pr-4 text-slate-500">
      <div>
        <h3>Connected to server Nova</h3>
      </div>
      <div>
        <h3>
          Curent time: <span className="time">{currentTime}</span>
        </h3>
      </div>
    </div>
  );
}
