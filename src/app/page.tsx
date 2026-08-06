// File: src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeaderHero } from "@/components/HeaderHero";
import { AuditAreaScope, AreaType } from "@/components/AuditAreaScope";
import { ThreeMonthTimeline, ChecklistItem } from "@/components/ThreeMonthTimeline";
import { WeeklyCadenceSection } from "@/components/WeeklyCadenceSection";
import { AuditReportBuilder, AuditReportItem } from "@/components/AuditReportBuilder";
import { DynamicAuditForm, DynamicAuditFormData } from "@/components/DynamicAuditForm";
import { DownloadResumeSection } from "@/components/DownloadResumeSection";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import {
  Menu,
  Bell,
  FileText,
  RefreshCw,
  Calendar,
  BarChart3,
  AlertTriangle,
  Wifi,
  WifiOff,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [reports, setReports] = useState<AuditReportItem[]>([]);
  
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<AreaType>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App Grid Active Tab (Home, Audit, Kaizen, Cadence, Analytics)
  const [activeTab, setActiveTab] = useState<"home" | "audit" | "kaizen" | "cadence" | "analytics">("home");

  // Mobile Menu Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Online / Offline Status State
  const [isOnline, setIsOnline] = useState(true);
  const [draftCount, setDraftCount] = useState(2);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [resChecklists, resReports] = await Promise.all([
        fetch("/api/checklists"),
        fetch("/api/reports"),
      ]);

      if (resChecklists.status === 401 || resReports.status === 401) {
        router.push("/login");
        return;
      }

      const dataChecklists = await resChecklists.json();
      const dataReports = await resReports.json();

      if (dataChecklists.success) setChecklists(dataChecklists.data);
      if (dataReports.success) setReports(dataReports.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();

    // Online / Offline Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadData]);

  // Auth Logout Handler
  async function handleLogout() {
    try {
      await fetch("/api/login", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // Checklist Handlers
  async function handleToggleChecklist(id: number, currentStatus: boolean) {
    const nextCompleted = !currentStatus;
    setChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: nextCompleted } : c))
    );

    try {
      const res = await fetch("/api/checklists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: nextCompleted }),
      });
      const data = await res.json();
      if (!data.success) {
        setChecklists((prev) =>
          prev.map((c) => (c.id === id ? { ...c, completed: currentStatus } : c))
        );
        showToast("Gagal memperbarui status checklist.");
      } else {
        showToast(nextCompleted ? "Checklist ditandai selesai! ✓" : "Status checklist diperbarui.");
      }
    } catch {
      setChecklists((prev) =>
        prev.map((c) => (c.id === id ? { ...c, completed: currentStatus } : c))
      );
      showToast("Terjadi kesalahan jaringan.");
    }
  }

  async function handleAddChecklist(newItem: {
    month: string;
    domain: string;
    title: string;
    description: string;
    area: string;
    auditDate?: string | null;
  }) {
    try {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (data.success) {
        setChecklists((prev) => [...prev, data.data]);
        showToast("Item checklist berhasil ditambahkan.");
      } else {
        showToast(data.error || "Gagal menambah checklist.");
      }
    } catch {
      showToast("Terjadi kesalahan server.");
    }
  }

  async function handleEditChecklist(
    id: number,
    updatedItem: { month: string; domain: string; title: string; description: string; area: string; auditDate?: string | null }
  ) {
    try {
      const res = await fetch("/api/checklists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updatedItem }),
      });
      const data = await res.json();
      if (data.success) {
        setChecklists((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...data.data } : c))
        );
        showToast("Item checklist berhasil diperbarui.");
      } else {
        showToast(data.error || "Gagal memperbarui checklist.");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi.");
    }
  }

  async function handleDeleteChecklist(id: number) {
    try {
      const res = await fetch(`/api/checklists?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setChecklists((prev) => prev.filter((c) => c.id !== id));
        showToast("Checklist berhasil dihapus.");
      } else {
        showToast(data.error || "Gagal menghapus.");
      }
    } catch {
      showToast("Gagal menghapus checklist.");
    }
  }

  // Audit Report Handlers
  async function handleAddReport(reportData: Omit<AuditReportItem, "id">): Promise<AuditReportItem | void> {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData),
    });
    const data = await res.json();
    if (data.success) {
      setReports((prev) => [data.data, ...prev]);
      showToast("Laporan audit berhasil disimpan!");
      return data.data;
    } else {
      throw new Error(data.error || "Gagal menyimpan laporan.");
    }
  }

  async function handleUpdateReport(id: number, reportData: Partial<AuditReportItem>) {
    const res = await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...reportData }),
    });
    const data = await res.json();
    if (data.success) {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data.data } : r))
      );
      showToast("Laporan audit berhasil diperbarui!");
    } else {
      throw new Error(data.error || "Gagal memperbarui laporan.");
    }
  }

  async function handleUpdateReportStatus(id: number, newStatus: string) {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        loadData(true);
        showToast("Gagal mengupdate status laporan.");
      } else {
        showToast(`Status laporan diubah menjadi: ${newStatus}`);
      }
    } catch {
      loadData(true);
      showToast("Koneksi bermasalah.");
    }
  }

  async function handleDeleteReport(id: number) {
    try {
      const res = await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        showToast("Laporan audit berhasil dihapus.");
      } else {
        showToast(data.error || "Gagal menghapus laporan.");
      }
    } catch {
      showToast("Gagal menghapus laporan.");
    }
  }

  // Handle Dynamic Audit Form submission
  async function handleDynamicFormSubmit(formData: DynamicAuditFormData) {
    for (const finding of formData.findings) {
      await handleAddReport({
        title: `Temuan Audit ${formData.area} (${formData.lineNumber})`,
        area: formData.area,
        domain: "MQAA",
        findingDescription: finding.findingDescription,
        rootCause: `[Akar Masalah - ${formData.area} / ${formData.lineNumber}]: Terjadi deviasi parameter operasional pada ${formData.lineNumber}.`,
        actionPlan: `[CAPA Action - ${formData.area}]: Lakukan pemeriksaan dan penyesuaian instrumen di ${formData.lineNumber}.`,
        lessonLearned: `[Key Takeaway]: Pentingnya pemeliharaan berkala pada ${formData.lineNumber}.`,
        auditorName: "Auditor CEM",
        severity: "Medium",
        status: "Open",
        auditDate: new Date().toISOString().split("T")[0],
      });
    }
  }

  // Count reports by area
  const reportCounts = {
    Cutting: reports.filter((r) => r.area === "Cutting").length,
    Prep: reports.filter((r) => r.area === "Prep").length,
    CSC: reports.filter((r) => r.area === "CSC").length,
    All: reports.length,
  };

  const totalChecklistCount = checklists.length;
  const completedChecklistCount = checklists.filter((c) => c.completed).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-extrabold text-indigo-600 tracking-wide animate-pulse">
          Memuat Dashboard Audit Crucible...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-20 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-14 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce border border-slate-700/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER NAVBAR (MOBILE FIRST) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Hamburger Menu Icon */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Center: Brand Logo */}
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-600 bg-clip-text text-transparent">
              THE AUDIT CRUCIBLE
            </span>
          </div>

          {/* Right: Notification Bell Icon with Badge */}
          <div className="relative">
            <button
              onClick={() => showToast("3 Tugas Kaizen & Audit Mendesak Perlu Tindakan!")}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                3
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200 z-30">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase">Navigasi Aplikasi</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 text-xs font-bold">Tutup ✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button onClick={() => { setActiveTab("home"); setIsMobileMenuOpen(false); }} className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-left">
              🏠 Home App Grid
            </button>
            <Link href="/audit/new" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-left">
              📝 Buat Audit Baru
            </Link>
            <Link href="/kaizen" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-left">
              🔄 Kaizen PDCA
            </Link>
            <Link href="/cadence" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-left">
              📅 Weekly Cadence
            </Link>
            <Link href="/analytics" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-left col-span-2">
              📊 Dashboard & PDF Generator
            </Link>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* GREETING SECTION */}
        <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-indigo-200 text-xs font-semibold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Certified Engineering Manager Platform</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Halo, Auditor Gandul 👋
            </h1>
            <p className="text-indigo-200 text-xs md:text-sm max-w-xl leading-relaxed">
              Buktikan di program ini kamu lebih bisa berkembang dan menjaga kualitas pabrik!
            </p>
          </div>
        </section>

        {/* MENU UTAMA (APP GRID - MOBILE FIRST: grid-cols-2 HP, grid-cols-4 Tablet/Desktop) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Menu Utama Aplikasi (App Grid)
            </h2>
            <span className="text-[10px] text-indigo-600 font-bold">Mobile First Grid</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: BUAT AUDIT BARU */}
            <Link
              href="/audit/new"
              className="group bg-white hover:bg-indigo-50/50 p-5 rounded-3xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Input Form
                </span>
                <h3 className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                  BUAT AUDIT BARU
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Multi-finding input form dengan dukungan AI.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>/audit/new</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: KAIZEN PDCA */}
            <Link
              href="/kaizen"
              className="group bg-white hover:bg-purple-50/50 p-5 rounded-3xl border border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Continuous Improvement
                </span>
                <h3 className="text-sm font-black text-slate-800 group-hover:text-purple-600 transition-colors">
                  KAIZEN PDCA
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Lembar Standar Operasional Kaizen 8 Langkah.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                <span>/kaizen</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: WEEKLY CADENCE */}
            <Link
              href="/cadence"
              className="group bg-white hover:bg-emerald-50/50 p-5 rounded-3xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Schedule Calendar
                </span>
                <h3 className="text-sm font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                  WEEKLY CADENCE
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Kalender jadwal 1 minggu & inline editing.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>/cadence</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: DASHBOARD & PDF */}
            <Link
              href="/analytics"
              className="group bg-white hover:bg-amber-50/50 p-5 rounded-3xl border border-slate-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Analytics & Reports
                </span>
                <h3 className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                  DASHBOARD & PDF
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Ringkasan analitik & generator resume PDF.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                <span>/analytics</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* ALERT CARD: RINGKASAN TUGAS KAIZEN MENDESAK */}
        <section className="bg-amber-50/90 border border-amber-200 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pemberitahuan Tugas Kaizen Mendesak</span>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-full">
              SLA &lt; 24 Jam
            </span>
          </div>

          <div className="space-y-2 text-xs text-amber-950 font-medium leading-relaxed">
            <p className="font-bold">
              ⚠️ 2 Tugas Kaizen Mendesak memerlukan verifikasi tindakan di CSC Area (Suhu Oven Cementing) dan Cutting Area (Mata Pisau Clicker).
            </p>
            <p className="text-slate-600 text-[11px]">
              Harap segera lakukan peninjauan lembar Kaizen 8 langkah untuk memastikan SLA penanggulangan terpenuhi tepat waktu.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Link
              href="/kaizen"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Buka Lembar Kaizen</span>
            </Link>
          </div>
        </section>

        {/* SUBVIEW SECTIONS FOR COMPLETE INTEGRATION ON HOMEPAGE */}
        <div className="space-y-8 pt-4">
          <HeaderHero
            totalChecklists={totalChecklistCount}
            completedChecklists={completedChecklistCount}
            onLogout={handleLogout}
          />

          <AuditAreaScope
            selectedArea={selectedAreaFilter}
            onSelectArea={setSelectedAreaFilter}
            reportCounts={reportCounts}
          />

          <SummaryDashboard checklists={checklists} reports={reports} />

          <ThreeMonthTimeline
            checklists={checklists}
            selectedAreaFilter={selectedAreaFilter}
            onToggleChecklist={handleToggleChecklist}
            onAddChecklist={handleAddChecklist}
            onEditChecklist={handleEditChecklist}
            onDeleteChecklist={handleDeleteChecklist}
          />

          <WeeklyCadenceSection />

          <DynamicAuditForm onSubmit={handleDynamicFormSubmit} />

          <DownloadResumeSection checklists={checklists} reports={reports} />

          <AuditReportBuilder
            reports={reports}
            selectedAreaFilter={selectedAreaFilter}
            onAddReport={handleAddReport}
            onUpdateReport={handleUpdateReport}
            onUpdateReportStatus={handleUpdateReportStatus}
            onDeleteReport={handleDeleteReport}
          />
        </div>
      </main>

      {/* STATUS BAR AT VERY BOTTOM */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Online / Offline Indicator */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] border border-emerald-200">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online (Terhubung Server)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full text-[11px] border border-rose-200">
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>Offline (Mode Lokal)</span>
              </span>
            )}
          </div>

          {/* Right: Draft Count */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
            <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
              Draft Tersimpan: <strong>{draftCount} Item</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
