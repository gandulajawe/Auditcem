"use client";

import { useState } from "react";
import { FileText, Plus, Search, AlertTriangle, CheckCircle, Clock, Trash2, ChevronDown, ChevronUp, UserCheck, Calendar, Sparkles, Download, CheckCircle2, Edit3, Image as ImageIcon, X, Eye, Target, GraduationCap, ShieldCheck, TrendingUp, Hash, Layers } from "lucide-react";
import { DomainBadge } from "./DomainBadge";
import { AreaType } from "./AuditAreaScope";
import { formatIndonesianDate } from "@/lib/dateUtils";
import { generateSingleReportPDF } from "@/lib/pdfGenerator";
import { KaizenPdcaModal } from "./KaizenPdcaModal";

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
  area: string; // Strictly 'Cutting', 'Prep', 'CSC'
  lineNumber?: string | null; // Optional 'Line 02, Mesin Clicker #4'
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
  isKaizenEscalated?: boolean;
  kaizen?: any;
  createdAt?: string;
}

interface SingleFindingFormField {
  id: string;
  title: string;
  findingDescription: string;
  rootCause: string;
  actionPlan: string;
  lessonLearned: string;
  isKaizenEscalated: boolean;
  photoUrls: string[];
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
  const [analyzingFindingId, setAnalyzingFindingId] = useState<string | null>(null);

  // Kaizen Modal State
  const [activeKaizenFinding, setActiveKaizenFinding] = useState<{
    id: number;
    title: string;
    findingDescription: string;
    aiRootCause?: string | null;
    area: string;
  } | null>(null);

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Success Modal State for single report PDF download
  const [savedReportSuccess, setSavedReportSuccess] = useState<AuditReportItem | null>(null);

  // Form Header State
  const [formHeader, setFormHeader] = useState({
    area: "Cutting", // STRICTLY 3 AREAS: Cutting, Prep, CSC
    lineNumber: "",
    domain: "MQAA",
    auditorName: "Expert Auditor CEM",
    severity: "Medium",
    status: "Open",
    auditDate: new Date().toISOString().split("T")[0],
  });

  // Dynamic Findings Array in Form Modal (Supports Multi-Finding Submission in Single Session)
  const [formFindings, setFormFindings] = useState<SingleFindingFormField[]>([
    {
      id: "f-1",
      title: "",
      findingDescription: "",
      rootCause: "",
      actionPlan: "",
      lessonLearned: "",
      isKaizenEscalated: false,
      photoUrls: [],
    },
  ]);

  const [formError, setFormError] = useState("");

