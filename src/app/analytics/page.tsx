// File: src/app/analytics/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Download } from "lucide-react";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import { DownloadResumeSection } from "@/components/DownloadResumeSection";

export default function AnalyticsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resChecklists, resReports] = await Promise.all([
          fetch("/api/checklists"),
          fetch("/api/reports"),
        ]);
        const dataChecklists = await resChecklists.json();
        const dataReports = await resReports.json();

        if (dataChecklists.success) setChecklists(dataChecklists.data);
        if (dataReports.success) setReports(dataReports.data);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            Analytics & PDF Resume Generator
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Memuat Dashboard Analitik & Ekspor PDF...
          </div>
        ) : (
          <div className="space-y-6">
            <SummaryDashboard checklists={checklists} reports={reports} />
            <DownloadResumeSection checklists={checklists} reports={reports} />
          </div>
        )}
      </div>
    </div>
  );
}
