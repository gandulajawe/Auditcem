"use client";

import { useState } from "react";
import { Download, FileText, Filter, CheckCircle2, AlertCircle, FileCheck, Sparkles } from "lucide-react";
import { ChecklistItem } from "./ThreeMonthTimeline";
import { AuditReportItem } from "./AuditReportBuilder";
import { formatIndonesianDate, matchesMonthTimeline } from "@/lib/dateUtils";

interface DownloadResumeSectionProps {
  checklists: ChecklistItem[];
  reports: AuditReportItem[];
}

export function DownloadResumeSection({ checklists, reports }: DownloadResumeSectionProps) {
  // Filter States (Dropdowns ONLY - NO FORM INPUT)
  const [selectedTimeline, setSelectedTimeline] = useState<string>("All");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [selectedArea, setSelectedArea] = useState<string>("All");
  const [isDownloading, setIsDownloading] = useState(false);

  // Filter checklists
  const filteredChecklists = checklists.filter((item) => {
    // Timeline filter
    if (selectedTimeline !== "All" && item.month !== selectedTimeline) return false;
    // Domain filter
    if (selectedDomain !== "All" && item.domain !== selectedDomain) return false;
    // Area filter
    if (selectedArea !== "All" && item.area !== selectedArea && item.area !== "All") return false;
    return true;
  });

  // Filter audit reports
  const filteredReports = reports.filter((report) => {
    // Timeline filter (by auditDate month)
    if (selectedTimeline !== "All" && !matchesMonthTimeline(report.auditDate, selectedTimeline)) return false;
    // Domain filter
    if (selectedDomain !== "All" && report.domain !== selectedDomain) return false;
    // Area filter
    if (selectedArea !== "All" && report.area !== selectedArea) return false;
    return true;
  });

  const completedChecklistsCount = filteredChecklists.filter((c) => c.completed).length;
  const checklistPercent = filteredChecklists.length > 0 ? Math.round((completedChecklistsCount / filteredChecklists.length) * 100) : 0;

  function handleDownloadResume() {
    setIsDownloading(true);

    try {
      const todayStr = formatIndonesianDate(new Date().toISOString().split("T")[0]);
      
      let txt = `================================================================================\n`;
      txt += `                     THE AUDIT CRUCIBLE — RESUME AUDIT LAPANGAN\n`;
      txt += `                    CERTIFIED ENGINEERING MANAGER (CEM) PROGRAM\n`;
      txt += `================================================================================\n\n`;
      txt += `INFORMASI RESUME:\n`;
      txt += `  • Tanggal Resume Dibuat : ${todayStr}\n`;
      txt += `  • Filter Timeline       : ${selectedTimeline === "All" ? "Semua Bulan (Agustus - Oktober)" : selectedTimeline}\n`;
      txt += `  • Filter Domain Audit   : ${selectedDomain === "All" ? "Semua Domain (MQAA, 6S, VM, HSE, PS)" : selectedDomain}\n`;
      txt += `  • Filter Area Audit     : ${selectedArea === "All" ? "Semua Area (Cutting, Prep, CSC)" : selectedArea}\n`;
      txt += `--------------------------------------------------------------------------------\n\n`;

      // PART 1: CHECKLISTS SUMMARY
      txt += `[1] RINGKASAN CHECKLIST AUDIT (TOTAL: ${filteredChecklists.length} Item | ${completedChecklistsCount} Selesai - ${checklistPercent}%)\n`;
      txt += `--------------------------------------------------------------------------------\n`;

      if (filteredChecklists.length === 0) {
        txt += `Tidak ada item checklist yang cocok dengan filter aktif.\n\n`;
      } else {
        filteredChecklists.forEach((c, idx) => {
          const statusStr = c.completed ? "[✓ SELESAI]" : "[  BELUM  ]";
          txt += `${idx + 1}. ${statusStr} ${c.title}\n`;
          txt += `   - Bulan Target : ${c.month}\n`;
          txt += `   - Domain       : ${c.domain}\n`;
          txt += `   - Target Area  : ${c.area || "All"}\n`;
          if (c.description) {
            txt += `   - Deskripsi    : ${c.description}\n`;
          }
          txt += `\n`;
        });
      }

      txt += `--------------------------------------------------------------------------------\n\n`;

      // PART 2: AUDIT REPORTS LIST
      txt += `[2] DAFTAR LAPORAN AUDIT LENGKAP (TOTAL: ${filteredReports.length} Laporan)\n`;
      txt += `--------------------------------------------------------------------------------\n`;

      if (filteredReports.length === 0) {
        txt += `Tidak ada laporan audit yang cocok dengan filter aktif.\n\n`;
      } else {
        filteredReports.forEach((r, idx) => {
          const indonesianDate = formatIndonesianDate(r.auditDate);
          txt += `LAPORAN AUDIT #${idx + 1}: ${r.title.toUpperCase()}\n`;
          txt += `  • Tanggal Audit : ${indonesianDate}\n`;
          txt += `  • Area Audit    : ${r.area}\n`;
          txt += `  • Domain Audit  : ${r.domain}\n`;
          txt += `  • Severity      : ${r.severity}\n`;
          txt += `  • Status        : ${r.status}\n`;
          txt += `  • Auditor       : ${r.auditorName}\n\n`;

          txt += `  [DESKRIPSI TEMUAN AUDIT LAPANGAN]:\n`;
          txt += `  ${r.findingDescription.replace(/\n/g, "\n  ")}\n\n`;

          txt += `  [ANALISIS 3 KOLOM WAJIB]:\n`;
          txt += `  1. ROOT CAUSE ANALYSIS (AKAR MASALAH):\n`;
          txt += `     ${r.rootCause.replace(/\n/g, "\n     ")}\n\n`;

          txt += `  2. ACTION PLAN REMEDIASI (RENCANA PERBAIKAN):\n`;
          txt += `     ${r.actionPlan.replace(/\n/g, "\n     ")}\n\n`;

          txt += `  3. KEY LESSON LEARNED (PEMBELAJARAN UTAMA):\n`;
          txt += `     ${r.lessonLearned.replace(/\n/g, "\n     ")}\n\n`;

          txt += `--------------------------------------------------------------------------------\n`;
        });
      }

      txt += `\n================================================================================\n`;
      txt += ` Akhir Laporan Resume Audit Crucible — Dihasilkan otomatis oleh Sistem Dashboard CEM\n`;
      txt += `================================================================================\n`;

      // Generate filename with active filters
      const cleanTimeline = selectedTimeline.replace(/[^a-zA-Z0-9]/g, "");
      const cleanDomain = selectedDomain.replace(/[^a-zA-Z0-9]/g, "");
      const cleanArea = selectedArea.replace(/[^a-zA-Z0-9]/g, "");

      const filename = `Audit-Resume-${cleanTimeline}-${cleanDomain}-${cleanArea}.txt`;

      // Trigger browser download
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate resume:", err);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-md border border-[#F7C6D9] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#A569BD] tracking-wider uppercase">
            Fitur Ekspor Otomatis
          </span>
          <h2 className="text-2xl font-black text-[#6A0DAD] flex items-center gap-2">
            <Download className="w-6 h-6 text-[#A569BD]" />
            Download Resume Audit (.txt)
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Pilih filter kriteria di bawah ini. Sistem secara otomatis akan merangkum seluruh checklist dan laporan audit yang tersimpan di database tanpa perlu menginput ulang data.
          </p>
        </div>

        <button
          onClick={handleDownloadResume}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] hover:from-[#580B90] hover:to-[#9455AC] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#6A0DAD]/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[#F7C6D9]" />
          <span>{isDownloading ? "Menyiapkan Resume..." : "Download Resume (.txt)"}</span>
        </button>
      </div>

      {/* FILTER DROPDOWNS ONLY - NO FORM INPUT */}
      <div className="bg-[#FAF7FB] p-5 rounded-2xl border border-[#F2A7C6]/50 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6A0DAD]">
          <Filter className="w-4 h-4 text-[#A569BD]" />
          <span>PILIH FILTER RINGKASAN DATA DATABASE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dropdown 1: Timeline Executions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              1. Timeline Executions
            </label>
            <select
              value={selectedTimeline}
              onChange={(e) => setSelectedTimeline(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 focus:border-[#6A0DAD] rounded-xl text-xs font-bold outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All (Agustus, September, Oktober)</option>
              <option value="Agustus">Agustus (Bulan 4)</option>
              <option value="September">September (Bulan 5)</option>
              <option value="Oktober">Oktober (Bulan 6)</option>
            </select>
          </div>

          {/* Dropdown 2: Domain Audit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              2. Domain Audit
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 focus:border-[#6A0DAD] rounded-xl text-xs font-bold outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All (Semua Domain)</option>
              <option value="MQAA">MQAA (Quality Assurance)</option>
              <option value="6S">6S (Housekeeping & Safety)</option>
              <option value="Visual Management">Visual Management</option>
              <option value="HSE">HSE (Health, Safety & Environment)</option>
              <option value="PS">PS (Process Standardization)</option>
            </select>
          </div>

          {/* Dropdown 3: Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              3. Area Audit
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 focus:border-[#6A0DAD] rounded-xl text-xs font-bold outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All (Cutting, Prep, CSC)</option>
              <option value="Cutting">Cutting Area</option>
              <option value="Prep">Prep Area</option>
              <option value="CSC">CSC Area</option>
            </select>
          </div>
        </div>

        {/* Live Filter Matched Record Count Badge */}
        <div className="pt-3 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-[#6A0DAD]" />
              Checklist Cocok: <strong className="text-[#6A0DAD]">{filteredChecklists.length} Item</strong> ({completedChecklistsCount} Selesai)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-700">
              <FileCheck className="w-4 h-4 text-[#A569BD]" />
              Laporan Audit Cocok: <strong className="text-[#A569BD]">{filteredReports.length} Laporan</strong>
            </span>
          </div>

          <span className="text-[11px] text-gray-400 font-bold">
            Target file: Audit-Resume-{selectedTimeline.replace(/[^a-zA-Z0-9]/g, "")}-{selectedDomain.replace(/[^a-zA-Z0-9]/g, "")}-{selectedArea.replace(/[^a-zA-Z0-9]/g, "")}.txt
          </span>
        </div>
      </div>
    </section>
  );
}
