"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SubjectBreakdown } from "@/types/models";

export default function SubjectPerformanceChart({ data }: { data: SubjectBreakdown[] }) {
  const chartData = data.map((d) => ({
    name: d.subjectName,
    pct: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
    total: d.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#64748b" }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={50}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} unit="%" width={40} />
        <Tooltip
          formatter={(value, _name, item) => [
            `${value}% (${item.payload.total} answered)`,
            "Accuracy",
          ]}
          contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 13 }}
        />
        <Bar dataKey="pct" fill="#3a7ebd" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
