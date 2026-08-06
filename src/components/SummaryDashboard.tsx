// File: src/components/SummaryDashboard.tsx
"use client";

import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FileCheck,
  ShieldCheck,
  PieChart,
  Award,
  ArrowUpRight,
  Sparkles,
  Download,
} from "lucide-react";
import { AuditReportItem } from "./AuditReportBuilder";
import { ChecklistItem } from "./ThreeMonthTimeline";
import { DomainBadge } from "./DomainBadge";
import { generatePivotData, DEFAULT_MONTHS } from "@/lib/pivotUtils";
import { PivotTable } from "./PivotTable";
import { PivotChart } from "./PivotChart";

interface SummaryDashboardProps {
  checklists: ChecklistItem[];
  reports: AuditReportItem[];
}

export function SummaryDashboard({ checklists, reports }: SummaryDashboardProps) {
  // Checklist Stats
  const totalChecklists = checklists.length;
  const completedChecklists = checklists.filter((c) => c.completed).length;
  const checklistPercentage = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  // Report Stats
  const totalReports = reports.length;
  const openReports = reports.filter((r) => r.status === "Open").length;
  const inProgressReports = reports.filter((r) => r.status === "In Progress").length;
  const resolvedReports = reports.filter((r) => r.status === "Resolved").length;

  // Domain with most findings calculation
  const domainCounts: Record<string, number> = {};
  reports.forEach((r) => {
    domainCounts[r.domain] = (domainCounts[r.domain] || 0) + 1;
  });

  let topDomain = "N/A";
  let topDomainCount = 0;
  Object.entries(domainCounts).forEach(([domain, count]) => {
    if (count > topDomainCount) {
      topDomain = domain;
      topDomainCount = count;
    }
  });

  // Transform raw findings into Pivot Matrix (Rows, Totals, Chart Data)
  const pivotMatrix = generatePivotData(reports, DEFAULT_MONTHS);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="dashboard-pdf-content" className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold text-[#6A0DAD] tracking-wider uppercase block">
            Executive Analytics & Pivot Matrix
          </span>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[#6A0DAD]" />
            Dashboard Analitik & Matriks Pivot Audit
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#6A0DAD] bg-[#F3EAF8] px-3.5 py-1.5 rounded-full border border-[#A569BD]/30">
          <Award className="w-4 h-4 text-[#6A0DAD]" />
          <span>CEM Audit Metric Performance</span>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Checklist Progress */}
        <div className="bg-gradient-to-br from-[#6A0DAD] to-[#A569BD] text-white rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">
              Total Checklist Selesai
            </span>
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{completedChecklists}</span>
              <span className="text-xs text-purple-200 font-semibold">/ {totalChecklists} Total</span>
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${checklistPercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-purple-100 font-bold block mt-1">
              Progres: {checklistPercentage}% Terpenuhi
            </span>
          </div>
        </div>

        {/* Card 2: Total Audit Reports */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Laporan Audit
            </span>
            <div className="p-2 bg-[#F3EAF8] text-[#6A0DAD] rounded-xl border border-[#A569BD]/20">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalReports}</span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Laporan terdaftar dengan 3 Pilar CAPA Analysis
            </p>
          </div>
        </div>

        {/* Card 3: Top Domain with Most Findings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Domain Paling Sering Temuan
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <DomainBadge domain={topDomain} size="md" />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">
              <strong>{topDomainCount} temuan</strong> tercatat pada domain ini.
            </p>
          </div>
        </div>

        {/* Card 4: Open vs Resolved Status Ratio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Perbaikan (Fix Ratio)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{resolvedReports} Selesai</span>
              <span className="text-xs text-rose-500 font-bold">{openReports} Open</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {inProgressReports} laporan dalam proses tindakan.
            </p>
          </div>
        </div>
      </div>

      {/* PIVOT MATRIX SECTION (PIVOT TABLE & PIVOT STACKED CHART) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* PIVOT TABLE */}
        <PivotTable
          rows={pivotMatrix.rows}
          totals={pivotMatrix.totals}
          months={pivotMatrix.months}
          isEmpty={pivotMatrix.isEmpty}
        />

        {/* PIVOT STACKED BAR CHART */}
        <PivotChart
          data={pivotMatrix.chartData}
          months={pivotMatrix.months}
          isEmpty={pivotMatrix.isEmpty}
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-600">Pintas Navigasi Cepat (Quick Actions):</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => scrollToSection("timeline-section")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EAF8] hover:bg-[#A569BD]/20 text-[#6A0DAD] text-xs font-bold rounded-xl transition-all cursor-pointer border border-[#A569BD]/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6A0DAD]" />
            <span>Lihat Timeline Executions</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => scrollToSection("download-resume-section")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EAF8] hover:bg-[#A569BD]/20 text-[#6A0DAD] text-xs font-bold rounded-xl transition-all cursor-pointer border border-[#A569BD]/30"
          >
            <Download className="w-3.5 h-3.5 text-[#6A0DAD]" />
            <span>Download Resume PDF</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => scrollToSection("report-builder-section")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer hover:opacity-90"
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-200" />
            <span>Buat Laporan Baru</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default SummaryDashboard;
