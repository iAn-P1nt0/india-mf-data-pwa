"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import styles from "./NAVChart.module.css";

type NavPoint = {
  date: string;
  nav: number;
};

interface NAVChartProps {
  points: NavPoint[];
  height?: number;
  showArea?: boolean;
}

export function NAVChart({ points, height = 300, showArea = true }: NAVChartProps) {
  if (!points || points.length === 0) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p>No NAV data available</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const formatNav = (value: number) => `₹${value.toFixed(2)}`;

  const minNav = Math.min(...points.map((p) => p.nav));
  const maxNav = Math.max(...points.map((p) => p.nav));
  const yDomain = [
    (minNav * 0.995).toFixed(2),
    (maxNav * 1.005).toFixed(2)
  ];

  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height={height}>
        {showArea ? (
          <AreaChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={formatNav}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
              }}
              labelStyle={{ color: "#6b7280", fontSize: "0.75rem", marginBottom: "0.25rem" }}
              itemStyle={{ color: "#111827", fontSize: "0.875rem", fontWeight: "600" }}
              formatter={(value: number) => [`₹${value.toFixed(4)}`, "NAV"]}
              labelFormatter={(label) => new Date(label).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            />
            <Area
              type="monotone"
              dataKey="nav"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#navGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
          </AreaChart>
        ) : (
          <LineChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={formatNav}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
              }}
              labelStyle={{ color: "#6b7280", fontSize: "0.75rem", marginBottom: "0.25rem" }}
              itemStyle={{ color: "#111827", fontSize: "0.875rem", fontWeight: "600" }}
              formatter={(value: number) => [`₹${value.toFixed(4)}`, "NAV"]}
              labelFormatter={(label) => new Date(label).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            />
            <Line
              type="monotone"
              dataKey="nav"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
