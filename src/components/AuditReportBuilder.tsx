"use client";

import { useState } from "react";
import { FileText, Plus, Search, AlertTriangle, CheckCircle, Clock, Trash2, ChevronDown, ChevronUp, UserCheck, Calendar, Sparkles, Download, CheckCircle2, Edit3, Image as ImageIcon, X, Eye, Target, GraduationCap, ShieldCheck } from "lucide-react";
import { DomainBadge } from "./DomainBadge";
import { AreaType } from "./AuditAreaScope";
import { formatIndonesianDate } from "@/lib/dateUtils";
import { generateSingleReportPDF } from "@/lib/pdfGenerator";

export interface ActionPlanRow {
  horizon: "Jangka Pendek" | "Jangka Panjang";
  category: "Corrective Action" | "Preventive Action";
  action: string;
  rationale: string;
  targetSla: string;
}

export interface AuditAnalysisResult {
  summary: string;
  actionPlanTable: ActionPlanRow[];
}

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
  photoUrls?: string[] | null;
  createdAt?: string;
}

interface AuditReportBuilderProps {
  reports: AuditReportItem[];
  selectedAreaFilter: AreaType;
  onAddReport: (reportData: Omit<AuditReportItem, "id">) => Promise<AuditReportItem | void>;
  onUpdateReport: (id: number, reportData: Partial<AuditReportItem>) => Promise<void>;
  onUpdateReportStatus: (id: number, newStatus: string) => Promise<void>;
  onDeleteReport: (id: number) => Promise<void>;
}

