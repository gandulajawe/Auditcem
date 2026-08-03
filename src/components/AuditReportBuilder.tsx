"use client";

import { useState } from "react";
import { FileText, Plus, Search, AlertTriangle, CheckCircle, Clock, Trash2, ChevronDown, ChevronUp, UserCheck, Calendar, Sparkles, Download, CheckCircle2 } from "lucide-react";
import { DomainBadge } from "./DomainBadge";
import { AreaType } from "./AuditAreaScope";
import { formatIndonesianDate } from "@/lib/dateUtils";
import { generateSingleReportPDF } from "@/lib/pdfGenerator";

export interface AuditReportItem {
  id: number;
  title: string;
  area: string; // 'Cutting', 'Prep', 'CSC'
  domain: string; // 'MQAA', '6S', 'Visual Management', 'HSE', 'PS'
  findingDescription: string;
  rootCause: string; // Required column 1
  actionPlan: string; // Required column 2
  lessonLearned: string; // Required column 3
  auditorName: string;
  severity: string; // 'Low', 'Medium', 'High', 'Critical'
  status: string; // 'Open', 'In Progress', 'Resolved'
  auditDate: string; // YYYY-MM-DD
  createdAt?: string;
}

interface AuditReportBuilderProps {
  reports: AuditReportItem[];
  selectedAreaFilter: AreaType;
  onAddReport: (reportData: Omit<AuditReportItem, "id">) => Promise<AuditReportItem | void>;
  onUpdateReportStatus: (id: number, newStatus: string) => Promise<void>;
  onDeleteReport: (id: number) => Promise<void>;
}

