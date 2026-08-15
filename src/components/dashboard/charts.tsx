"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export function RevenueChart({
  data,
}: {
  data: { label: string; revenue: number }[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <p className="text-sm text-foreground-muted">Paid invoices over recent months</p>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" stroke="var(--foreground-subtle)" fontSize={12} />
            <YAxis stroke="var(--foreground-subtle)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
              formatter={(value) => [
                `$${Number(value ?? 0).toLocaleString()}`,
                "Revenue",
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--brand)"
              fill="url(#revenueFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ProjectStatusChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Project status</CardTitle>
        <p className="text-sm text-foreground-muted">Distribution across your portfolio</p>
      </CardHeader>
      <CardContent className="h-64">
        {data.every((d) => d.value === 0) || data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
            No project data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TaskCompletionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Task completion</CardTitle>
        <p className="text-sm text-foreground-muted">Completed vs pending work</p>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--foreground-subtle)" fontSize={12} />
            <YAxis allowDecimals={false} stroke="var(--foreground-subtle)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
