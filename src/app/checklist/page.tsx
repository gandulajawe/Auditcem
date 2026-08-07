// File: src/app/checklist/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { AuditAreaScope, AreaType } from "@/components/AuditAreaScope";
import { ThreeMonthTimeline, ChecklistItem } from "@/components/ThreeMonthTimeline";
import { AuditReportItem } from "@/components/AuditReportBuilder";

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [reports, setReports] = useState<AuditReportItem[]>([]);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<AreaType>("All");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [resChecklists, resReports] = await Promise.all([
        fetch("/api/checklists"),
        fetch("/api/reports"),
      ]);
      const dataChecklists = await resChecklists.json();
      const dataReports = await resReports.json();

      if (dataChecklists.success && Array.isArray(dataChecklists.data)) {
        setChecklists(dataChecklists.data);
      }
      if (dataReports.success && Array.isArray(dataReports.data)) {
        setReports(dataReports.data);
      }
    } catch (err) {
      console.error("Failed to load checklist data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      await loadData();
    })().catch((err) => {
      if (!ignore) console.error(err);
    });
    return () => {
      ignore = true;
    };
  }, [loadData]);

  // Count reports by area (Cutting, Prep, CSC) — needed by AuditAreaScope
  const reportCounts = {
    Cutting: reports.filter((r) => r.area === "Cutting").length,
    Prep: reports.filter((r) => r.area === "Prep").length,
    CSC: reports.filter((r) => r.area === "CSC").length,
    All: reports.length,
  };

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
      }
    } catch {
      setChecklists((prev) =>
        prev.map((c) => (c.id === id ? { ...c, completed: currentStatus } : c))
      );
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
      }
    } catch (err) {
      console.error("Failed to add checklist:", err);
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
      }
    } catch (err) {
      console.error("Failed to edit checklist:", err);
    }
  }

  async function handleDeleteChecklist(id: number) {
    try {
      const res = await fetch(`/api/checklists?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setChecklists((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete checklist:", err);
    }
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

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
            Checklist Program 3 Bulan
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Memuat Checklist 3 Bulan...
          </div>
        ) : (
          <div className="space-y-6">
            <AuditAreaScope
              selectedArea={selectedAreaFilter}
              onSelectArea={setSelectedAreaFilter}
              reportCounts={reportCounts}
            />

            <ThreeMonthTimeline
              checklists={checklists}
              selectedAreaFilter={selectedAreaFilter}
              onToggleChecklist={handleToggleChecklist}
              onAddChecklist={handleAddChecklist}
              onEditChecklist={handleEditChecklist}
              onDeleteChecklist={handleDeleteChecklist}
            />
          </div>
        )}
      </div>
    </div>
  );
}
