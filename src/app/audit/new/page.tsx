// File: src/app/audit/new/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AuditReportBuilder, AuditReportItem } from "@/components/AuditReportBuilder";

export default function NewAuditPage() {
  const [reports, setReports] = useState<AuditReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadReports() {
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReports(json.data);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleAddReport(reportData: Omit<AuditReportItem, "id">) {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData),
    });
    const data = await res.json();
    if (data.success) {
      loadReports();
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
      loadReports();
    } else {
      throw new Error(data.error || "Gagal memperbarui laporan.");
    }
  }

  async function handleUpdateReportStatus(id: number, newStatus: string) {
    await fetch("/api/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    loadReports();
  }

  async function handleDeleteReport(id: number) {
    await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
    loadReports();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 p-4 md:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Homepage App Grid</span>
          </Link>

          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Penyusun Laporan Audit On-Site
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Memuat Laporan Audit...
          </div>
        ) : (
          <AuditReportBuilder
            reports={reports}
            selectedAreaFilter="All"
            onAddReport={handleAddReport}
            onUpdateReport={handleUpdateReport}
            onUpdateReportStatus={handleUpdateReportStatus}
            onDeleteReport={handleDeleteReport}
          />
        )}
      </div>
    </div>
  );
}
