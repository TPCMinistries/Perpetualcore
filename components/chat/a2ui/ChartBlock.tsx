"use client";

import type { A2UIBlock } from "@/lib/a2ui/types";
import type { ChartBlockData } from "@/lib/a2ui/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const DEFAULT_COLORS = [
  "#8b5cf6", // violet-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
];

interface ChartBlockProps {
  block: A2UIBlock;
}

export default function ChartBlock({ block }: ChartBlockProps) {
  const data = block.data as ChartBlockData;
  const colors = data.colors || DEFAULT_COLORS;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(data, colors)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderChart(data: ChartBlockData, colors: string[]) {
  const { chartType, xKey, yKey, stacked } = data;

  switch (chartType) {
    case "bar":
      return (
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12 }}
            className="text-slate-600 dark:text-slate-400"
          />
          <YAxis tick={{ fontSize: 12 }} className="text-slate-600 dark:text-slate-400" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, #1e293b)",
              border: "1px solid var(--tooltip-border, #334155)",
              borderRadius: "8px",
              color: "var(--tooltip-text, #e2e8f0)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey={yKey}
            fill={colors[0]}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? "stack" : undefined}
          />
        </BarChart>
      );

    case "line":
      return (
        <LineChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, #1e293b)",
              border: "1px solid var(--tooltip-border, #334155)",
              borderRadius: "8px",
              color: "var(--tooltip-text, #e2e8f0)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ fill: colors[0], r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      );

    case "area":
      return (
        <AreaChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, #1e293b)",
              border: "1px solid var(--tooltip-border, #334155)",
              borderRadius: "8px",
              color: "var(--tooltip-text, #e2e8f0)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      );

    case "pie":
      return (
        <PieChart>
          <Pie
            data={data.data}
            dataKey={yKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }: { name: string; percent: number }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            labelLine={{ strokeWidth: 1 }}
          >
            {data.data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, #1e293b)",
              border: "1px solid var(--tooltip-border, #334155)",
              borderRadius: "8px",
              color: "var(--tooltip-text, #e2e8f0)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      );

    default:
      return (
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={yKey} fill={colors[0]} />
        </BarChart>
      );
  }
}
