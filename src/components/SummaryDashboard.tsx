// File: src/components/SummaryDashboard.tsx
"use client";

import { LayoutDashboard, CheckSquare, FileCheck, ShieldCheck, PieChart, Scissors, Layers, Flame, Award, ArrowUpRight, Sparkles, Download } from "lucide-react";
import { AuditReportItem } from "./AuditReportBuilder";
import { ChecklistItem } from "./ThreeMonthTimeline";
import { DomainBadge } from "./DomainBadge";

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

  // Area Breakdown Stats
  const areaStats = {
    Cutting: reports.filter((r) => r.area === "Cutting").length,
    Prep: reports.filter((r) => r.area === "Prep").length,
    CSC: reports.filter((r) => r.area === "CSC").length,
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="bg-white rounded-3xl p-6 shadow-md border border-[#F7C6D9] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#A569BD] tracking-wider uppercase">
            Ringkasan Eksekutif
          </span>
          <h2 className="text-2xl font-black text-[#6A0DAD] flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[#A569BD]" />
            Dashboard Ringkasan Audit
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#6A0DAD] bg-[#F7C6D9]/40 px-3.5 py-1.5 rounded-full border border-[#F2A7C6]/60">
          <Award className="w-4 h-4 text-[#6A0DAD]" />
          <span>CEM Audit Metric Performance</span>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Checklist Progress */}
        <div className="bg-gradient-to-br from-[#6A0DAD] to-[#A569BD] text-white rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden">
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
        <div className="bg-white border-2 border-[#F7C6D9] rounded-2xl p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Laporan Audit
            </span>
            <div className="p-2 bg-[#F7C6D9] text-[#6A0DAD] rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900">{totalReports}</span>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Laporan terdaftar dengan 3-Column Analysis
            </p>
          </div>
        </div>

        {/* Card 3: Top Domain with Most Findings */}
        <div className="bg-white border-2 border-[#F7C6D9] rounded-2xl p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Domain Paling Sering Temuan
            </span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <DomainBadge domain={topDomain} size="md" />
            </div>
            <p className="text-xs text-gray-500 font-medium mt-2">
              <strong>{topDomainCount} temuan</strong> tercatat pada domain ini.
            </p>
          </div>
        </div>

        {/* Card 4: Open vs Resolved Status Ratio */}
        <div className="bg-white border-2 border-[#F7C6D9] rounded-2xl p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Status Perbaikan (Fix Ratio)
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{resolvedReports} Selesai</span>
              <span className="text-xs text-rose-500 font-bold">{openReports} Open</span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {inProgressReports} laporan dalam proses tindakan.
            </p>
          </div>
        </div>
      </div>

      {/* Area Breakdown Cards */}
      <div className="bg-[#FAF7FB] rounded-2xl p-5 border border-[#F2A7C6]/40 space-y-3">
        <h3 className="text-xs font-bold text-[#6A0DAD] uppercase tracking-wider">
          Distribusi Temuan Per Area Pabrik Sepatu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#6A0DAD] text-white rounded-xl">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Cutting Area</h4>
                <p className="text-[11px] text-gray-500 font-medium">Upper Cutting & Die Stamping</p>
              </div>
            </div>
            <span className="text-xl font-black text-[#6A0DAD]">{areaStats.Cutting}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#A569BD] text-white rounded-xl">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Prep Area</h4>
                <p className="text-[11px] text-gray-500 font-medium">Skiving, Slating & Stitching</p>
              </div>
            </div>
            <span className="text-xl font-black text-[#A569BD]">{areaStats.Prep}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#E082A8] text-white rounded-xl">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">CSC Area</h4>
                <p className="text-[11px] text-gray-500 font-medium">Cold Cement Sole & Assembly</p>
              </div>
            </div>
            <span className="text-xl font-black text-[#E082A8]">{areaStats.CSC}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-gray-600">Pintas Navigasi Cepat (Quick Actions):</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => scrollToSection("timeline-section")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7C6D9]/40 hover:bg-[#F7C6D9]/70 text-[#6A0DAD] text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lihat Timeline Executions</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => scrollToSection("download-resume-section")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6A0DAD]/10 hover:bg-[#6A0DAD]/20 text-[#6A0DAD] text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Resume PDF</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => scrollToSection("report-builder-section")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-90"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Buat Laporan Baru</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default SummaryDashboard;
