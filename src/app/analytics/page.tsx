// File: src/app/analytics/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, LayoutList } from "lucide-react";
import { HeaderHero } from "@/components/HeaderHero";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import { DownloadResumeSection } from "@/components/DownloadResumeSection";
import { DomainAnalyticsSection } from "@/components/DomainAnalyticsSection";
import { AuditReportItem } from "@/components/AuditReportBuilder";
import { ChecklistItem } from "@/components/ThreeMonthTimeline";

export default function AnalyticsPage() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [reports, setReports] = useState<AuditReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function handleLogout() {
    try {
      await fetch("/api/login", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [resChecklists, resReports] = await Promise.all([
          fetch("/api/checklists"),
          fetch("/api/reports"),
        ]);
        const dataChecklists = await resChecklists.json();
        const dataReports = await resReports.json();

        if (isMounted) {
          if (dataChecklists.success && Array.isArray(dataChecklists.data)) {
            setChecklists(dataChecklists.data);
          }
          if (dataReports.success && Array.isArray(dataReports.data)) {
            setReports(dataReports.data);
          }
        }
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 p-4 md:p-8 space-y-6">
      <div id="dashboard-pdf-content" className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Homepage App Grid</span>
          </Link>

          <span className="text-xs font-bold text-[#6A0DAD] bg-[#F3EAF8] px-3 py-1 rounded-full border border-[#A569BD]/30 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-[#6A0DAD]" />
            Pivot Analytics & PDF Resume Generator
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-[#6A0DAD] text-xs font-bold animate-pulse">
            Memuat Dashboard Analitik Matriks Pivot & PDF Generator...
          </div>
        ) : (
          <div className="space-y-6">
            <HeaderHero
              totalChecklists={checklists.length}
              completedChecklists={checklists.filter((c) => c.completed).length}
              onLogout={handleLogout}
            />
            <SummaryDashboard checklists={checklists} reports={reports} />

            <section className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-[#6A0DAD] tracking-wider uppercase block">
                    Analisis Per Domain Audit
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                    <LayoutList className="w-6 h-6 text-[#6A0DAD]" />
                    Rincian & Pareto 80/20 per Domain
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Setiap domain (MQAA, 6S, Visual Management, HSE, PS) ditampilkan terpisah, lengkap dengan kategori masalah paling krusial yang menyumbang mayoritas temuan.
                  </p>
                </div>
              </div>
              <DomainAnalyticsSection reports={reports} />
            </section>

            <DownloadResumeSection checklists={checklists} reports={reports} />
          </div>
        )}
      </div>
    </div>
  );
}
