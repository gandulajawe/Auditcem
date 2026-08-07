// File: src/app/kaizen/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { KaizenPdcaModal } from "@/components/KaizenPdcaModal";

export default function KaizenPage() {
  const [kaizenList, setKaizenList] = useState<any[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadKaizenData = useCallback(async (isMounted: boolean) => {
    try {
      const res = await fetch("/api/kaizen");
      const json = await res.json();
      if (isMounted && json.success && Array.isArray(json.data)) {
        setKaizenList(json.data);
      }
    } catch (err) {
      console.error("Failed to load Kaizen records:", err);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await fetch("/api/kaizen");
      const json = await res.json();
      if (isMounted && json.success && Array.isArray(json.data)) {
        setKaizenList(json.data);
      }
    })()
      .catch((err) => console.error("Failed to load Kaizen records:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateNewKaizen = useCallback(async () => {
    setIsCreatingNew(true);
    setCreateError("");
    try {
      const res = await fetch("/api/kaizen/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Inisiasi Kaizen Mandiri Sektor Operasional",
          area: "Cutting",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal membuat Lembar Kaizen baru.");
      }
      setSelectedFinding({
        findingId: json.data.id,
        findingDescription: "Inisiasi Kaizen Mandiri Sektor Operasional",
        aiRootCause: "Akar masalah teridentifikasi dari observasi lapangan.",
        area: json.data.area || "Cutting",
        projectTitle: json.data.title,
      });
    } catch (err: any) {
      setCreateError(err.message || "Terjadi kesalahan saat membuat Lembar Kaizen baru.");
    } finally {
      setIsCreatingNew(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 p-4 md:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Homepage App Grid</span>
          </Link>

          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            Lembar Standar Operasional Kaizen (PDCA)
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-purple-700 tracking-wider uppercase block">
                Continuous Improvement
              </span>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-purple-600" />
                Lembar Kaizen PDCA 8 Langkah
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Kelola lembar Kaizen 8 langkah tereskalasi dengan foto Before-After & rekomendasi AI.
              </p>
            </div>

            <button
              onClick={handleCreateNewKaizen}
              disabled={isCreatingNew}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCreatingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isCreatingNew ? "Menyiapkan..." : "+ Buat Lembar Kaizen Baru"}</span>
            </button>
          </div>

          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {createError}
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
              Memuat data Lembar Kaizen...
            </div>
          ) : kaizenList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <p className="text-sm font-semibold text-slate-600">Belum ada Lembar Kaizen tersimpan.</p>
              <p className="text-xs text-slate-400">Klik tombol di atas atau eskalasikan temuan audit dari form audit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kaizenList.map((k) => (
                <div
                  key={k.id}
                  onClick={() =>
                    setSelectedFinding({
                      findingId: k.findingId,
                      findingDescription: k.problemSituation || "Temuan Kaizen #" + k.findingId,
                      aiRootCause: k.rootCause5Why,
                      area: "Sektor Kaizen",
                      projectTitle: k.projectTitle || "",
                    })
                  }
                  className="bg-slate-50/80 hover:bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-purple-300 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-800 px-2.5 py-0.5 bg-purple-100 rounded-full">
                      Finding #{k.findingId}
                    </span>
                    <span className="text-[10px] text-slate-400">Klik untuk edit</span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 line-clamp-2">
                    {k.projectTitle || k.problemSituation || "Lembar Kaizen PDCA 8 Langkah"}
                  </p>

                  {k.actionPlan && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 bg-white p-2.5 rounded-xl border border-slate-200">
                      {k.actionPlan}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedFinding && (
        <KaizenPdcaModal
          findingId={selectedFinding.findingId}
          findingDescription={selectedFinding.findingDescription}
          aiRootCause={selectedFinding.aiRootCause}
          area={selectedFinding.area}
          projectTitle={selectedFinding.projectTitle}
          onClose={() => setSelectedFinding(null)}
          onSaveSuccess={() => loadKaizenData(true)}
        />
      )}
    </div>
  );
}
