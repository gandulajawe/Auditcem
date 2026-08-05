"use client";

import { Scissors, Layers, Flame, Filter, Info } from "lucide-react";

export type AreaType = "All" | "Cutting" | "Prep" | "CSC";

interface AuditAreaScopeProps {
  selectedArea: AreaType;
  onSelectArea: (area: AreaType) => void;
  reportCounts: {
    Cutting: number;
    Prep: number;
    CSC: number;
    All: number;
  };
}

export function AuditAreaScope({ selectedArea, onSelectArea, reportCounts }: AuditAreaScopeProps) {
  const areas = [
    {
      id: "Cutting" as AreaType,
      name: "Cutting Area",
      code: "CUT",
      icon: Scissors,
      desc: "Pemotongan bahan sintetis, kulit & textile upper, die stamping, dan pengecekan cacat material.",
      color: "bg-indigo-600 text-white",
      activeBg: "bg-indigo-50/80 border-indigo-500 shadow-md ring-2 ring-indigo-500/20",
      badge: "bg-indigo-100 text-indigo-700",
      hoverBorder: "hover:border-indigo-300",
    },
    {
      id: "Prep" as AreaType,
      name: "Prep Area",
      code: "PREP",
      icon: Layers,
      desc: "Persiapan upper, skiving (penipisan pinggir kulit), stitching prep, slating, printing & embossing.",
      color: "bg-purple-600 text-white",
      activeBg: "bg-purple-50/80 border-purple-500 shadow-md ring-2 ring-purple-500/20",
      badge: "bg-purple-100 text-purple-700",
      hoverBorder: "hover:border-purple-300",
    },
    {
      id: "CSC" as AreaType,
      name: "CSC Area",
      code: "CSC",
      icon: Flame,
      desc: "Cold Cement Sole / Assembly, lasting upper, pengolesan primer/lem, cementing sole & final QC.",
      color: "bg-amber-600 text-white",
      activeBg: "bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-500/20",
      badge: "bg-amber-100 text-amber-700",
      hoverBorder: "hover:border-amber-300",
    },
  ];

  return (
    <section className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4 transition-all hover:shadow-md">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase block">
            Cakupan Area Audit
          </span>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Audit Scope Areas (Pabrik Sepatu)
          </h2>
        </div>

        {/* Filter All reset button */}
        <button
          onClick={() => onSelectArea("All")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedArea === "All"
              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Tampilkan Semua Area ({reportCounts.All} Laporan)</span>
        </button>
      </div>

      {/* Area Cards / Chips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {areas.map((area) => {
          const Icon = area.icon;
          const isSelected = selectedArea === area.id;
          const count = reportCounts[area.id] || 0;

          return (
            <div
              key={area.id}
              onClick={() => onSelectArea(area.id)}
              className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer border ${
                isSelected
                  ? area.activeBg
                  : `border-slate-200/80 bg-white/90 hover:bg-white ${area.hoverBorder} hover:shadow-sm`
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl shadow-xs transition-transform group-hover:scale-105 ${area.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider">
                      CODE: {area.code}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                      {area.name}
                    </h3>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${area.badge}`}
                >
                  {count} Temuan
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {area.desc}
              </p>

              <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-semibold text-indigo-600">
                <span>{isSelected ? "✓ Area Aktif Filter" : "Klik untuk filter"}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Scope Indicator info */}
      {selectedArea !== "All" && (
        <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>
              Filter aktif: Memfilter tampilan checklist & laporan audit untuk <strong>Area {selectedArea}</strong>.
            </span>
          </div>
          <button
            onClick={() => onSelectArea("All")}
            className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            Bersihkan Filter
          </button>
        </div>
      )}
    </section>
  );
}

export default AuditAreaScope;