export function AuditReportBuilder({
  reports,
  selectedAreaFilter,
  onAddReport,
  onUpdateReportStatus,
  onDeleteReport,
}: AuditReportBuilderProps) {
  const [showFormModal, setShowAddModal] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State for single report PDF download
  const [savedReportSuccess, setSavedReportSuccess] = useState<AuditReportItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    area: "Cutting",
    domain: "MQAA",
    findingDescription: "",
    rootCause: "",
    actionPlan: "",
    lessonLearned: "",
    auditorName: "Expert Auditor CEM",
    severity: "Medium",
    status: "Open",
    auditDate: new Date().toISOString().split("T")[0],
  });

  const [formError, setFormError] = useState("");

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    // Area filter
    if (selectedAreaFilter !== "All" && r.area !== selectedAreaFilter) return false;
    // Domain filter
    if (selectedDomainFilter !== "All" && r.domain !== selectedDomainFilter) return false;
    // Status filter
    if (selectedStatusFilter !== "All" && r.status !== selectedStatusFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.title.toLowerCase().includes(q) ||
        r.findingDescription.toLowerCase().includes(q) ||
        r.rootCause.toLowerCase().includes(q) ||
        r.actionPlan.toLowerCase().includes(q) ||
        r.lessonLearned.toLowerCase().includes(q) ||
        r.auditorName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim() || !formData.findingDescription.trim()) {
      setFormError("Judul dan Deskripsi Temuan wajib diisi.");
      return;
    }

    if (!formData.rootCause.trim() || !formData.actionPlan.trim() || !formData.lessonLearned.trim()) {
      setFormError("3 Kolom Wajib Analysis (Root Cause, Action Plan, & Lesson Learned) harus diisi dengan lengkap.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdReport = await onAddReport({ ...formData });
      setShowAddModal(false);

      // If created report returned, show success modal with PDF download option
      if (createdReport) {
        setSavedReportSuccess(createdReport);
      } else {
        // Fallback construct mock object for PDF download
        setSavedReportSuccess({
          id: Date.now(),
          ...formData,
        });
      }

      // Reset form
      setFormData({
        title: "",
        area: "Cutting",
        domain: "MQAA",
        findingDescription: "",
        rootCause: "",
        actionPlan: "",
        lessonLearned: "",
        auditorName: "Expert Auditor CEM",
        severity: "Medium",
        status: "Open",
        auditDate: new Date().toISOString().split("T")[0],
      });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan laporan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDownloadSinglePDF(report: AuditReportItem) {
    try {
      const doc = generateSingleReportPDF(report);
      const cleanTitle = report.title.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
      const filename = `Laporan-Audit-${cleanTitle}-${report.auditDate}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("Failed to generate single report PDF:", err);
    }
  }

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case "Critical":
        return "bg-rose-600 text-white font-black";
      case "High":
        return "bg-amber-500 text-white font-bold";
      case "Medium":
        return "bg-purple-500 text-white font-semibold";
      default:
        return "bg-blue-500 text-white font-medium";
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "Resolved":
        return { label: "Selesai", bg: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle };
      case "In Progress":
        return { label: "Dalam Perbaikan", bg: "bg-amber-100 text-amber-800 border-amber-300", icon: Clock };
      default:
        return { label: "Terbuka (Open)", bg: "bg-rose-100 text-rose-800 border-rose-300", icon: AlertTriangle };
    }
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-md border border-[#F7C6D9] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#A569BD] tracking-wider uppercase">
            Penyusun Laporan Live Audit
          </span>
          <h2 className="text-2xl font-black text-[#6A0DAD] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#A569BD]" />
            Audit Report Builder
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Laporan audit wajib menyertakan analisis 3 kolom utama: <strong>Root Cause</strong>, <strong>Action Plan</strong>, dan <strong>Lesson Learned</strong>.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] hover:from-[#580B90] hover:to-[#9455AC] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#6A0DAD]/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Laporan Audit Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FAF7FB] p-4 rounded-2xl border border-[#F2A7C6]/40 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci temuan, root cause, auditor..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD]"
            />
          </div>

          {/* Domain Filter */}
          <div>
            <select
              value={selectedDomainFilter}
              onChange={(e) => setSelectedDomainFilter(e.target.value)}
              className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-[#6A0DAD]"
            >
              <option value="All">Semua Domain</option>
              <option value="MQAA">MQAA</option>
              <option value="6S">6S</option>
              <option value="Visual Management">Visual Management</option>
              <option value="HSE">HSE</option>
              <option value="PS">PS</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-[#6A0DAD]"
            >
              <option value="All">Semua Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-1 border-t border-gray-200/60">
          <span>Menampilkan <strong>{filteredReports.length}</strong> dari {reports.length} laporan audit.</span>
          {selectedAreaFilter !== "All" && (
            <span className="text-[#6A0DAD] font-bold">Terfilter Area: {selectedAreaFilter}</span>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <p className="text-sm font-semibold text-gray-500">Tidak ada laporan audit yang cocok dengan filter.</p>
            <p className="text-xs text-gray-400">Cobalah mengubah filter area, domain, atau kata kunci pencarian.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedReportId === report.id;
            const statusInfo = getStatusBadge(report.status);
            const StatusIcon = statusInfo.icon;
            const indonesianDate = formatIndonesianDate(report.auditDate);

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-[#A569BD]/60 shadow-sm transition-all overflow-hidden space-y-0"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                  className="p-4 bg-white hover:bg-purple-50/30 cursor-pointer flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Area Tag */}
                      <span className="px-2.5 py-0.5 bg-[#F7C6D9] text-[#6A0DAD] font-black text-xs rounded-md shadow-xs">
                        AREA: {report.area}
                      </span>
                      <DomainBadge domain={report.domain} size="sm" />
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getSeverityBadge(report.severity)}`}>
                        {report.severity} Severity
                      </span>
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-base hover:text-[#6A0DAD] transition-colors leading-snug">
                      {report.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2 font-medium">
                      {report.findingDescription}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${statusInfo.bg}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusInfo.label}</span>
                      </span>

                      {/* Download Single Report PDF Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSinglePDF(report);
                        }}
                        className="px-2 py-1 bg-[#6A0DAD]/10 hover:bg-[#6A0DAD] text-[#6A0DAD] hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Download PDF Laporan Ini"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedReportId(isExpanded ? null : report.id);
                        }}
                        className="p-1 text-gray-400 hover:text-[#6A0DAD] transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Display Tanggal Audit in Indonesian format */}
                    <div className="flex items-center gap-2 text-[11px] text-gray-600 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      <span className="flex items-center gap-1 text-[#6A0DAD]">
                        <Calendar className="w-3.5 h-3.5 text-[#A569BD]" /> Tanggal Audit: {indonesianDate}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <UserCheck className="w-3.5 h-3.5 text-[#A569BD]" /> {report.auditorName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded 3 REQUIRED COLUMNS View */}
                {isExpanded && (
                  <div className="p-5 bg-[#FAF7FB] border-t border-gray-100 space-y-4 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-gray-200 gap-2">
                      <span className="text-xs font-bold text-[#6A0DAD] flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#A569BD]" /> Tanggal Audit On-Site: <strong>{indonesianDate}</strong>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-[#A569BD]" /> Auditor CEM: <strong>{report.auditorName}</strong>
                        </span>
                        <button
                          onClick={() => handleDownloadSinglePDF(report)}
                          className="px-3 py-1 bg-[#6A0DAD] hover:bg-[#580B90] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-[#F7C6D9]" />
                          <span>Download PDF Laporan Ini</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                        Deskripsi Temuan Audit
                      </span>
                      <p className="text-xs font-semibold text-gray-800 bg-white p-3 rounded-xl border border-gray-200">
                        {report.findingDescription}
                      </p>
                    </div>

                    {/* 3 Required Analysis Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Required Column 1: Root Cause */}
                      <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-purple-200 pb-1.5">
                          <span className="text-xs font-black text-[#6A0DAD] uppercase tracking-wider">
                            1. Root Cause Analysis
                          </span>
                          <span className="text-[10px] bg-[#6A0DAD] text-white px-2 py-0.5 rounded font-bold">Wajib</span>
                        </div>
                        <p className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                          {report.rootCause}
                        </p>
                      </div>

                      {/* Required Column 2: Action Plan */}
                      <div className="bg-pink-50/90 border border-pink-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-pink-200 pb-1.5">
                          <span className="text-xs font-black text-[#E082A8] uppercase tracking-wider">
                            2. Action Plan Remediasi
                          </span>
                          <span className="text-[10px] bg-[#E082A8] text-white px-2 py-0.5 rounded font-bold">Wajib</span>
                        </div>
                        <p className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                          {report.actionPlan}
                        </p>
                      </div>

                      {/* Required Column 3: Lesson Learned */}
                      <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-indigo-200 pb-1.5">
                          <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                            3. Key Lesson Learned
                          </span>
                          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">Wajib</span>
                        </div>
                        <p className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                          {report.lessonLearned}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">Ubah Status Laporan:</span>
                        <button
                          onClick={() => onUpdateReportStatus(report.id, "Open")}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                            report.status === "Open" ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-rose-100"
                          }`}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => onUpdateReportStatus(report.id, "In Progress")}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                            report.status === "In Progress" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-amber-100"
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => onUpdateReportStatus(report.id, "Resolved")}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                            report.status === "Resolved" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-emerald-100"
                          }`}
                        >
                          Resolved
                        </button>
                      </div>

                      <button
                        onClick={() => onDeleteReport(report.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Laporan Ini</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SUCCESS CONFIRMATION MODAL WITH PDF DOWNLOAD BUTTON */}
      {savedReportSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#F7C6D9] shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#6A0DAD]">
                Laporan Audit Berhasil Disimpan!
              </h3>
              <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
                Laporan &quot;<strong>{savedReportSuccess.title}</strong>&quot; telah tersimpan secara permanen di database.
              </p>
            </div>

            <div className="bg-[#FAF7FB] p-3 rounded-2xl border border-purple-100 text-xs text-left space-y-1">
              <p className="font-bold text-gray-800">Detail Ringkas Laporan:</p>
              <p className="text-gray-600">• Area: {savedReportSuccess.area} | Domain: {savedReportSuccess.domain}</p>
              <p className="text-gray-600">• Tanggal: {formatIndonesianDate(savedReportSuccess.auditDate)}</p>
              <p className="text-gray-600">• Auditor: {savedReportSuccess.auditorName}</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleDownloadSinglePDF(savedReportSuccess)}
                className="w-full py-3 bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] hover:from-[#580B90] text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#F7C6D9]" />
                <span>Download PDF Laporan Ini</span>
              </button>

              <button
                onClick={() => setSavedReportSuccess(null)}
                className="w-full py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Report Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 border border-[#F7C6D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <div>
                <h3 className="text-xl font-extrabold text-[#6A0DAD] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#A569BD]" />
                  Buat Laporan Audit Baru (Live On-Site Execution)
                </h3>
                <p className="text-xs text-gray-500">
                  Lengkapi 3 kolom wajib analisis akar masalah, rencana aksi, dan insight pembelajaran.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Area Audit (Wajib Tag)</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                  >
                    <option value="Cutting">Cutting Area</option>
                    <option value="Prep">Prep Area</option>
                    <option value="CSC">CSC Area</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Domain Audit</label>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                  >
                    <option value="MQAA">MQAA (Quality Assurance)</option>
                    <option value="6S">6S (Safety & Housekeeping)</option>
                    <option value="Visual Management">Visual Management</option>
                    <option value="HSE">HSE (Safety & Health)</option>
                    <option value="PS">PS (Process Standardization)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Tingkat Keparahan (Severity)</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Judul Temuan Audit</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Ketidaksesuaian Viskositas Lem Primer Line CSC..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Nama Auditor</label>
                    <input
                      type="text"
                      value={formData.auditorName}
                      onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Tanggal Audit</label>
                    <input
                      type="date"
                      value={formData.auditDate}
                      onChange={(e) => setFormData({ ...formData, auditDate: e.target.value })}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Deskripsi Temuan Lapangan</label>
                <textarea
                  value={formData.findingDescription}
                  onChange={(e) => setFormData({ ...formData, findingDescription: e.target.value })}
                  placeholder="Jelaskan fakta observasi, lokasi spesifik, instrumen atau komponen yang bermasalah..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD] h-20 resize-none"
                  required
                />
              </div>

              {/* 3 REQUIRED ANALYSIS COLUMNS */}
              <div className="p-4 bg-[#FAF7FB] border border-[#F2A7C6]/60 rounded-2xl space-y-3">
                <span className="text-xs font-extrabold text-[#6A0DAD] uppercase tracking-wider block">
                  3 KOLOM WAJIB ANALISIS AUDIT (REQUIRED AUDIT COLUMNS)
                </span>

                <div className="space-y-3">
                  {/* Column 1: Root Cause */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-900 flex items-center gap-1">
                      <span className="w-5 h-5 bg-[#6A0DAD] text-white rounded-full inline-flex items-center justify-center text-[10px]">1</span>
                      Akar Masalah (Root Cause Analysis) *
                    </label>
                    <textarea
                      value={formData.rootCause}
                      onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                      placeholder="Analisis mendalam mengapa masalah terjadi (man, machine, method, material)..."
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD] h-20 resize-none"
                      required
                    />
                  </div>

                  {/* Column 2: Action Plan */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-pink-900 flex items-center gap-1">
                      <span className="w-5 h-5 bg-[#E082A8] text-white rounded-full inline-flex items-center justify-center text-[10px]">2</span>
                      Rencana Tindakan Remediasi (Action Plan) *
                    </label>
                    <textarea
                      value={formData.actionPlan}
                      onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
                      placeholder="Langkah spesifik, PIC penanggung jawab, dan tenggat perbaikan..."
                      className="w-full p-2.5 bg-white border border-pink-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD] h-20 resize-none"
                      required
                    />
                  </div>

                  {/* Column 3: Lesson Learned */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                      <span className="w-5 h-5 bg-indigo-600 text-white rounded-full inline-flex items-center justify-center text-[10px]">3</span>
                      Pembelajaran Utama (Lesson Learned) *
                    </label>
                    <textarea
                      value={formData.lessonLearned}
                      onChange={(e) => setFormData({ ...formData, lessonLearned: e.target.value })}
                      placeholder="Insight kunci agar masalah serupa tidak terulang di line/area lain..."
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD] h-20 resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] hover:from-[#580B90] rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan Laporan..." : "Simpan Laporan Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
