// File: src/components/PivotTable.tsx
"use client";

import React from "react";
import { PivotRow, PivotTotals } from "@/lib/pivotUtils";
import { Table, CheckCircle2, AlertCircle, Scissors, Layers, Flame } from "lucide-react";

interface PivotTableProps {
  rows: PivotRow[];
  totals: PivotTotals;
  months: string[];
  isEmpty?: boolean;
}

export function PivotTable({ rows, totals, months, isEmpty = false }: PivotTableProps) {
  const getAreaIcon = (key: string) => {
    if (key === "Cutting") return <Scissors className="w-4 h-4 text-[#6A0DAD] shrink-0" />;
    if (key === "Prep") return <Layers className="w-4 h-4 text-[#A569BD] shrink-0" />;
    return <Flame className="w-4 h-4 text-[#E082A8] shrink-0" />;
  };

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-bold text-[#6A0DAD] uppercase tracking-wider block">
            Tabel Matriks Pivot
          </span>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Table className="w-5 h-5 text-[#6A0DAD]" />
            Matriks Temuan Audit Per Area & Bulan (Pivot Table)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-[#6A0DAD] bg-[#F3EAF8] px-2.5 py-1 rounded-full border border-[#A569BD]/30">
          Pivot Matrix
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
              <th className="p-3.5 pl-4">Area Pabrik (Rows)</th>
              {months.map((m) => (
                <th key={m} className="p-3.5 text-center">
                  {m}
                </th>
              ))}
              <th className="p-3.5 text-center bg-purple-100/90 text-purple-900 border-l border-purple-200">
                Total
              </th>
              <th className="p-3.5 text-center bg-emerald-100/90 text-emerald-900 border-l border-emerald-200">
                Fixed (Selesai)
              </th>
              <th className="p-3.5 text-center bg-rose-100/90 text-rose-900 border-l border-rose-200">
                Open (Proses/Buka)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {isEmpty ? (
              <tr>
                <td colSpan={months.length + 4} className="p-6 text-center text-slate-400">
                  Tidak ada data temuan audit untuk ditampilkan di Pivot Table.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.areaKey} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 pl-4 font-bold flex items-center gap-2 text-slate-900">
                    {getAreaIcon(row.areaKey)}
                    <span>{row.areaLabel}</span>
                  </td>
                  {months.map((m) => (
                    <td key={m} className="p-3.5 text-center text-slate-600 font-semibold">
                      {row.months[m] || 0}
                    </td>
                  ))}
                  <td className="p-3.5 text-center font-black text-[#6A0DAD] bg-purple-50/60 border-l border-purple-100">
                    {row.totalFindings}
                  </td>
                  <td className="p-3.5 text-center border-l border-emerald-100 bg-emerald-50/30">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {row.fixed}
                    </span>
                  </td>
                  <td className="p-3.5 text-center border-l border-rose-100 bg-rose-50/30">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[11px]">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      {row.open}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-900">
              <td className="p-3.5 pl-4 uppercase tracking-wider">TOTAL KESELURUHAN</td>
              {months.map((m) => (
                <td key={m} className="p-3.5 text-center">
                  {totals.months[m] || 0}
                </td>
              ))}
              <td className="p-3.5 text-center text-[#F2A7C6] bg-purple-950/80 border-l border-slate-700 font-black">
                {totals.totalFindings}
              </td>
              <td className="p-3.5 text-center text-emerald-300 border-l border-slate-700">
                {totals.fixed}
              </td>
              <td className="p-3.5 text-center text-rose-300 border-l border-slate-700">
                {totals.open}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default PivotTable;
