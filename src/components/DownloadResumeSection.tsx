// File: src/components/DownloadResumeSection.tsx
"use client";

import { useState } from "react";
import { Download, Filter, CheckCircle2, FileCheck, Calendar, CalendarRange, Layers } from "lucide-react";
import { ChecklistItem } from "./ThreeMonthTimeline";
import { AuditReportItem } from "./AuditReportBuilder";
import { formatIndonesianDate, matchesMonthTimeline } from "@/lib/dateUtils";
import { generateAuditResumePDF } from "@/lib/pdfGenerator";

interface DownloadResumeSectionProps {
  checklists: ChecklistItem[];
  reports: AuditReportItem[];
}

type DateFilterMode = "all" | "range" | "month";

export function DownloadResumeSection({ checklists, reports }: DownloadResumeSectionProps) {
  // 3 Date Filter Modes: "all", "range", "month"
  const [dateMode, setDateMode] = useState<DateFilterMode>("all");
  
  // Custom Date Range States
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Month Dropdown State
  const [selectedMonth, setSelectedMonth] = useState<string>("Agustus");

  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [selectedArea, setSelectedArea] = useState<string>("All");
  const [isDownloading, setIsDownloading] = useState(false);

  // Filter checklists
  const filteredChecklists = checklists.filter((item) => {
    // Mode 2: Rentang Tanggal
    if (dateMode === "range") {
      if (item.auditDate) {
        if (startDate && item.auditDate < startDate) return false;
        if (endDate && item.auditDate > endDate) return false;
      } else if (startDate || endDate) {
        // Fallback for month matching if no item.auditDate
        if (startDate) {
          const mMap: Record<number, string> = { 8: "Agustus", 9: "September", 10: "Oktober" };
          const startMonthNum = parseInt(startDate.split("-")[1], 10);
          const startMonthName = mMap[startMonthNum];
          if (startMonthName && item.month !== startMonthName) return false;
        }
      }
    } else if (dateMode === "month") {
      // Mode 3: Per Bulan
      if (selectedMonth && item.month !== selectedMonth) {
        if (item.auditDate) {
          if (!matchesMonthTimeline(item.auditDate, selectedMonth)) return false;
        } else {
          return false;
        }
      }
    }

    // Domain filter
    if (selectedDomain !== "All" && item.domain !== selectedDomain) return false;
    // Area filter (Strictly Cutting, Prep, CSC)
    if (selectedArea !== "All" && item.area !== selectedArea && item.area !== "All") return false;
    return true;
  });

  // Filter audit reports
  const filteredReports = reports.filter((report) => {
    const repDateClean = report.auditDate ? report.auditDate.split("T")[0] : "";

    // Mode 2: Rentang Tanggal
    if (dateMode === "range") {
      if (startDate && repDateClean < startDate) return false;
      if (endDate && repDateClean > endDate) return false;
    } else if (dateMode === "month") {
      // Mode 3: Per Bulan
      if (selectedMonth && !matchesMonthTimeline(repDateClean, selectedMonth)) return false;
    }

    // Domain filter
    if (selectedDomain !== "All" && report.domain !== selectedDomain) return false;
    // Area filter (Strictly Cutting, Prep, CSC)
    if (selectedArea !== "All" && report.area !== selectedArea) return false;
    return true;
  });

  const completedChecklistsCount = filteredChecklists.filter((c) => c.completed).length;
  const checklistPercent = filteredChecklists.length > 0 ? Math.round((completedChecklistsCount / filteredChecklists.length) * 100) : 0;

  async function handleDownloadPDF() {
    setIsDownloading(true);

    try {
      let specificDateDisplay = "";
      if (dateMode === "range") {
        if (startDate && endDate) specificDateDisplay = `${startDate} s/d ${endDate}`;
        else if (startDate) specificDateDisplay = `Mulai ${startDate}`;
        else if (endDate) specificDateDisplay = `Hingga ${endDate}`;
      } else if (dateMode === "month") {
        specificDateDisplay = `Bulan ${selectedMonth}`;
      }

      const doc = await generateAuditResumePDF({
        timelineFilter: dateMode === "month" ? selectedMonth : "All",
        specificDateFilter: specificDateDisplay,
        domainFilter: selectedDomain,
        areaFilter: selectedArea,
        checklists: filteredChecklists,
        reports: filteredReports,
      });

      const cleanDomain = selectedDomain.replace(/[^a-zA-Z0-9]/g, "");
      const cleanArea = selectedArea.replace(/[^a-zA-Z0-9]/g, "");

      let filename = "";
      if (dateMode === "range" && (startDate || endDate)) {
        filename = `Audit-Resume-${startDate || "Start"}_${endDate || "End"}-${cleanDomain}-${cleanArea}.pdf`;
      } else if (dateMode === "month") {
        filename = `Audit-Resume-${selectedMonth}-${cleanDomain}-${cleanArea}.pdf`;
      } else {
        filename = `Audit-Resume-All-${cleanDomain}-${cleanArea}.pdf`;
      }

      doc.save(filename);
    } catch (err) {
      console.error("Failed to generate PDF resume:", err);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section id="download-resume-section" className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase block">
            Fitur Ekspor PDF Otomatis
          </span>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Download className="w-6 h-6 text-indigo-600" />
            Download Resume Audit (.pdf)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Pilih kriteria filter di bawah. Sistem otomatis merangkum data checklist dan laporan audit murni dari database dalam format PDF resmi. Laporan audit di dalam PDF kini dikelompokkan per domain (MQAA, 6S, VM, HSE, PS) — masing-masing dengan ringkasan isu krusial (Pareto 80/20) sendiri.
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-indigo-200" />
          <span>{isDownloading ? "Menyiapkan PDF..." : "Download Resume PDF (.pdf)"}</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 border-b border-slate-200/80 pb-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>PILIH FILTER RINGKASAN DATA DATABASE</span>
        </div>

        {/* 3 MODE TANGGAL SWITCHER (TABS / RADIO BUTTONS) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            1. Mode Filter Tanggal Audit
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDateMode("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                dateMode === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Semua Tanggal (Default)</span>
            </button>

            <button
              type="button"
              onClick={() => setDateMode("range")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                dateMode === "range"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Rentang Tanggal</span>
            </button>

            <button
              type="button"
              onClick={() => setDateMode("month")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                dateMode === "month"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Per Bulan</span>
            </button>
          </div>

          {/* MODE DYNAMIC CONTROLS */}
          {dateMode === "range" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white rounded-2xl border border-indigo-200 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Tanggal Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {dateMode === "month" && (
            <div className="p-3.5 bg-white rounded-2xl border border-indigo-200 animate-in fade-in duration-150 space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Pilih Bulan Audit</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 cursor-pointer"
              >
                <option value="Agustus">Agustus (Bulan 4)</option>
                <option value="September">September (Bulan 5)</option>
                <option value="Oktober">Oktober (Bulan 6)</option>
              </select>
            </div>
          )}
        </div>

        {/* DOMAIN & AREA FILTERS (AREA STRICTLY: Cutting, Prep, CSC) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Filter Domain Audit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              2. Domain Audit
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-2xs text-slate-800"
            >
              <option value="All">All (Semua Domain)</option>
              <option value="MQAA">MQAA (Quality Assurance)</option>
              <option value="6S">6S (Housekeeping & Safety)</option>
              <option value="Visual Management">Visual Management</option>
              <option value="HSE">HSE (Health, Safety & Environment)</option>
              <option value="PS">PS (Process Standardization)</option>
            </select>
          </div>

          {/* Filter Area Audit (STRICTLY 3 AREAS: Cutting, Prep, CSC) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              3. Area Audit (3 Area Utama)
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-2xs text-slate-800"
            >
              <option value="All">All (Cutting, Prep, CSC)</option>
              <option value="Cutting">Cutting Area</option>
              <option value="Prep">Prep Area</option>
              <option value="CSC">CSC Area</option>
            </select>
          </div>
        </div>

        {/* Live Filter Matched Record Count Badge */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Checklist Cocok: <strong className="text-indigo-700">{filteredChecklists.length} Item</strong> ({completedChecklistsCount} Selesai - {checklistPercent}%)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <FileCheck className="w-4 h-4 text-purple-600" />
              Laporan Audit Cocok: <strong className="text-purple-700">{filteredReports.length} Laporan</strong>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-bold">
            Target PDF: {dateMode === "range" && (startDate || endDate) ? `Audit-Resume-${startDate || "Start"}_${endDate || "End"}-${selectedDomain.replace(/[^a-zA-Z0-9]/g, "")}-${selectedArea.replace(/[^a-zA-Z0-9]/g, "")}.pdf` : dateMode === "month" ? `Audit-Resume-${selectedMonth}-${selectedDomain.replace(/[^a-zA-Z0-9]/g, "")}-${selectedArea.replace(/[^a-zA-Z0-9]/g, "")}.pdf` : `Audit-Resume-All-${selectedDomain.replace(/[^a-zA-Z0-9]/g, "")}-${selectedArea.replace(/[^a-zA-Z0-9]/g, "")}.pdf`}
          </span>
        </div>
      </div>
    </section>
  );
}

export default DownloadResumeSection;
