// File: src/components/DynamicAuditForm.tsx
"use client";

import React, { useState } from "react";
import { Plus, Trash2, Send, Sparkles, AlertCircle, CheckCircle2, Factory, Hash, Target, ShieldCheck, TrendingUp } from "lucide-react";
import { processAndSaveAuditAction, AIFindingAnalysis } from "@/app/actions/auditActions";

export interface FindingInput {
  id: string;
  findingDescription: string;
  isKaizenEscalated?: boolean;
}

export interface DynamicAuditFormData {
  area: string;
  lineNumber: string;
  findings: FindingInput[];
}

interface DynamicAuditFormProps {
  onSubmit?: (data: DynamicAuditFormData) => Promise<void>;
  onSubmitSuccess?: () => void;
}

export function DynamicAuditForm({ onSubmit, onSubmitSuccess }: DynamicAuditFormProps) {
  const [area, setArea] = useState<string>("Cutting");
  const [lineNumber, setLineNumber] = useState<string>("");
  const [findings, setFindings] = useState<FindingInput[]>([
    { id: "finding-1", findingDescription: "", isKaizenEscalated: false },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [lastAnalysisResults, setLastAnalysisResults] = useState<AIFindingAnalysis[] | null>(null);
  const [lastAuditInfo, setLastAuditInfo] = useState<{ id?: number; area: string; lineNumber: string } | null>(null);

  // Tambah baris temuan baru
  const handleAddFinding = () => {
    const newId = `finding-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setFindings((prev) => [...prev, { id: newId, findingDescription: "", isKaizenEscalated: false }]);
  };

  // Hapus baris temuan (selain temuan pertama)
  const handleRemoveFinding = (id: string) => {
    if (findings.length <= 1) return;
    setFindings((prev) => prev.filter((f) => f.id !== id));
  };

  // Update nilai deskripsi temuan
  const handleFindingChange = (id: string, value: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, findingDescription: value } : f))
    );
  };

  // Update toggle checkbox eskalasi kaizen
  const handleEscalationToggle = (id: string, checked: boolean) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isKaizenEscalated: checked } : f))
    );
  };

  // Submit form via Server Action or custom onSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLastAnalysisResults(null);

    if (!lineNumber.trim()) {
      setErrorMsg("Line / Nomor Mesin wajib diisi.");
      return;
    }

    const validFindings = findings.filter((f) => f.findingDescription.trim().length > 0);
    if (validFindings.length === 0) {
      setErrorMsg("Minimal satu deskripsi temuan lapangan wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      if (onSubmit) {
        await onSubmit({
          area,
          lineNumber: lineNumber.trim(),
          findings: validFindings,
        });
      }

      // Execute Server Action for Gemini AI analysis and database header + detail saving
      const result = await processAndSaveAuditAction({
        area,
        lineNumber: lineNumber.trim(),
        findings: validFindings.map((f) => ({
          findingDescription: f.findingDescription,
          isKaizenEscalated: f.isKaizenEscalated,
        })),
      });

      if (result.success) {
        setSuccessMsg(result.message || "Audit & temuan lapangan berhasil disimpan!");
        setLastAnalysisResults(result.analysisResults || null);
        setLastAuditInfo({
          id: result.auditId,
          area,
          lineNumber: lineNumber.trim(),
        });

        // Reset dynamic findings array & lineNumber input
        setFindings([{ id: `finding-${Date.now()}`, findingDescription: "", isKaizenEscalated: false }]);
        setLineNumber("");

        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        setErrorMsg(result.error || "Gagal menyimpan audit.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan server saat menyimpan audit.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6 transition-all hover:shadow-md">
      {/* Header Section */}
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full text-purple-700 text-xs font-semibold tracking-wide mb-2 border border-purple-200">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Server Action & Gemini AI Multi-Finding Form</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          Form Input Temuan Audit Lapangan (audits & audit_findings)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Input header area & nomor line/mesin, kemudian tambahkan beberapa temuan sekaligus. Sistem akan otomatis menjalankan prompt Gemini AI dan menyimpan relasi One-to-Many ke database.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BAGIAN HEADER FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
          {/* Input Area / Domain */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-purple-600" />
              Area / Domain Pabrik
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="Cutting">Cutting Area (Upper & Stamping)</option>
              <option value="Prep">Prep Area (Skiving & Stitching)</option>
              <option value="CSC">CSC Area (Cementing & Sole Assembly)</option>
              <option value="HSE">HSE & K3 Area</option>
              <option value="Quality">Quality & Lab Inspection</option>
            </select>
          </div>

          {/* Input Line / Nomor Mesin */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-purple-600" />
              Line / Nomor Mesin
            </label>
            <input
              type="text"
              value={lineNumber}
              onChange={(e) => setLineNumber(e.target.value)}
              placeholder="Contoh: Line 02, Mesin Clicker #4"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-2xs"
              required
            />
          </div>
        </div>

        {/* BAGIAN DETAIL FORM: TEMUAN LAPANGAN DINAMIS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Detail Temuan Lapangan ({findings.length} Item)
            </label>
            <span className="text-[11px] text-slate-400">
              Input deskripsi temuan secara spesifik
            </span>
          </div>

          <div className="space-y-3">
            {findings.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 transition-all hover:border-purple-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded-full inline-flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    Temuan #{index + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    {/* Checkbox Eskalasi Kaizen PDCA */}
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={Boolean(item.isKaizenEscalated)}
                        onChange={(e) => handleEscalationToggle(item.id, e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                      />
                      <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                      <span>Eskalasi ke Kaizen PDCA</span>
                    </label>

                    {/* Tombol Hapus di sebelah setiap baris temuan (kecuali temuan pertama) */}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFinding(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-rose-100"
                        title="Hapus baris temuan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={item.findingDescription}
                  onChange={(e) => handleFindingChange(item.id, e.target.value)}
                  placeholder={`Jelaskan temuan #${index + 1} di ${area} (${lineNumber || "Line Mesin"})...`}
                  className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 focus:bg-white transition-all h-20 resize-none"
                  required
                />
              </div>
            ))}
          </div>

          {/* Tombol "Tambah Temuan Lain" */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddFinding}
              className="w-full py-3 px-4 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-2xl border border-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs active:scale-99"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span>+ Tambah Temuan Lain</span>
            </button>
          </div>
        </div>

        {/* Submit Form Button */}
        <div className="pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? "Memproses AI & Menyimpan Database..." : "Simpan Audit & Analisis AI Gemini"}</span>
          </button>
        </div>
      </form>

      {/* HASIL ANALISIS AI GEMINI REKAPITULASI */}
      {lastAnalysisResults && lastAnalysisResults.length > 0 && lastAuditInfo && (
        <div className="mt-6 p-5 bg-slate-50 border border-purple-200 rounded-3xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-purple-200 pb-3">
            <div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                Hasil Analisis AI Gemini (Tabel audit_findings)
              </span>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 mt-0.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Audit #{lastAuditInfo.id} — Area {lastAuditInfo.area} ({lastAuditInfo.lineNumber})
              </h3>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 font-black text-xs rounded-full border border-purple-200">
              {lastAnalysisResults.length} Temuan Terproses
            </span>
          </div>

          <div className="space-y-4">
            {lastAnalysisResults.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-purple-700 text-white rounded-full inline-flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Deskripsi Temuan Lapangan
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {item.findingDescription}
                      </p>
                    </div>
                  </div>

                  {item.isKaizenEscalated && (
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-black rounded-full border border-purple-200 flex items-center gap-1 shrink-0">
                      <TrendingUp className="w-3 h-3 text-purple-600" />
                      Eskalasi Kaizen
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  {/* Akar Masalah */}
                  <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100 space-y-1">
                    <span className="text-[11px] font-extrabold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-purple-600" />
                      Akar Masalah (ai_root_cause)
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                      {item.rootCause}
                    </p>
                  </div>

                  {/* CAPA Recommendation */}
                  <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                      Rencana Aksi CAPA (ai_capa)
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                      {item.capaRecommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default DynamicAuditForm;
