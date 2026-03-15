"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendDataPoint {
  day: string;
  page_views: number;
  signups: number;
  conversions: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No trend data yet
      </div>
    );
  }

  // Format day labels
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.day + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="page_views"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          name="Page Views"
        />
        <Line
          type="monotone"
          dataKey="signups"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="Signups"
        />
        <Line
          type="monotone"
          dataKey="conversions"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          name="Conversions"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
