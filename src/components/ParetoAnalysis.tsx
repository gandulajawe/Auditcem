// File: src/components/ParetoAnalysis.tsx
"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { AuditReportItem } from "./AuditReportBuilder";
import { computeParetoAnalysis } from "@/lib/paretoUtils";

interface ParetoAnalysisProps {
  reports: AuditReportItem[];
  accentColor?: string; // warna aksen mengikuti tema domain, default indigo
}

export function ParetoAnalysis({ reports, accentColor = "#4F46E5" }: ParetoAnalysisProps) {
  const { bars, totalFindings, uncategorizedCount, vitalFewCategories, vitalFewShare } =
    computeParetoAnalysis(reports);

  if (totalFindings === 0) {
    return (
      <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-1">
        <p className="text-xs font-bold text-slate-500">
          Belum ada temuan berkategori pada domain ini untuk dianalisis Pareto.
        </p>
        {uncategorizedCount > 0 && (
          <p className="text-[11px] text-slate-400">
            {uncategorizedCount} laporan belum diberi Kategori Masalah — isi kolom kategori saat membuat/mengedit laporan agar masuk hitungan.
          </p>
        )}
      </div>
    );
  }

  const chartData = bars.map((b) => ({
    category: b.category,
    Jumlah: b.count,
    Kumulatif: Math.round(b.cumulativePercent),
  }));

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: accentColor }}>
            Analisis Pareto 80/20
          </span>
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
            Isu Paling Krusial Berdasarkan Kategori Masalah
          </h3>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
          style={{ color: accentColor, backgroundColor: `${accentColor}14`, borderColor: `${accentColor}40` }}
        >
          {totalFindings} Temuan Dianalisis
        </span>
      </div>

      {/* Ringkasan Vital Few */}
      <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/70 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          <strong>{vitalFewCategories.length} dari {bars.length} kategori</strong> menyumbang{" "}
          <strong>{Math.round(vitalFewShare)}%</strong> dari total temuan domain ini:{" "}
          {vitalFewCategories.join(", ")}.
        </p>
      </div>

      <div className="w-full h-72 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: "#334155", fontSize: 10, fontWeight: 600 }}
              axisLine={{ stroke: "#cbd5e1" }}
              tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={70}
            />
            <YAxis
              yAxisId="left"
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Jumlah Temuan", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Kumulatif %", angle: 90, position: "insideRight", fill: "#94a3b8", fontSize: 10 }}
            />
            <ReferenceLine yAxisId="right" y={80} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1.5} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(value, name) => (name === "Kumulatif" ? [`${value}%`, "Kumulatif"] : [`${value}`, "Jumlah"])}
            />
            <Bar yAxisId="left" dataKey="Jumlah" fill={accentColor} radius={[6, 6, 0, 0]} maxBarSize={48} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Kumulatif"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 3, fill: "#dc2626" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-slate-400 text-center">
        Garis merah putus-putus menandai ambang 80%. Batang di sebelah kiri garis tersebut adalah kategori &quot;vital few&quot; — prioritas utama tindak lanjut.
      </p>
    </div>
  );
}
