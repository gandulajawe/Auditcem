"use client";

import { ShieldAlert, LogOut, CheckCircle2, Factory, Award } from "lucide-react";

interface HeaderHeroProps {
  totalChecklists: number;
  completedChecklists: number;
  onLogout: () => void;
}

export function HeaderHero({ totalChecklists, completedChecklists, onLogout }: HeaderHeroProps) {
  const percentage = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  return (
    <header className="bg-gradient-to-r from-[#6A0DAD] via-[#7B1FA2] to-[#A569BD] text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-[#6A0DAD]/20 relative overflow-hidden border border-[#A569BD]/30">
      {/* Background Decorative Patterns */}
      <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 -mb-12 w-48 h-48 bg-[#F2A7C6]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top bar: Badge & Logout Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/30 shadow-sm">
              <Factory className="w-3.5 h-3.5 text-[#F7C6D9]" />
              Semangat Dul
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F2A7C6] text-[#6A0DAD] text-xs font-extrabold rounded-full shadow-sm">
              <Award className="w-3.5 h-3.5 text-[#6A0DAD]" />
              Gagal, coba lagi
            </span>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title="Keluar dari sesi auditor"
          >
            <LogOut className="w-3.5 h-3.5 text-[#F7C6D9]" />
            <span>Keluar Sesi</span>
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
              Dashboard audit Gandul
            </h1>
            <span className="px-3.5 py-1 bg-[#F7C6D9] text-[#6A0DAD] font-extrabold text-sm md:text-base rounded-2xl shadow-md border border-white/40">
              Months 4-6
            </span>
          </div>
          <p className="text-purple-100 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
            Buktikan di program ini kamu lebih bisa berkembang
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 flex items-center gap-3.5 shadow-inner">
          <div className="p-2.5 bg-[#F2A7C6] text-[#6A0DAD] rounded-xl shrink-0 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#F7C6D9] uppercase tracking-wider block">
              Instruksi Audit Live On-Site
            </span>
            <p className="text-sm font-semibold text-white">
              &quot;Live, on-site executions evaluated by expert auditors&quot;
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2.5">
          <div className="flex items-center justify-between text-xs md:text-sm font-semibold">
            <span className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-4 h-4 text-[#F7C6D9]" />
              Kemajuan Audit Keseluruhan (Audit Progress)
            </span>
            <span className="text-white font-extrabold bg-white/20 px-2.5 py-0.5 rounded-lg">
              {completedChecklists} / {totalChecklists} Checklist ({percentage}%)
            </span>
          </div>

          <div className="w-full h-3.5 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-[#F7C6D9] via-[#F2A7C6] to-white rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-purple-200 font-medium pt-0.5">
            <span>Fase 1: Agustus (MQAA, 6S, VM)</span>
            <span>Fase 2: September (Deep Dive)</span>
            <span>Fase 3: Oktober (Full Scope)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
