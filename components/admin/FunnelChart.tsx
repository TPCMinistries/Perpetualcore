"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FunnelStep {
  event_type: string;
  label: string;
  count: number;
  unique_users: number;
  conversion_rate: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
}

const COLORS = [
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a78bfa", // violet-400
  "#c4b5fd", // violet-300
  "#818cf8", // indigo-400
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
];

export function FunnelChart({ steps }: FunnelChartProps) {
  if (!steps.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No funnel data yet
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Waterfall funnel */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={steps}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fontSize: 13 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload as FunnelStep;
              return (
                <div className="bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {data.label}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {data.unique_users.toLocaleString()} unique users
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {data.count.toLocaleString()} total events
                  </p>
                  {data.conversion_rate > 0 && (
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                      {data.conversion_rate}% from previous step
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="unique_users" radius={[0, 4, 4, 0]}>
            {steps.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion rates between steps */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {steps.map((step, i) => (
          <div
            key={step.event_type}
            className="text-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {step.label}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {step.unique_users.toLocaleString()}
            </p>
            {i > 0 && (
              <p
                className={`text-xs font-medium ${
                  step.conversion_rate >= 50
                    ? "text-emerald-600"
                    : step.conversion_rate >= 20
                      ? "text-amber-600"
                      : "text-red-500"
                }`}
              >
                {step.conversion_rate}%
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
