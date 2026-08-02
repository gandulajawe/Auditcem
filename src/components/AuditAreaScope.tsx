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
      color: "bg-[#6A0DAD]",
      border: "border-[#6A0DAD]",
      badge: "bg-[#6A0DAD]/10 text-[#6A0DAD]",
      hoverBg: "hover:bg-[#6A0DAD]/5",
    },
    {
      id: "Prep" as AreaType,
      name: "Prep Area",
      code: "PREP",
      icon: Layers,
      desc: "Persiapan upper, skiving (penipisan pinggir kulit), stitching prep, slating, printing & embossing.",
      color: "bg-[#A569BD]",
      border: "border-[#A569BD]",
      badge: "bg-[#A569BD]/15 text-[#A569BD]",
      hoverBg: "hover:bg-[#A569BD]/5",
    },
    {
      id: "CSC" as AreaType,
      name: "CSC Area",
      code: "CSC",
      icon: Flame,
      desc: "Cold Cement Sole / Assembly, lasting upper, pengolesan primer/lem, cementing sole & final QC.",
      color: "bg-[#E082A8]",
      border: "border-[#E082A8]",
      badge: "bg-[#F7C6D9] text-[#6A0DAD]",
      hoverBg: "hover:bg-[#F7C6D9]/30",
    },
  ];

  return (
    <section className="bg-white rounded-3xl p-6 shadow-md border border-[#F7C6D9] space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#A569BD] tracking-wider uppercase">
            Cakupan Area Audit
          </span>
          <h2 className="text-xl font-bold text-[#6A0DAD] flex items-center gap-2">
            Audit Scope Areas (Pabrik Sepatu)
          </h2>
        </div>

        {/* Filter All reset button */}
        <button
          onClick={() => onSelectArea("All")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedArea === "All"
              ? "bg-[#6A0DAD] text-white shadow-md ring-2 ring-[#6A0DAD]/30"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border-2 ${
                isSelected
                  ? `${area.border} bg-[#F7C6D9]/20 shadow-md ring-2 ring-[#F2A7C6]/50`
                  : `border-gray-200 bg-white ${area.hoverBg} hover:border-[#A569BD]/50`
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl text-white shadow-sm transition-transform group-hover:scale-105 ${area.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 block tracking-wider">
                      TAG: {area.code}
                    </span>
                    <h3 className="font-bold text-gray-900 text-base group-hover:text-[#6A0DAD] transition-colors">
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

              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {area.desc}
              </p>

              <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-[11px] font-semibold text-[#A569BD]">
                <span>{isSelected ? "✓ Area Aktif Diganti" : "Klik untuk filter"}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Scope Indicator info */}
      {selectedArea !== "All" && (
        <div className="p-3 bg-[#FAF7FB] rounded-xl border border-[#F2A7C6]/50 text-xs text-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#6A0DAD]" />
            <span>
              Filter aktif: Memfilter tampilan checklist & laporan audit untuk <strong>Area {selectedArea}</strong>.
            </span>
          </div>
          <button
            onClick={() => onSelectArea("All")}
            className="text-xs font-bold text-[#6A0DAD] hover:underline"
          >
            Bersihkan Filter
          </button>
        </div>
      )}
    </section>
  );
}
