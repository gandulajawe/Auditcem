// File: src/components/KaizenPdcaModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { Sparkles, X, Save, Image as ImageIcon, CheckCircle2, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { formatIndonesianDate } from "@/lib/dateUtils";

export interface KaizenData {
  id?: number;
  findingId: number;
  problemSituation: string;
  breakdown4H1W: string;
  targetSetting: string;
  fishboneData: string;
  rootCause5Why: string;
  actionPlan: string;
  evaluationResults: string;
  standardizationSOP: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
}

interface KaizenPdcaModalProps {
  findingId: number;
  findingDescription: string;
  aiRootCause?: string | null;
  area?: string;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export function KaizenPdcaModal({
  findingId,
  findingDescription,
  aiRootCause,
  area = "Cutting",
  onClose,
  onSaveSuccess,
}: KaizenPdcaModalProps) {
  // Kaizen 8 Steps Form State
  const [problemSituation, setProblemSituation] = useState(findingDescription || "");
  const [breakdown4H1W, setBreakdown4H1W] = useState("• What: Cacat / deviasi material\n• Where: Line produksi " + area + "\n• When: Shift 1 On-Site Execution\n• Who: Operator & Supervisor Line\n• Which: Lot produksi aktif");
  const [targetSetting, setTargetSetting] = useState("• Target Cacat: 0% Defect Rate\n• SLA Perbaikan: 100% On-Time Implementation");
  const [fishboneData, setFishboneData] = useState("• Man: Kompetensi operator\n• Machine: Kalibrasi instrumen\n• Method: Kepatuhan SOS\n• Material: Toleransi dimensi\n• Env: Housekeeping 6S");
  const [rootCause5Why, setRootCause5Why] = useState(aiRootCause || findingDescription || "");
  const [actionPlan, setActionPlan] = useState("");
  const [evaluationResults, setEvaluationResults] = useState("• Hasil Evaluasi: Parameter operasi kembali normal\n• Dampak: Produktivitas meningkat 15%");
  const [standardizationSOP, setStandardizationSOP] = useState("• Pembaruan SOS / WI Standard Operating Sheet No. " + area + "-SOP-01");
  
  const [beforePhotoUrl, setBeforePhotoUrl] = useState("");
  const [afterPhotoUrl, setAfterPhotoUrl] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  
  // Compression & Upload loading states
  const [isCompressingBefore, setIsCompressingBefore] = useState(false);
  const [isCompressingAfter, setIsCompressingAfter] = useState(false);
  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch existing Kaizen data if available
  useEffect(() => {
    async function loadExistingKaizen() {
      try {
        const res = await fetch(`/api/kaizen?findingId=${findingId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const k = json.data;
          if (k.problemSituation) setProblemSituation(k.problemSituation);
          if (k.breakdown4H1W) setBreakdown4H1W(k.breakdown4H1W);
          if (k.targetSetting) setTargetSetting(k.targetSetting);
          if (k.fishboneData) setFishboneData(k.fishboneData);
          if (k.rootCause5Why) setRootCause5Why(k.rootCause5Why);
          if (k.actionPlan) setActionPlan(k.actionPlan);
          if (k.evaluationResults) setEvaluationResults(k.evaluationResults);
          if (k.standardizationSOP) setStandardizationSOP(k.standardizationSOP);
          if (k.beforePhotoUrl) setBeforePhotoUrl(k.beforePhotoUrl);
          if (k.afterPhotoUrl) setAfterPhotoUrl(k.afterPhotoUrl);
        }
      } catch (err) {
        console.error("Load existing kaizen error:", err);
      }
    }
    loadExistingKaizen();
  }, [findingId]);

  // AI Action Plan Generator for Step 5 (Countermeasure / Action Plan)
  async function handleGenerateAiActionPlan() {
    setIsGeneratingAi(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: problemSituation || findingDescription,
          area,
          severity: "High",
        }),
      });

      const json = await res.json();
      if (json.success && json.actionPlan) {
        setActionPlan(json.actionPlan);
        setSuccessMsg("Rencana aksi CAPA berhasil digenerate oleh Gemini AI! ✨");
      } else {
        setErrorMsg(json.error || "Gagal menggenerate action plan.");
      }
    } catch (err) {
      console.error("Generate AI Action Plan error:", err);
      setErrorMsg("Terjadi kesalahan koneksi AI.");
    } finally {
      setIsGeneratingAi(false);
    }
  }

  // Interceptor function for client-side image compression & upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, isBefore: boolean) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setErrorMsg("");

    // 1. Set compression loading state
    if (isBefore) setIsCompressingBefore(true);
    else setIsCompressingAfter(true);

    try {
      // 2. Client-side compression options: max 1 MB, max resolution 1920x1080
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(rawFile, compressionOptions);

      // Done compressing -> set upload loading state
      if (isBefore) {
        setIsCompressingBefore(false);
        setIsUploadingBefore(true);
      } else {
        setIsCompressingAfter(false);
        setIsUploadingAfter(true);
      }

      // 3. Upload compressed file to storage/server
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(rawFile.name)}`, {
        method: "POST",
        body: compressedFile,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        if (isBefore) setBeforePhotoUrl(data.url);
        else setAfterPhotoUrl(data.url);
      } else {
        setErrorMsg(data.error || "Gagal mengunggah foto.");
      }
    } catch (err) {
      console.error("File compression/upload error:", err);
      setErrorMsg("Gagal mengompresi atau mengunggah file foto.");
    } finally {
      if (isBefore) {
        setIsCompressingBefore(false);
        setIsUploadingBefore(false);
      } else {
        setIsCompressingAfter(false);
        setIsUploadingAfter(false);
      }
      e.target.value = "";
    }
  }

  // Save Kaizen 8 Steps Form
  async function handleSaveKaizen(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/kaizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findingId,
          problemSituation,
          breakdown4H1W,
          targetSetting,
          fishboneData,
          rootCause5Why,
          actionPlan,
          evaluationResults,
          standardizationSOP,
          beforePhotoUrl,
          afterPhotoUrl,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Lembar Standar Operasional Kaizen 8 Langkah berhasil disimpan!");
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(json.error || "Gagal menyimpan Lembar Kaizen.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat menyimpan.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 border border-purple-200 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full text-purple-800 text-xs font-bold border border-purple-200 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span>Lembar Standar Operasional Kaizen 8 Langkah (PDCA)</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              Kelola Lembar Kaizen — Finding #{findingId} ({area})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveKaizen} className="space-y-6">
          {/* FOTO BEFORE - AFTER COMPARISON */}
          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
              GRAFIK & FOTO DOKUMENTASI BEFORE - AFTER (SEBELUM vs SESUDAH KAIZEN)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Foto Before */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Foto BEFORE (Sebelum Perbaikan)
                </label>
                {beforePhotoUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={beforePhotoUrl} alt="Before" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBeforePhotoUrl("")}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full text-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:bg-purple-50/30 transition-colors">
                    {isCompressingBefore ? (
                      <>
                        <Loader2 className="w-6 h-6 text-purple-600 mb-1 animate-spin" />
                        <span className="text-xs font-bold text-purple-800">
                          Sedang mengompresi foto...
                        </span>
                      </>
                    ) : isUploadingBefore ? (
                      <>
                        <Loader2 className="w-6 h-6 text-purple-600 mb-1 animate-spin" />
                        <span className="text-xs font-bold text-purple-800">
                          Mengunggah...
                        </span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-purple-600 mb-1" />
                        <span className="text-xs font-bold text-purple-800">
                          + Upload Foto BEFORE
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Otomatis dikompres &lt; 1MB (Full HD)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      disabled={isCompressingBefore || isUploadingBefore}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Foto After */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Foto AFTER (Sesudah Perbaikan)
                </label>
                {afterPhotoUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAfterPhotoUrl("")}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full text-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50/30 transition-colors">
                    {isCompressingAfter ? (
                      <>
                        <Loader2 className="w-6 h-6 text-emerald-600 mb-1 animate-spin" />
                        <span className="text-xs font-bold text-emerald-800">
                          Sedang mengompresi foto...
                        </span>
                      </>
                    ) : isUploadingAfter ? (
                      <>
                        <Loader2 className="w-6 h-6 text-emerald-600 mb-1 animate-spin" />
                        <span className="text-xs font-bold text-emerald-800">
                          Mengunggah...
                        </span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-emerald-600 mb-1" />
                        <span className="text-xs font-bold text-emerald-800">
                          + Upload Foto AFTER
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Otomatis dikompres &lt; 1MB (Full HD)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      disabled={isCompressingAfter || isUploadingAfter}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* 8 LANGKAH KAIZEN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Langkah 1: Situasi Terkini (AUTO-POPULATED) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-purple-900 flex items-center justify-between">
                <span>Langkah 1: Situasi Terkini (Problem Situation) *</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-extrabold">Auto-Populated</span>
              </label>
              <textarea
                value={problemSituation}
                onChange={(e) => setProblemSituation(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 h-24 outline-none focus:border-purple-500"
                required
              />
            </div>

            {/* Langkah 2: Breakdown Masalah (4H1W) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Langkah 2: Breakdown Masalah (4H1W)
              </label>
              <textarea
                value={breakdown4H1W}
                onChange={(e) => setBreakdown4H1W(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 h-24 outline-none focus:border-purple-500"
              />
            </div>

            {/* Langkah 3: Penetapan Target */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Langkah 3: Penetapan Target (Target Setting)
              </label>
              <textarea
                value={targetSetting}
                onChange={(e) => setTargetSetting(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 h-24 outline-none focus:border-purple-500"
              />
            </div>

            {/* Langkah 4: Akar Masalah & 5-Why (AUTO-POPULATED) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-purple-900 flex items-center justify-between">
                <span>Langkah 4: Analisis Akar Masalah (5-Why & Fishbone) *</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-extrabold">Auto-Populated</span>
              </label>
              <textarea
                value={rootCause5Why}
                onChange={(e) => setRootCause5Why(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 h-24 outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          {/* Langkah 5: Countermeasure / Action Plan (WITH AI GENERATOR BUTTON) */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200 pb-2">
              <label className="text-xs font-extrabold text-purple-900 uppercase tracking-wider block">
                Langkah 5: Rencana Penanggulangan (Countermeasure / Action Plan CAPA)
              </label>

              {/* AI GENERATE ACTION PLAN BUTTON */}
              <button
                type="button"
                onClick={handleGenerateAiActionPlan}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>{isGeneratingAi ? "Menganalisis AI..." : "✨ Generate Action Plan dengan AI"}</span>
              </button>
            </div>

            <textarea
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder="Rencana tindakan Jangka Pendek (Containment) & Jangka Panjang (Preventive) beserta SLA..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 h-28 outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Langkah 6 & 7: Evaluasi Hasil & Dampak */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Langkah 6 & 7: Evaluasi Hasil & Dampak
              </label>
              <textarea
                value={evaluationResults}
                onChange={(e) => setEvaluationResults(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 h-24 outline-none focus:border-purple-500"
              />
            </div>

            {/* Langkah 8: Standardisasi SOP */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Langkah 8: Standardisasi & Pembaruan SOP
              </label>
              <textarea
                value={standardizationSOP}
                onChange={(e) => setStandardizationSOP(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 h-24 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || isGeneratingAi || isCompressingBefore || isCompressingAfter || isUploadingBefore || isUploadingAfter}
              className="flex-1 py-3 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "Menyimpan Kaizen..." : "Simpan Lembar Kaizen 8 Langkah"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KaizenPdcaModal;
