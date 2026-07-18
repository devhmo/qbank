"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/dashboardStats";

function formatDateLabel(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AccuracyTrendChart({ data }: { data: TrendPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: formatDateLabel(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} unit="%" width={40} />
        <Tooltip
          formatter={(value, _name, item) => [
            `${value}% (${item.payload.total} answered)`,
            "Accuracy",
          ]}
          contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke="#2c649f"
          strokeWidth={2}
          dot={{ r: 3, fill: "#2c649f" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
