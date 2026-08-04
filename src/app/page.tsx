"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HeaderHero } from "@/components/HeaderHero";
import { AuditAreaScope, AreaType } from "@/components/AuditAreaScope";
import { ThreeMonthTimeline, ChecklistItem } from "@/components/ThreeMonthTimeline";
import { AuditReportBuilder, AuditReportItem } from "@/components/AuditReportBuilder";
import { DownloadResumeSection } from "@/components/DownloadResumeSection";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import { RefreshCw, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [reports, setReports] = useState<AuditReportItem[]>([]);
  
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<AreaType>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    // Optimistic update
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
        // revert on failure
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
      <div className="min-h-screen bg-[#FAF7FB] flex flex-col justify-center items-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-[#6A0DAD] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-extrabold text-[#6A0DAD] tracking-wide animate-pulse">
          Memuat Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFD] text-gray-800 pb-16 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#6A0DAD] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce border border-[#F7C6D9]/40">
          <CheckCircle2 className="w-4 h-4 text-[#F7C6D9]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Floating Data Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#F2A7C6] hover:bg-[#F7C6D9]/30 text-[#6A0DAD] text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Menyingkronkan Data..." : "Segarkan Data Real-Time"}</span>
          </button>
        </div>

        {/* SECTION 1: Header / Hero Banner */}
        <HeaderHero
          totalChecklists={totalChecklistCount}
          completedChecklists={completedChecklistCount}
          onLogout={handleLogout}
        />

        {/* SECTION 2: Cakupan Area Audit (3 Badges/Chips: Cutting, Prep, CSC) */}
        <AuditAreaScope
          selectedArea={selectedAreaFilter}
          onSelectArea={setSelectedAreaFilter}
          reportCounts={reportCounts}
        />

        {/* SECTION 6: Dashboard Ringkasan Summary */}
        <SummaryDashboard checklists={checklists} reports={reports} />

        {/* SECTION 3: Timeline 3 Bulan (Agustus, September, Oktober) */}
        <ThreeMonthTimeline
          checklists={checklists}
          selectedAreaFilter={selectedAreaFilter}
          onToggleChecklist={handleToggleChecklist}
          onAddChecklist={handleAddChecklist}
          onEditChecklist={handleEditChecklist}
          onDeleteChecklist={handleDeleteChecklist}
        />

        {/* FITUR EKSPOR OTOMATIS PDF: Download Resume (.pdf) Berdasarkan Filter Database */}
        <DownloadResumeSection
          checklists={checklists}
          reports={reports}
        />

        {/* SECTION 5: Audit Report Builder (with 3 Required Columns, Edit, Photo Upload & Single PDF Download) */}
        <AuditReportBuilder
          reports={reports}
          selectedAreaFilter={selectedAreaFilter}
          onAddReport={handleAddReport}
          onUpdateReport={handleUpdateReport}
          onUpdateReportStatus={handleUpdateReportStatus}
          onDeleteReport={handleDeleteReport}
        />

        {/* Footer */}
        <footer className="pt-8 border-t border-gray-200/80 text-center space-y-2">
          <p className="text-xs font-bold text-[#6A0DAD]">
            The Audit Crucible — Months 4-6 Certified Engineering Manager (CEM) Program
          </p>
          <p className="text-[11px] text-gray-400">
            Aplikasi audit milik si Gandul
          </p>
        </footer>
      </div>
    </div>
  );
}
