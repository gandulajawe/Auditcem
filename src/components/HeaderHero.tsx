"use client";

import { LogOut, CheckCircle2, Sparkles, Award, GraduationCap } from "lucide-react";

interface HeaderHeroProps {
  totalChecklists: number;
  completedChecklists: number;
  onLogout: () => void;
}

export function HeaderHero({ totalChecklists, completedChecklists, onLogout }: HeaderHeroProps) {
  const percentage = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  return (
    <header className="w-full bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 relative overflow-hidden transition-all hover:shadow-md">
      {/* Soft Background Radial Blurs */}
      <div className="absolute right-0 top-0 -mt-12 -mr-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 -mb-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top bar: Glassmorphism Badges & Logout Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50/90 backdrop-blur-md text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200/80 shadow-xs">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              LL Progress Report - Learning & Development
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-200 shadow-xs">
              <Award className="w-3.5 h-3.5 text-purple-600" />
              Certified Engineering Manager
            </span>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all active:scale-95 cursor-pointer"
            title="Keluar dari sesi auditor"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Keluar Sesi</span>
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">
              The Audit Crucible
            </h1>
            <span className="px-3.5 py-1 bg-indigo-600 text-white font-bold text-xs md:text-sm rounded-full shadow-sm">
              Months 4-6
            </span>
          </div>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl font-normal leading-relaxed">
            Program evaluasi intensif eksekusi langsung di lapangan pabrik sepatu yang dinilai secara riil oleh auditor ahli CEM.
          </p>
        </div>

        {/* Info Glassmorphism Banner */}
        <div className="bg-slate-50/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
              Instruksi Audit Live On-Site
            </span>
            <p className="text-sm font-semibold text-slate-700">
              &quot;Live, on-site executions evaluated by expert auditors&quot;
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-slate-50/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/70 space-y-2.5">
          <div className="flex items-center justify-between text-xs md:text-sm font-semibold">
            <span className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Kemajuan Audit Keseluruhan (Audit Progress)
            </span>
            <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
              {completedChecklists} / {totalChecklists} Checklist ({percentage}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-0.5">
            <span>Fase 1: Agustus (MQAA, 6S, VM)</span>
            <span>Fase 2: September (Deep Dive)</span>
            <span>Fase 3: Oktober (Full Scope)</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderHero;
