// File: src/components/PivotChart.tsx
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PivotChartItem } from "@/lib/pivotUtils";
import { BarChart3 } from "lucide-react";

interface PivotChartProps {
  data: PivotChartItem[];
  months: string[];
  isEmpty?: boolean;
}

const MONTH_PURPLE_PINK_COLORS: Record<string, string> = {
  Agustus: "#6A0DAD", // Dark Purple
  September: "#A569BD", // Medium Purple
  Oktober: "#F2A7C6", // Pink Accent
};

const FALLBACK_COLORS = ["#6A0DAD", "#A569BD", "#F2A7C6", "#E082A8", "#4F46E5"];

export function PivotChart({ data, months, isEmpty = false }: PivotChartProps) {
  if (isEmpty || !data || data.length === 0) {
    return (
      <div className="w-full h-72 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-2">
        <BarChart3 className="w-10 h-10 text-slate-300 animate-pulse" />
        <p className="text-sm font-bold text-slate-600">Belum Ada Data Temuan untuk Pivot Chart</p>
        <p className="text-xs text-slate-400">
          Buat laporan audit baru atau sesuaikan filter kriteria untuk melihat visualisasi matriks pivot.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-bold text-[#6A0DAD] uppercase tracking-wider block">
            Visualisasi Matriks Pivot
          </span>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6A0DAD]" />
            Stacked Pivot Chart (Temuan Per Area & Bulan)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-[#6A0DAD] bg-[#F3EAF8] px-2.5 py-1 rounded-full border border-[#A569BD]/30">
          Stacked Bar Chart
        </span>
      </div>

      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="area"
              tick={{ fill: "#334155", fontSize: 12, fontWeight: 700 }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#A569BD",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(106, 13, 173, 0.1)",
                fontSize: "12px",
                fontWeight: "600",
              }}
              cursor={{ fill: "rgba(243, 234, 248, 0.5)" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "12px", fontSize: "12px", fontWeight: "600" }}
            />
            {months.map((month, idx) => {
              const color = MONTH_PURPLE_PINK_COLORS[month] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
              return (
                <Bar
                  key={month}
                  dataKey={month}
                  name={`Bulan ${month}`}
                  stackId="a"
                  fill={color}
                  radius={idx === months.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  barSize={40}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PivotChart;
