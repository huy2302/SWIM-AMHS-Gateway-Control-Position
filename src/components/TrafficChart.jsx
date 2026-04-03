import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { time: "09:30", in: 120, out: 60 },
  { time: "09:35", in: 280, out: 70 },
  { time: "09:40", in: 150, out: 50 },
  { time: "09:45", in: 230, out: 80 },
  { time: "09:50", in: 170, out: 90 },
];

export default function TrafficChart() {
  return (
    <div className="panel">
      <h4>Traffic Flow</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="time" stroke="#ccc"/>
          <YAxis stroke="#ccc"/>
          <Tooltip />
          <Line type="monotone" dataKey="in" stroke="#2ecc71"/>
          <Line type="monotone" dataKey="out" stroke="#bdc3c7"/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}