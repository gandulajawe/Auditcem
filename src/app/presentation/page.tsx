// File: src/app/presentation/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Presentation,
  Sparkles,
  FileText,
  RefreshCw,
  Layers,
  Calendar,
  CalendarRange,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PresentationOutline } from "@/lib/aiPresentation";
import { downloadPresentationPPTX } from "@/lib/pptGenerator";

type DataSource = "audit" | "kaizen" | "combined";
type DateFilterMode = "all" | "range" | "month";

const DATA_SOURCE_OPTIONS: { value: DataSource; label: string; desc: string; icon: typeof FileText }[] = [
  { value: "audit", label: "Laporan Audit", desc: "Hanya data laporan audit operasional.", icon: FileText },
  { value: "kaizen", label: "Kaizen PDCA", desc: "Hanya data lembar Kaizen 8 Langkah.", icon: RefreshCw },
  { value: "combined", label: "Gabungan", desc: "Audit + Kaizen dalam satu deck.", icon: Layers },
];

export default function PresentationPage() {
  const [dataSource, setDataSource] = useState<DataSource>("combined");
  const [dateMode, setDateMode] = useState<DateFilterMode>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Agustus");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedArea, setSelectedArea] = useState("All");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [outline, setOutline] = useState<PresentationOutline | null>(null);
  const [meta, setMeta] = useState<{
    auditCount: number;
    kaizenCount: number;
    scopeLabel: string;
    geminiStatus?: string;
    dailyGeminiCalls?: number;
    dailyEstimate?: number | null;
  } | null>(null);
  const [error, setError] = useState<string>("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleGenerate() {
    if (cooldownSeconds > 0) return;
    setIsGenerating(true);
    setError("");
    setOutline(null);
    try {
      const res = await fetch("/api/presentation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataSource,
          dateMode,
          startDate,
          endDate,
          selectedMonth,
          selectedDomain,
          selectedArea,
        }),
      });
      const json = await res.json();
      if (res.status === 429) {
        const match = /(\d+)\s*detik/.exec(json.error || "");
        setCooldownSeconds(match ? parseInt(match[1], 10) : 30);
        throw new Error(json.error || "Terlalu cepat. Coba lagi sebentar.");
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal membuat outline presentasi.");
      }
      setOutline(json.data.outline);
      setMeta(json.data.meta);
      // Client-side cooldown mirrors the server's 30s window so the button
      // reflects the real wait instead of only failing silently on retry.
      setCooldownSeconds(30);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menghubungi AI Gemini.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload() {
    if (!outline) return;
    setIsDownloading(true);
    try {
      const cleanDomain = selectedDomain.replace(/[^a-zA-Z0-9]/g, "");
      const cleanArea = selectedArea.replace(/[^a-zA-Z0-9]/g, "");
      const filename = `Presentasi-Audit-Crucible-${dataSource}-${cleanDomain}-${cleanArea}.pptx`;
      await downloadPresentationPPTX(outline, filename);
    } catch (err) {
      console.error("Failed to build PPTX:", err);
      setError("Gagal membuat file .pptx dari outline.");
    } finally {
      setIsDownloading(false);
    }
  }

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

          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1.5">
            <Presentation className="w-3.5 h-3.5 text-indigo-600" />
            Generate Presentasi (.pptx)
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase block">
              Fitur Ekspor PowerPoint Otomatis
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Generate PPT dengan AI Gemini
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Pilih sumber data & filter cakupan, lalu AI Gemini akan menyusun seluruh outline slide (judul, ringkasan, poin utama) secara otomatis dari data mentah di database.
            </p>
          </div>

          {/* STEP 1: DATA SOURCE (3 pilihan saat download) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">1. Pilih Sumber Data</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DATA_SOURCE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = dataSource === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDataSource(opt.value)}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-indigo-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-indigo-200" : "text-indigo-600"}`} />
                    <div className="text-sm font-black">{opt.label}</div>
                    <div className={`text-[11px] ${active ? "text-indigo-100" : "text-slate-500"}`}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: FILTER TANGGAL */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">2. Mode Filter Tanggal</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDateMode("all")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dateMode === "all" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Semua Tanggal</span>
              </button>
              <button
                type="button"
                onClick={() => setDateMode("range")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dateMode === "range" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Rentang Tanggal</span>
              </button>
              <button
                type="button"
                onClick={() => setDateMode("month")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dateMode === "month" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Per Bulan</span>
              </button>
            </div>

            {dateMode === "range" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-indigo-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Tanggal Mulai</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Tanggal Selesai</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800" />
                </div>
              </div>
            )}

            {dateMode === "month" && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-indigo-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Pilih Bulan</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 cursor-pointer">
                  <option value="Agustus">Agustus</option>
                  <option value="September">September</option>
                  <option value="Oktober">Oktober</option>
                </select>
              </div>
            )}
          </div>

          {/* STEP 3: DOMAIN & AREA (hanya relevan untuk data audit) */}
          {dataSource !== "kaizen" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">3. Domain Audit</label>
                <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-2xs text-slate-800">
                  <option value="All">All (Semua Domain)</option>
                  <option value="MQAA">MQAA</option>
                  <option value="6S">6S</option>
                  <option value="Visual Management">Visual Management</option>
                  <option value="HSE">HSE</option>
                  <option value="PS">PS</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">4. Area Audit</label>
                <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-2xs text-slate-800">
                  <option value="All">All</option>
                  <option value="Cutting">Cutting</option>
                  <option value="Prep">Prep</option>
                  <option value="CSC">CSC</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* ACTION: GENERATE */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || cooldownSeconds > 0}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>
              {isGenerating
                ? "AI Gemini sedang menyusun outline..."
                : cooldownSeconds > 0
                ? `Tunggu ${cooldownSeconds}s (proteksi kuota Gemini)`
                : "Generate Outline dengan AI Gemini"}
            </span>
          </button>
          {cooldownSeconds > 0 && !isGenerating && (
            <p className="text-[11px] text-slate-400 text-center -mt-3">
              Jeda 30 detik antar generate untuk menjaga kuota Gemini free tier tidak cepat habis.
            </p>
          )}

          {/* PREVIEW OUTLINE */}
          {outline && meta && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Outline siap — {outline.slides.length} slide • {meta.scopeLabel} • {meta.auditCount} audit, {meta.kaizenCount} kaizen
                </span>
              </div>

              {typeof meta.dailyGeminiCalls === "number" && (
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    Panggilan Gemini hari ini: <strong>{meta.dailyGeminiCalls}</strong>
                    {meta.dailyEstimate
                      ? ` dari ~${meta.dailyEstimate} (perkiraan yang kamu set, cek angka pasti di aistudio.google.com/rate-limit)`
                      : " (reset tiap tengah malam waktu Pasifik — cek limit pasti akunmu di aistudio.google.com/rate-limit)"}
                  </span>
                </div>
              )}

              {meta.geminiStatus === "quota_exceeded" && (
                <div className="flex items-start gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Kuota Gemini kemungkinan habis untuk saat ini — outline di atas dibuat pakai template bawaan (rule-based), bukan AI. Coba lagi nanti atau cek status di aistudio.google.com/rate-limit.
                  </span>
                </div>
              )}

              {meta.geminiStatus === "other_error" && (
                <div className="flex items-start gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Panggilan ke Gemini gagal (bukan karena kuota) — outline di atas dibuat pakai template bawaan sebagai fallback.
                  </span>
                </div>
              )}

              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2 max-h-80 overflow-y-auto">
                {outline.slides.map((s, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-start gap-3">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{s.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{s.layout}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? "Menyiapkan file .pptx..." : "Download Presentasi (.pptx)"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
