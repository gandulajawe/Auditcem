"use client";

import { useState } from "react";
import { Download, Filter, CheckCircle2, FileCheck, Calendar, Sparkles } from "lucide-react";
import { ChecklistItem } from "./ThreeMonthTimeline";
import { AuditReportItem } from "./AuditReportBuilder";
import { formatIndonesianDate, matchesMonthTimeline } from "@/lib/dateUtils";
import { generateAuditResumePDF } from "@/lib/pdfGenerator";

interface DownloadResumeSectionProps {
  checklists: ChecklistItem[];
  reports: AuditReportItem[];
}

export function DownloadResumeSection({ checklists, reports }: DownloadResumeSectionProps) {
  // Filter States (Dropdowns & Date Selector ONLY - NO DATA ENTRY)
  const [selectedTimeline, setSelectedTimeline] = useState<string>("All");
  const [selectedSpecificDate, setSelectedSpecificDate] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [selectedArea, setSelectedArea] = useState<string>("All");
  const [isDownloading, setIsDownloading] = useState(false);

  // Filter checklists
  const filteredChecklists = checklists.filter((item) => {
    // If specific date is selected, check if item.month matches month of specific date or selectedTimeline
    if (selectedSpecificDate) {
      const monthMap: Record<number, string> = {
        8: "Agustus",
        9: "September",
        10: "Oktober",
      };
      const parts = selectedSpecificDate.split("-");
      if (parts.length === 3) {
        const mNum = parseInt(parts[1], 10);
        const expectedMonth = monthMap[mNum];
        if (expectedMonth && item.month !== expectedMonth) return false;
      }
    } else if (selectedTimeline !== "All" && item.month !== selectedTimeline) {
      return false;
    }

    // Domain filter
    if (selectedDomain !== "All" && item.domain !== selectedDomain) return false;
    // Area filter
    if (selectedArea !== "All" && item.area !== selectedArea && item.area !== "All") return false;
    return true;
  });

  // Filter audit reports
  const filteredReports = reports.filter((report) => {
    // Specific Date filter takes priority if filled
    if (selectedSpecificDate) {
      const repDateClean = report.auditDate ? report.auditDate.split("T")[0] : "";
      if (repDateClean !== selectedSpecificDate) return false;
    } else if (selectedTimeline !== "All" && !matchesMonthTimeline(report.auditDate, selectedTimeline)) {
      return false;
    }

    // Domain filter
    if (selectedDomain !== "All" && report.domain !== selectedDomain) return false;
    // Area filter
    if (selectedArea !== "All" && report.area !== selectedArea) return false;
    return true;
  });

  const completedChecklistsCount = filteredChecklists.filter((c) => c.completed).length;
  const checklistPercent = filteredChecklists.length > 0 ? Math.round((completedChecklistsCount / filteredChecklists.length) * 100) : 0;

  function handleDownloadPDF() {
    setIsDownloading(true);

    try {
      const doc = generateAuditResumePDF({
        timelineFilter: selectedTimeline,
        specificDateFilter: selectedSpecificDate,
        domainFilter: selectedDomain,
        areaFilter: selectedArea,
        checklists: filteredChecklists,
        reports: filteredReports,
      });

      // Filename construction
      const cleanDomain = selectedDomain.replace(/[^a-zA-Z0-9]/g, "");
      const cleanArea = selectedArea.replace(/[^a-zA-Z0-9]/g, "");

      let filename = "";
      if (selectedSpecificDate) {
        filename = `Audit-Resume-${selectedSpecificDate}-${cleanDomain}-${cleanArea}.pdf`;
      } else {
        const cleanTimeline = selectedTimeline.replace(/[^a-zA-Z0-9]/g, "");
        filename = `Audit-Resume-${cleanTimeline}-${cleanDomain}-${cleanArea}.pdf`;
      }

      doc.save(filename);
    } catch (err) {
      console.error("Failed to generate PDF resume:", err);
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
            Fitur Ekspor PDF Otomatis
          </span>
          <h2 className="text-2xl font-black text-[#6A0DAD] flex items-center gap-2">
            <Download className="w-6 h-6 text-[#A569BD]" />
            Download Resume Audit (.pdf)
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Pilih kriteria filter di bawah. Sistem otomatis merangkum data checklist dan laporan audit murni dari database dalam format PDF resmi tanpa perlu memasukkan data ulang.
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] hover:from-[#580B90] hover:to-[#9455AC] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#6A0DAD]/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[#F7C6D9]" />
          <span>{isDownloading ? "Menyiapkan PDF..." : "Download Resume PDF (.pdf)"}</span>
        </button>
      </div>

      {/* FILTER DROPDOWNS & DATE SELECTOR ONLY - NO FORM INPUT */}
      <div className="bg-[#FAF7FB] p-5 rounded-2xl border border-[#F2A7C6]/50 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6A0DAD]">
          <Filter className="w-4 h-4 text-[#A569BD]" />
          <span>PILIH FILTER RINGKASAN DATA DATABASE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dropdown 1: Timeline Executions (Month) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              1. Timeline (Bulan)
            </label>
            <select
              value={selectedTimeline}
              onChange={(e) => {
                setSelectedTimeline(e.target.value);
                // Clear specific date if timeline changes
                setSelectedSpecificDate("");
              }}
              className="w-full p-2.5 bg-white border border-gray-200 focus:border-[#6A0DAD] rounded-xl text-xs font-bold outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All (Agustus - Oktober)</option>
              <option value="Agustus">Agustus (Bulan 4)</option>
              <option value="September">September (Bulan 5)</option>
              <option value="Oktober">Oktober (Bulan 6)</option>
            </select>
          </div>

          {/* Filter 2: Specific Date Selector (Harian) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block flex items-center justify-between">
              <span>2. Tanggal Spesifik (Harian)</span>
              {selectedSpecificDate && (
                <button
                  type="button"
                  onClick={() => setSelectedSpecificDate("")}
                  className="text-[10px] text-[#6A0DAD] font-extrabold hover:underline"
                >
                  Reset Tanggal
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedSpecificDate}
                onChange={(e) => setSelectedSpecificDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 focus:border-[#6A0DAD] rounded-xl text-xs font-bold outline-none cursor-pointer shadow-xs"
              />
            </div>
            {selectedSpecificDate ? (
              <span className="text-[10px] text-[#6A0DAD] font-extrabold block">
                ✓ Filter Aktif: {formatIndonesianDate(selectedSpecificDate)}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium block">
                Default: Semua tanggal di {selectedTimeline === "All" ? "Semua Bulan" : selectedTimeline}
              </span>
            )}
          </div>

          {/* Dropdown 3: Domain Audit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              3. Domain Audit
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

          {/* Dropdown 4: Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">
              4. Area Audit
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
            Target PDF: {selectedSpecificDate ? `Audit-Resume-${selectedSpecificDate}-${selectedDomain.replace(/[^a-zA-Z0-9]/g, "")}-${selectedArea.replace(/[^a-zA-Z0-9]/g, "")}.pdf` : `Audit-Resume-${selectedTimeline.replace(/[^a-zA-Z0-9]/g, "")}-${selectedDomain.replace(/[^a-zA-Z0-9]/g, "")}-${selectedArea.replace(/[^a-zA-Z0-9]/g, "")}.pdf`}
          </span>
        </div>
      </div>
    </section>
  );
}
