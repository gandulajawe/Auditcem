"use client";

import { useState } from "react";
import { Download, Filter, CheckCircle2, FileCheck } from "lucide-react";
import { ChecklistItem } from "./ThreeMonthTimeline";
import { AuditReportItem } from "./AuditReportBuilder";
import { formatIndonesianDate } from "@/lib/dateUtils";
import { generateAuditResumePDF } from "@/lib/pdfGenerator";

interface DownloadResumeSectionProps {
  checklists: ChecklistItem[];
  reports: AuditReportItem[];
}

export function DownloadResumeSection({ checklists, reports }: DownloadResumeSectionProps) {
  const [selectedSpecificDate, setSelectedSpecificDate] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [selectedArea, setSelectedArea] = useState<string>("All");
  const [isDownloading, setIsDownloading] = useState(false);

  // Filter checklists
  const filteredChecklists = checklists.filter((item) => {
    if (selectedSpecificDate) {
      if (item.auditDate) {
        if (item.auditDate !== selectedSpecificDate) return false;
      } else {
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
      }
    }

    if (selectedDomain !== "All" && item.domain !== selectedDomain) return false;
    if (selectedArea !== "All" && item.area !== selectedArea && item.area !== "All") return false;
    return true;
  });

  // Filter audit reports
  const filteredReports = reports.filter((report) => {
    if (selectedSpecificDate) {
      const repDateClean = report.auditDate ? report.auditDate.split("T")[0] : "";
      if (repDateClean !== selectedSpecificDate) return false;
    }

    if (selectedDomain !== "All" && report.domain !== selectedDomain) return false;
    if (selectedArea !== "All" && report.area !== selectedArea) return false;
    return true;
  });

  const completedChecklistsCount = filteredChecklists.filter((c) => c.completed).length;
  const checklistPercent = filteredChecklists.length > 0 ? Math.round((completedChecklistsCount / filteredChecklists.length) * 100) : 0;

  async function handleDownloadPDF() {
    setIsDownloading(true);

    try {
      const doc = await generateAuditResumePDF({
        timelineFilter: "All",
        specificDateFilter: selectedSpecificDate,
        domainFilter: selectedDomain,
        areaFilter: selectedArea,
        checklists: filteredChecklists,
        reports: filteredReports,
      });

      const cleanDomain = selectedDomain.replace(/[^a-zA-Z0-9]/g, "");
      const cleanArea = selectedArea.replace(/[^a-zA-Z0-9]/g, "");

      let filename = "";
      if (selectedSpecificDate) {
        filename = `Audit-Resume-${selectedSpecificDate}-${cleanDomain}-${cleanArea}.pdf`;
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
            Pilih kriteria filter di bawah. Sistem otomatis merangkum data checklist dan laporan audit murni dari database dalam format PDF resmi.
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

      {/* FILTER DROPDOWNS & DATE SELECTOR ONLY */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>PILIH FILTER RINGKASAN DATA DATABASE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Filter 1: Tanggal Spesifik (Harian) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
              <span>1. Tanggal Spesifik (Harian)</span>
              {selectedSpecificDate && (
                <button
                  type="button"
                  onClick={() => setSelectedSpecificDate("")}
                  className="text-[10px] text-indigo-600 font-extrabold hover:underline cursor-pointer"
                >
                  Reset Tanggal
                </button>
              )}
            </label>
            <input
              type="date"
              value={selectedSpecificDate}
              onChange={(e) => setSelectedSpecificDate(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-xs"
            />
            {selectedSpecificDate ? (
              <span className="text-[10px] text-indigo-600 font-extrabold block">
                ✓ Filter Aktif: {formatIndonesianDate(selectedSpecificDate)}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium block">
                Default: Semua Tanggal di Semua Bulan
              </span>
            )}
          </div>

          {/* Filter 2: Domain Audit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              2. Domain Audit
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-xs"
            >
              <option value="All">All (Semua Domain)</option>
              <option value="MQAA">MQAA (Quality Assurance)</option>
              <option value="6S">6S (Housekeeping & Safety)</option>
              <option value="Visual Management">Visual Management</option>
              <option value="HSE">HSE (Health, Safety & Environment)</option>
              <option value="PS">PS (Process Standardization)</option>
            </select>
          </div>

          {/* Filter 3: Area Audit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              3. Area Audit
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-xs"
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
            Target PDF: {selectedSpecificDate ? `Audit-Resume-${selectedSpecificDate}-${selectedDomain.replace(/[^a-zA-Z0-9]/g, "")}-${selectedArea.replace(/[^a-zA-Z0-9]/g, "")}.pdf` : `Audit-Resume-All-${selectedDomain.replace(/[^a-zA-Z0-9]/g, "")}-${selectedArea.replace(/[^a-zA-Z0-9]/g, "")}.pdf`}
          </span>
        </div>
      </div>
    </section>
  );
}

export default DownloadResumeSection;