  // Filtered reports (Area strictly Cutting, Prep, CSC or All)
  const filteredReports = reports.filter((r) => {
    if (selectedAreaFilter !== "All" && r.area !== selectedAreaFilter) return false;
    if (selectedDomainFilter !== "All" && r.domain !== selectedDomainFilter) return false;
    if (selectedStatusFilter !== "All" && r.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.title.toLowerCase().includes(q) ||
        (r.lineNumber && r.lineNumber.toLowerCase().includes(q)) ||
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
    setFormHeader({
      area: "Cutting",
      lineNumber: "",
      domain: "MQAA",
      auditorName: "Expert Auditor CEM",
      severity: "Medium",
      status: "Open",
      auditDate: new Date().toISOString().split("T")[0],
    });
    setFormFindings([
      {
        id: `f-${Date.now()}`,
        title: "",
        findingDescription: "",
        rootCause: "",
        actionPlan: "",
        lessonLearned: "",
        isKaizenEscalated: false,
        photoUrls: [],
      },
    ]);
    setFormError("");
    setShowAddModal(true);
  }

  function openEditModal(report: AuditReportItem) {
    setEditingReport(report);
    setFormHeader({
      area: report.area || "Cutting",
      lineNumber: report.lineNumber || "",
      domain: report.domain || "MQAA",
      auditorName: report.auditorName || "Expert Auditor CEM",
      severity: report.severity || "Medium",
      status: report.status || "Open",
      auditDate: report.auditDate || new Date().toISOString().split("T")[0],
    });
    setFormFindings([
      {
        id: `f-${report.id}`,
        title: report.title,
        findingDescription: report.findingDescription,
        rootCause: report.rootCause,
        actionPlan: report.actionPlan,
        lessonLearned: report.lessonLearned,
        isKaizenEscalated: Boolean(report.isKaizenEscalated),
        photoUrls: report.photoUrls ? [...report.photoUrls] : [],
      },
    ]);
    setFormError("");
    setShowAddModal(true);
  }

  // Add another finding row in creation form
  function handleAddAnotherFinding() {
    setFormFindings((prev) => [
      ...prev,
      {
        id: `f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: "",
        findingDescription: "",
        rootCause: "",
        actionPlan: "",
        lessonLearned: "",
        isKaizenEscalated: false,
        photoUrls: [],
      },
    ]);
  }

  function handleRemoveFindingRow(id: string) {
    if (formFindings.length <= 1) return;
    setFormFindings((prev) => prev.filter((f) => f.id !== id));
  }

  function handleFindingFieldChange(id: string, field: keyof SingleFindingFormField, value: any) {
    setFormFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, findingId: string) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const targetFinding = formFindings.find((f) => f.id === findingId);
    if (!targetFinding) return;

    if (targetFinding.photoUrls.length + files.length > 5) {
      setFormError("Maksimal 5 foto per temuan.");
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
        setFormFindings((prev) =>
          prev.map((f) =>
            f.id === findingId
              ? { ...f, photoUrls: [...f.photoUrls, ...uploadedUrls].slice(0, 5) }
              : f
          )
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
      setFormError("Gagal mengunggah foto.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function handleRemovePhoto(findingId: string, photoIndex: number) {
    setFormFindings((prev) =>
      prev.map((f) =>
        f.id === findingId
          ? { ...f, photoUrls: f.photoUrls.filter((_, idx) => idx !== photoIndex) }
          : f
      )
    );
  }

  async function handleAiAnalyzeFinding(findingId: string) {
    const finding = formFindings.find((f) => f.id === findingId);
    if (!finding || !finding.findingDescription || finding.findingDescription.trim().length < 5) {
      setFormError("Isi Deskripsi Temuan Lapangan (minimal 5 karakter) terlebih dahulu sebelum menganalisis AI.");
      return;
    }

    setAnalyzingFindingId(findingId);
    setFormError("");

    try {
      const res = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: finding.findingDescription,
          area: formHeader.area,
          domain: formHeader.domain,
          severity: formHeader.severity,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormFindings((prev) =>
          prev.map((f) =>
            f.id === findingId
              ? {
                  ...f,
                  rootCause: data.rootCause || data.summary || f.rootCause,
                  actionPlan: data.actionPlan || f.actionPlan,
                }
              : f
          )
        );
      } else {
        setFormError(data.error || "Gagal menganalisis temuan dengan AI.");
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      setFormError("Terjadi kesalahan saat menghubungkan ke service AI.");
    } finally {
      setAnalyzingFindingId(null);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    // Validate findings
    for (let i = 0; i < formFindings.length; i++) {
      const f = formFindings[i];
      const num = i + 1;
      if (!f.title.trim() && !f.findingDescription.trim()) {
        setFormError(`Temuan #${num}: Judul atau deskripsi temuan wajib diisi.`);
        return;
      }
      if (!f.rootCause.trim() || !f.actionPlan.trim() || !f.lessonLearned.trim()) {
        setFormError(`Temuan #${num}: 3 Kolom Wajib Analysis (Root Cause, Action Plan, & Lesson Learned) harus diisi.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingReport) {
        // Single report update
        const singleFinding = formFindings[0];
        const updatePayload = {
          title: singleFinding.title || `Temuan Audit ${formHeader.area}`,
          area: formHeader.area,
          lineNumber: formHeader.lineNumber,
          domain: formHeader.domain,
          findingDescription: singleFinding.findingDescription,
          rootCause: singleFinding.rootCause,
          actionPlan: singleFinding.actionPlan,
          lessonLearned: singleFinding.lessonLearned,
          auditorName: formHeader.auditorName,
          severity: formHeader.severity,
          status: formHeader.status,
          auditDate: formHeader.auditDate,
          isKaizenEscalated: singleFinding.isKaizenEscalated,
          photoUrls: singleFinding.photoUrls,
        };

        await onUpdateReport(editingReport.id, updatePayload);
        setShowAddModal(false);
        setSavedReportSuccess({ id: editingReport.id, ...updatePayload });
      } else {
        // Multi-finding batch submission or single submission
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            area: formHeader.area,
            lineNumber: formHeader.lineNumber,
            domain: formHeader.domain,
            auditorName: formHeader.auditorName,
            severity: formHeader.severity,
            status: formHeader.status,
            auditDate: formHeader.auditDate,
            findings: formFindings.map((f) => ({
              title: f.title || `Temuan Audit ${formHeader.area} ${formHeader.lineNumber ? `(${formHeader.lineNumber})` : ""}`,
              findingDescription: f.findingDescription,
              rootCause: f.rootCause,
              actionPlan: f.actionPlan,
              lessonLearned: f.lessonLearned,
              isKaizenEscalated: f.isKaizenEscalated,
              photoUrls: f.photoUrls,
            })),
          }),
        });

        const json = await res.json();
        if (json.success) {
          setShowAddModal(false);
          if (json.data) {
            setSavedReportSuccess(json.data);
          }
          // Refresh window / data
          window.location.reload();
        } else {
          setFormError(json.error || "Gagal menyimpan laporan.");
        }
      }

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
              placeholder="Cari kata kunci temuan, line mesin, root cause, auditor..."
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
                      {/* Area Tag */}
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-black text-xs rounded-md border border-indigo-100 shadow-2xs">
                        AREA: {report.area}
                      </span>

                      {/* Line Number Tag */}
                      {report.lineNumber && (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-md border border-slate-200 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-indigo-600" />
                          {report.lineNumber}
                        </span>
                      )}

                      <DomainBadge domain={report.domain} size="sm" />
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getSeverityBadge(report.severity)}`}>
                        {report.severity} Severity
                      </span>

                      {report.isKaizenEscalated && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-black text-[10px] rounded-md border border-purple-200 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-purple-600" />
                          Eskalasi Kaizen
                        </span>
                      )}

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

                {/* Expanded View */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/70 border-t border-slate-100 space-y-4 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 gap-2">
                      <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-600" /> Tanggal Audit On-Site: <strong>{indonesianDate}</strong>
                        {report.lineNumber && (
                          <span className="text-slate-500 ml-2">({report.lineNumber})</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            setActiveKaizenFinding({
                              id: report.id,
                              title: report.title,
                              findingDescription: report.findingDescription,
                              aiRootCause: report.rootCause,
                              area: report.area,
                            })
                          }
                          className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-purple-200" />
                          <span>{report.isKaizenEscalated ? "Kelola Lembar Kaizen" : "Buat Lembar Kaizen"}</span>
                        </button>

                        <button
                          onClick={() => handleDownloadSinglePDF(report)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-100" />
                          <span>Download PDF</span>
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

      {/* KAIZEN PDCA FORM MODAL */}
      {activeKaizenFinding && (
        <KaizenPdcaModal
          findingId={activeKaizenFinding.id}
          findingDescription={activeKaizenFinding.findingDescription}
          aiRootCause={activeKaizenFinding.aiRootCause}
          area={activeKaizenFinding.area}
          onClose={() => setActiveKaizenFinding(null)}
          onSaveSuccess={() => {
            onUpdateReportStatus(activeKaizenFinding.id, "In Progress");
          }}
        />
      )}

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
              <p className="text-slate-600">• Area: {savedReportSuccess.area} {savedReportSuccess.lineNumber ? `(${savedReportSuccess.lineNumber})` : ""} | Domain: {savedReportSuccess.domain}</p>
              <p className="text-slate-600">• Tanggal: {formatIndonesianDate(savedReportSuccess.auditDate)}</p>
              <p className="text-slate-600">• Auditor: {savedReportSuccess.auditorName}</p>
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

      {/* CREATE & EDIT REPORT MODAL WITH MULTI-FINDING INPUT SUPPORT */}
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
                  Lengkapi header area/line, 3 pilar wajib analisis, dan tambahkan beberapa temuan sekaligus jika diperlukan.
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
              {/* HEADER FIELDS: STRICTLY 3 AREAS (Cutting, Prep, CSC) & Line / Nomor Mesin */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Area Audit (STRICTLY 3 AREA) *
                  </label>
                  <select
                    value={formHeader.area}
                    onChange={(e) => setFormHeader({ ...formHeader, area: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 cursor-pointer"
                  >
                    <option value="Cutting">Cutting Area</option>
                    <option value="Prep">Prep Area</option>
                    <option value="CSC">CSC Area</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Line / Nomor Mesin (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formHeader.lineNumber}
                    onChange={(e) => setFormHeader({ ...formHeader, lineNumber: e.target.value })}
                    placeholder="Contoh: Line 02, Mesin Clicker #4"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Domain Audit</label>
                  <select
                    value={formHeader.domain}
                    onChange={(e) => setFormHeader({ ...formHeader, domain: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 cursor-pointer"
                  >
                    <option value="MQAA">MQAA (Quality Assurance)</option>
                    <option value="6S">6S (Safety & Housekeeping)</option>
                    <option value="Visual Management">Visual Management</option>
                    <option value="HSE">HSE (Safety & Health)</option>
                    <option value="PS">PS (Process Standardization)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Nama Auditor</label>
                  <input
                    type="text"
                    value={formHeader.auditorName}
                    onChange={(e) => setFormHeader({ ...formHeader, auditorName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tanggal Audit</label>
                  <input
                    type="date"
                    value={formHeader.auditDate}
                    onChange={(e) => setFormHeader({ ...formHeader, auditDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Severity</label>
                  <select
                    value={formHeader.severity}
                    onChange={(e) => setFormHeader({ ...formHeader, severity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC FINDINGS LIST IN CREATION SESSION */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-700 uppercase tracking-wider block">
                    Daftar Temuan Lapangan ({formFindings.length} Temuan)
                  </label>
                  {!editingReport && (
                    <button
                      type="button"
                      onClick={handleAddAnotherFinding}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>+ Tambah Temuan Lain</span>
                    </button>
                  )}
                </div>

                {formFindings.map((finding, fIndex) => (
                  <div
                    key={finding.id}
                    className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-extrabold text-indigo-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full inline-flex items-center justify-center text-[10px]">
                          {fIndex + 1}
                        </span>
                        Temuan #{fIndex + 1}
                      </span>

                      {formFindings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFindingRow(finding.id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Judul Temuan #{fIndex + 1}</label>
                      <input
                        type="text"
                        value={finding.title}
                        onChange={(e) => handleFindingFieldChange(finding.id, "title", e.target.value)}
                        placeholder={`Contoh: Ketidaksesuaian Viskositas Lem ${formHeader.area} ${formHeader.lineNumber ? `(${formHeader.lineNumber})` : ""}`}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Deskripsi Temuan Lapangan</label>
                      <textarea
                        value={finding.findingDescription}
                        onChange={(e) => handleFindingFieldChange(finding.id, "findingDescription", e.target.value)}
                        placeholder="Jelaskan fakta observasi, lokasi spesifik, instrumen atau komponen bermasalah..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-800 h-20 resize-none"
                        required
                      />
                    </div>

                    {/* PHOTO UPLOAD PER FINDING */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                          Foto Media Temuan (Maks. 5 Foto)
                        </label>
                        <span className="text-[10px] text-slate-400 font-bold">{finding.photoUrls.length} / 5</span>
                      </div>

                      {finding.photoUrls.length < 5 && (
                        <div>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer">
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{isUploading ? "Mengunggah..." : "+ Upload Foto"}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              onChange={(e) => handleFileUpload(e, finding.id)}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {finding.photoUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {finding.photoUrls.map((url, pIdx) => (
                            <div key={pIdx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Preview ${pIdx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(finding.id, pIdx)}
                                className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full text-xs shadow-md"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CHECKBOX ESKALASI KAIZEN */}
                    <div className="p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-purple-900">
                        <input
                          type="checkbox"
                          checked={finding.isKaizenEscalated}
                          onChange={(e) => handleFindingFieldChange(finding.id, "isKaizenEscalated", e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                        <span>Eskalasi ke Kaizen PDCA 8 Langkah</span>
                      </label>
                    </div>

                    {/* 3 REQUIRED COLUMNS WITH AI BUTTON PER FINDING ROW */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider block">
                          3 Pilar Wajib Analisis (Temuan #{fIndex + 1})
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAiAnalyzeFinding(finding.id)}
                          disabled={analyzingFindingId === finding.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          <span>{analyzingFindingId === finding.id ? "Menganalisis..." : "✨ Analisis Action Plan (AI)"}</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">1. Root Cause Analysis (Akar Masalah) *</label>
                          <textarea
                            value={finding.rootCause}
                            onChange={(e) => handleFindingFieldChange(finding.id, "rootCause", e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 text-slate-800 h-16 resize-none"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">2. Action Plan Remediasi (CAPA) *</label>
                          <textarea
                            value={finding.actionPlan}
                            onChange={(e) => handleFindingFieldChange(finding.id, "actionPlan", e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 h-16 resize-none"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">3. Key Lesson Learned (L&D Takeaway) *</label>
                          <textarea
                            value={finding.lessonLearned}
                            onChange={(e) => handleFindingFieldChange(finding.id, "lessonLearned", e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 h-16 resize-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                  disabled={isSubmitting || isUploading || Boolean(analyzingFindingId)}
                  className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? "Menyimpan Laporan..." : editingReport ? "Simpan Perubahan Laporan" : `Simpan ${formFindings.length} Laporan Audit`}
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