export function AuditReportBuilder({
  reports,
  selectedAreaFilter,
  onAddReport,
  onUpdateReport,
  onUpdateReportStatus,
  onDeleteReport,
}: AuditReportBuilderProps) {
  const [showFormModal, setShowAddModal] = useState(false);
  const [editingReport, setEditingReport] = useState<AuditReportItem | null>(null);
  
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
    photoUrls: [] as string[],
  });

  const [formError, setFormError] = useState("");

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (selectedAreaFilter !== "All" && r.area !== selectedAreaFilter) return false;
    if (selectedDomainFilter !== "All" && r.domain !== selectedDomainFilter) return false;
    if (selectedStatusFilter !== "All" && r.status !== selectedStatusFilter) return false;
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

  function openCreateModal() {
    setEditingReport(null);
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
      photoUrls: [],
    });
    setFormError("");
    setShowAddModal(true);
  }

  function openEditModal(report: AuditReportItem) {
    setEditingReport(report);
    setFormData({
      title: report.title,
      area: report.area,
      domain: report.domain,
      findingDescription: report.findingDescription,
      rootCause: report.rootCause,
      actionPlan: report.actionPlan,
      lessonLearned: report.lessonLearned,
      auditorName: report.auditorName,
      severity: report.severity,
      status: report.status,
      auditDate: report.auditDate,
      photoUrls: report.photoUrls ? [...report.photoUrls] : [],
    });
    setFormError("");
    setShowAddModal(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.photoUrls.length + files.length > 5) {
      setFormError("Maksimal 5 foto per laporan.");
      return;
    }

    setIsUploading(true);
    setFormError("");

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 5 * 1024 * 1024) {
          setFormError(`File "${file.name}" melebihi batas 5MB.`);
          continue;
        }

        const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: file,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          setFormError(data.error || `Gagal mengunggah ${file.name}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          photoUrls: [...prev.photoUrls, ...uploadedUrls].slice(0, 5),
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setFormError("Gagal mengunggah foto.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function handleRemovePhoto(indexToRemove: number) {
    setFormData((prev) => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((_, idx) => idx !== indexToRemove),
    }));
  }

  async function handleAiAnalyze() {
    if (!formData.findingDescription || formData.findingDescription.trim().length < 5) {
      setFormError("Isi Deskripsi Temuan Lapangan (minimal 5 karakter) terlebih dahulu sebelum menganalisis AI.");
      return;
    }

    setIsAnalyzing(true);
    setFormError("");

    try {
      const res = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.findingDescription,
          area: formData.area,
          domain: formData.domain,
          severity: formData.severity,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormData((prev) => ({
          ...prev,
          rootCause: data.rootCause || data.summary || prev.rootCause,
          actionPlan: data.actionPlan || prev.actionPlan,
        }));
      } else {
        setFormError(data.error || "Gagal menganalisis temuan dengan AI.");
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      setFormError("Terjadi kesalahan saat menghubungkan ke service AI.");
    } finally {
      setIsAnalyzing(false);
    }
  }

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
      if (editingReport) {
        await onUpdateReport(editingReport.id, { ...formData });
        setShowAddModal(false);
        setSavedReportSuccess({ id: editingReport.id, ...formData });
      } else {
        const createdReport = await onAddReport({ ...formData });
        setShowAddModal(false);

        if (createdReport) {
          setSavedReportSuccess(createdReport);
        } else {
          setSavedReportSuccess({ id: Date.now(), ...formData });
        }
      }

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
        photoUrls: [],
      });
      setEditingReport(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan laporan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDownloadSinglePDF(report: AuditReportItem) {
    try {
      const doc = await generateSingleReportPDF(report);
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
        return "bg-indigo-600 text-white font-semibold";
      default:
        return "bg-slate-500 text-white font-medium";
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "Resolved":
        return { label: "Selesai", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle };
      case "In Progress":
        return { label: "Dalam Perbaikan", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock };
      default:
        return { label: "Terbuka (Open)", bg: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle };
    }
  }

  return (
    <section id="report-builder-section" className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase block">
            Penyusun Laporan Live Audit
          </span>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Audit Report Builder
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Laporan audit wajib menyertakan analisis 3 pilar utama: <strong>Root Cause</strong>, <strong>Action Plan (CAPA)</strong>, dan <strong>Lesson Learned</strong>.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Laporan Audit Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci temuan, root cause, auditor..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>

          {/* Domain Filter */}
          <div>
            <select
              value={selectedDomainFilter}
              onChange={(e) => setSelectedDomainFilter(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800"
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
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800"
            >
              <option value="All">Semua Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1 border-t border-slate-200/60">
          <span>Menampilkan <strong>{filteredReports.length}</strong> dari {reports.length} laporan audit.</span>
          {selectedAreaFilter !== "All" && (
            <span className="text-indigo-600 font-bold">Terfilter Area: {selectedAreaFilter}</span>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-500">Tidak ada laporan audit yang cocok dengan filter.</p>
            <p className="text-xs text-slate-400">Cobalah mengubah filter area, domain, atau kata kunci pencarian.</p>
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
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300/80 shadow-xs hover:shadow-md transition-all overflow-hidden space-y-0"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                  className="p-4 bg-white hover:bg-slate-50/60 cursor-pointer flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-black text-xs rounded-md border border-indigo-100 shadow-2xs">
                        AREA: {report.area}
                      </span>
                      <DomainBadge domain={report.domain} size="sm" />
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getSeverityBadge(report.severity)}`}>
                        {report.severity} Severity
                      </span>

                      {report.photoUrls && report.photoUrls.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md border border-slate-200">
                          <ImageIcon className="w-3 h-3 text-indigo-600" />
                          {report.photoUrls.length} Foto
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-800 text-base hover:text-indigo-600 transition-colors leading-snug">
                      {report.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                      {report.findingDescription}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${statusInfo.bg}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusInfo.label}</span>
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSinglePDF(report);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-indigo-200"
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
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600 font-bold bg-indigo-50/60 px-2.5 py-1 rounded-lg border border-indigo-100">
                      <span className="flex items-center gap-1 text-indigo-700">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Tanggal Audit: {indonesianDate}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> {report.auditorName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded View with 3 PILARS INTERACTIVE CARDS */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/70 border-t border-slate-100 space-y-4 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 gap-2">
                      <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-600" /> Tanggal Audit On-Site: <strong>{indonesianDate}</strong>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-indigo-600" /> Auditor: <strong>{report.auditorName}</strong>
                        </span>
                        <button
                          onClick={() => handleDownloadSinglePDF(report)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-100" />
                          <span>Download PDF Laporan</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Deskripsi Temuan Audit Lapangan
                      </span>
                      <p className="text-xs font-semibold text-slate-800 bg-white p-3.5 rounded-2xl border border-slate-200/80 whitespace-pre-line leading-relaxed">
                        {report.findingDescription}
                      </p>
                    </div>

                    {/* PHOTO GALLERY IN EXPANDED VIEW */}
                    {report.photoUrls && report.photoUrls.length > 0 && (
                      <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80">
                        <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <ImageIcon className="w-4 h-4 text-indigo-600" />
                          Foto / Media Temuan Lapangan ({report.photoUrls.length} Foto)
                        </span>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {report.photoUrls.map((url, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => setLightboxImage(url)}
                              className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs cursor-pointer group hover:opacity-90 transition-opacity"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Foto ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-5 h-5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3 PILARS UTAMA LAPORAN AUDIT (INTERACTIVE CARDS) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Pilar 1: Root Cause Card */}
                      <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4.5 space-y-2.5 transition-all hover:shadow-md hover:border-indigo-300">
                        <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-indigo-600" />
                            Akar Masalah (Root Cause)
                          </span>
                          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">Pilar 1</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                          {report.rootCause}
                        </p>
                      </div>

                      {/* Pilar 2: Action Plan Table/Card */}
                      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4.5 space-y-2.5 transition-all hover:shadow-md hover:border-emerald-300">
                        <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Rencana Perbaikan (CAPA)
                          </span>
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Pilar 2</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                          {report.actionPlan}
                        </p>
                      </div>

                      {/* Pilar 3: Lesson Learned Card */}
                      <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4.5 space-y-2.5 transition-all hover:shadow-md hover:border-purple-300">
                        <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-purple-600" />
                            Key Takeaway (L&D Insight)
                          </span>
                          <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">Pilar 3</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                          {report.lessonLearned}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer with EDIT REPORT BUTTON */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Ubah Status:</span>
                        <button
                          onClick={() => onUpdateReportStatus(report.id, "Open")}
                          className={`px-3 py-1 rounded-xl font-bold text-[11px] cursor-pointer transition-colors ${
                            report.status === "Open" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-rose-100"
                          }`}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => onUpdateReportStatus(report.id, "In Progress")}
                          className={`px-3 py-1 rounded-xl font-bold text-[11px] cursor-pointer transition-colors ${
                            report.status === "In Progress" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-amber-100"
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => onUpdateReportStatus(report.id, "Resolved")}
                          className={`px-3 py-1 rounded-xl font-bold text-[11px] cursor-pointer transition-colors ${
                            report.status === "Resolved" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-emerald-100"
                          }`}
                        >
                          Resolved
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(report)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-bold cursor-pointer transition-colors border border-indigo-100"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Laporan Ini</span>
                        </button>

                        <button
                          onClick={() => onDeleteReport(report.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl font-bold cursor-pointer transition-colors border border-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Laporan Ini</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* LIGHTBOX MODAL FOR ENLARGING PHOTOS */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center space-y-3">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 bg-slate-900/60 text-white hover:bg-slate-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Foto Temuan Enlarge"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL WITH PDF DOWNLOAD BUTTON */}
      {savedReportSuccess && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-100 shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-800">
                Laporan Audit Berhasil Disimpan!
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Laporan &quot;<strong>{savedReportSuccess.title}</strong>&quot; telah tersimpan secara permanen di database.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-left space-y-1">
              <p className="font-bold text-slate-800">Detail Ringkas Laporan:</p>
              <p className="text-slate-600">• Area: {savedReportSuccess.area} | Domain: {savedReportSuccess.domain}</p>
              <p className="text-slate-600">• Tanggal: {formatIndonesianDate(savedReportSuccess.auditDate)}</p>
              <p className="text-slate-600">• Auditor: {savedReportSuccess.auditorName}</p>
              {savedReportSuccess.photoUrls && savedReportSuccess.photoUrls.length > 0 && (
                <p className="text-slate-600">• Lampiran Foto: {savedReportSuccess.photoUrls.length} File</p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleDownloadSinglePDF(savedReportSuccess)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-indigo-200" />
                <span>Download PDF Laporan Ini</span>
              </button>

              <button
                onClick={() => setSavedReportSuccess(null)}
                className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT REPORT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 border border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  {editingReport ? "Edit Laporan Audit On-Site" : "Buat Laporan Audit Baru (Live On-Site Execution)"}
                </h3>
                <p className="text-xs text-slate-500">
                  Lengkapi 3 pilar wajib analisis akar masalah, rencana aksi (CAPA), dan upload media bukti temuan.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
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
                  <label className="text-xs font-bold text-slate-700">Area Audit (Wajib Tag)</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                  >
                    <option value="Cutting">Cutting Area</option>
                    <option value="Prep">Prep Area</option>
                    <option value="CSC">CSC Area</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Domain Audit</label>
                  <select
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                  >
                    <option value="MQAA">MQAA (Quality Assurance)</option>
                    <option value="6S">6S (Safety & Housekeeping)</option>
                    <option value="Visual Management">Visual Management</option>
                    <option value="HSE">HSE (Safety & Health)</option>
                    <option value="PS">PS (Process Standardization)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tingkat Keparahan (Severity)</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
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
                  <label className="text-xs font-bold text-slate-700">Judul Temuan Audit</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Ketidaksesuaian Viskositas Lem Primer Line CSC..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nama Auditor</label>
                    <input
                      type="text"
                      value={formData.auditorName}
                      onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tanggal Audit</label>
                    <input
                      type="date"
                      value={formData.auditDate}
                      onChange={(e) => setFormData({ ...formData, auditDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Deskripsi Temuan Lapangan</label>
                <textarea
                  value={formData.findingDescription}
                  onChange={(e) => setFormData({ ...formData, findingDescription: e.target.value })}
                  placeholder="Jelaskan fakta observasi, lokasi spesifik, instrumen atau komponen yang bermasalah..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-800 h-20 resize-none"
                  required
                />
              </div>

              {/* MEDIA / PHOTO UPLOAD SECTION */}
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    Foto / Media Temuan (Opsional - Maks. 5 foto, 5MB per file)
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {formData.photoUrls.length} / 5 Terpilih
                  </span>
                </div>

                {formData.photoUrls.length < 5 && (
                  <div>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-colors">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>{isUploading ? "Mengunggah..." : "+ Pilih File Foto (JPG, PNG, WEBP)"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Previews of uploaded images */}
                {formData.photoUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {formData.photoUrls.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full text-xs shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                          title="Hapus foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3 PILARS WAJIB ANALISIS AUDIT WITH AI BUTTON */}
              <div className="p-4 bg-slate-50/90 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider block">
                    3 PILAR WAJIB ANALISIS AUDIT (REQUIRED AUDIT PILARS)
                  </span>

                  <button
                    type="button"
                    onClick={handleAiAnalyze}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Otomatis isi Akar Masalah & Action Plan (CAPA) berdasarkan deskripsi temuan"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>{isAnalyzing ? "Menganalisis AI..." : "✨ Analisis Action Plan (AI)"}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Pilar 1: Root Cause */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-indigo-600 text-white rounded-full inline-flex items-center justify-center text-[10px]">1</span>
                      Akar Masalah (Root Cause Analysis - Pilar 1) *
                    </label>
                    <textarea
                      value={formData.rootCause}
                      onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                      placeholder="Analisis mendalam mengapa masalah terjadi (metode 4M+1E)..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-800 h-20 resize-none"
                      required
                    />
                  </div>

                  {/* Pilar 2: Action Plan */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center text-[10px]">2</span>
                      Rencana Perbaikan CAPA (Action Plan - Pilar 2) *
                    </label>
                    <textarea
                      value={formData.actionPlan}
                      onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
                      placeholder="Langkah spesifik Jangka Pendek (Corrective) & Jangka Panjang (Preventive) beserta SLA..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-800 h-20 resize-none"
                      required
                    />
                  </div>

                  {/* Pilar 3: Lesson Learned */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-purple-600 text-white rounded-full inline-flex items-center justify-center text-[10px]">3</span>
                      Pembelajaran Utama (Key L&D Insight - Pilar 3) *
                    </label>
                    <textarea
                      value={formData.lessonLearned}
                      onChange={(e) => setFormData({ ...formData, lessonLearned: e.target.value })}
                      placeholder="Insight kunci / key takeaway untuk tim Learning & Development..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-800 h-20 resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || isAnalyzing}
                  className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? "Menyimpan Laporan..." : editingReport ? "Simpan Perubahan Laporan" : "Simpan Laporan Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AuditReportBuilder;
