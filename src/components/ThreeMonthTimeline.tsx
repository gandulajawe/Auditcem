"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ArrowRight, Plus, Trash2, Calendar, Sparkles, Filter } from "lucide-react";
import { DomainBadge } from "./DomainBadge";
import { AreaType } from "./AuditAreaScope";

export interface ChecklistItem {
  id: number;
  month: string; // 'Agustus', 'September', 'Oktober'
  domain: string; // 'MQAA', '6S', 'Visual Management', 'HSE', 'PS'
  title: string;
  description?: string | null;
  area?: string | null;
  completed: boolean;
  isCustom: boolean;
}

interface ThreeMonthTimelineProps {
  checklists: ChecklistItem[];
  selectedAreaFilter: AreaType;
  onToggleChecklist: (id: number, currentStatus: boolean) => Promise<void>;
  onAddChecklist: (item: { month: string; domain: string; title: string; description: string; area: string }) => Promise<void>;
  onDeleteChecklist: (id: number) => Promise<void>;
}

export function ThreeMonthTimeline({
  checklists,
  selectedAreaFilter,
  onToggleChecklist,
  onAddChecklist,
  onDeleteChecklist,
}: ThreeMonthTimelineProps) {
  const [activeModalMonth, setActiveModalMonth] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDomain, setNewDomain] = useState("MQAA");
  const [newArea, setNewArea] = useState("All");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const months = [
    {
      name: "Agustus",
      monthLabel: "Bulan 4 (Fase Awal)",
      scopeTitle: "3 Checklist Utama",
      domains: ["MQAA", "6S", "Visual Management"],
      color: "from-[#6A0DAD]/10 to-[#A569BD]/10",
      borderColor: "border-[#6A0DAD]",
      badgeBg: "bg-[#6A0DAD] text-white",
    },
    {
      name: "September",
      monthLabel: "Bulan 5 (Fase Penyelarasan)",
      scopeTitle: "Custom / Manual Scope",
      domains: ["MQAA", "6S", "Visual Management"],
      color: "from-[#A569BD]/10 to-[#F7C6D9]/20",
      borderColor: "border-[#A569BD]",
      badgeBg: "bg-[#A569BD] text-white",
    },
    {
      name: "Oktober",
      monthLabel: "Bulan 6 (Full Scope Evaluation)",
      scopeTitle: "5 Domain Full Scope Audit",
      domains: ["MQAA", "6S", "Visual Management", "HSE", "PS"],
      color: "from-[#F7C6D9]/30 to-[#F2A7C6]/30",
      borderColor: "border-[#E082A8]",
      badgeBg: "bg-[#E082A8] text-white",
    },
  ];

  async function handleToggle(id: number, currentStatus: boolean) {
    try {
      setTogglingId(id);
      await onToggleChecklist(id, currentStatus);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreateChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!activeModalMonth || !newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddChecklist({
        month: activeModalMonth,
        domain: newDomain,
        title: newTitle.trim(),
        description: newDesc.trim(),
        area: newArea,
      });
      setNewTitle("");
      setNewDesc("");
      setActiveModalMonth(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#A569BD] tracking-wider uppercase">
            Garis Waktu Audit (3 Months Roadmap)
          </span>
          <h2 className="text-2xl font-black text-[#6A0DAD] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#A569BD]" />
            Timeline Executions: Months 4 - 6
          </h2>
        </div>
        <p className="text-xs text-gray-500 max-w-sm">
          Centang item checklist setelah berhasil dieksekusi di lapangan. Data akan tersimpan secara otomatis.
        </p>
      </div>

      {/* 3 Horizontal Columns connected with arrows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {months.map((m, idx) => {
          // Filter checklists by month and optional selected area
          const monthItems = checklists.filter((item) => {
            const matchesMonth = item.month === m.name;
            if (selectedAreaFilter === "All") return matchesMonth;
            return matchesMonth && (item.area === selectedAreaFilter || item.area === "All" || !item.area);
          });

          const completedCount = monthItems.filter((i) => i.completed).length;
          const monthPercentage = monthItems.length > 0 ? Math.round((completedCount / monthItems.length) * 100) : 0;

          return (
            <div key={m.name} className="relative flex flex-col">
              {/* Connecting Arrow for desktop */}
              {idx < 2 && (
                <div className="hidden lg:flex absolute -right-4 top-12 z-20 w-8 h-8 bg-white border border-[#F2A7C6] text-[#6A0DAD] rounded-full items-center justify-center shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}

              {/* Month Card */}
              <div className={`flex-1 bg-white rounded-3xl p-5 shadow-lg border-2 ${m.borderColor} flex flex-col justify-between space-y-4`}>
                {/* Card Header */}
                <div className="space-y-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${m.badgeBg}`}>
                      {m.name}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      {m.monthLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                      {m.scopeTitle}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.domains.map((dom) => (
                        <DomainBadge key={dom} domain={dom} size="sm" />
                      ))}
                    </div>
                  </div>

                  {/* Progress bar per month */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                      <span>Progres {m.name}</span>
                      <span className="font-bold text-[#6A0DAD]">{completedCount} / {monthItems.length} Selesai ({monthPercentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] rounded-full transition-all duration-300"
                        style={{ width: `${monthPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Checklist Items List */}
                <div className="flex-1 space-y-2.5 min-h-[180px]">
                  {monthItems.length === 0 ? (
                    <div className="p-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-1">
                      <p className="text-xs font-medium text-gray-500">
                        {selectedAreaFilter !== "All"
                          ? `Tidak ada checklist ${m.name} untuk area ${selectedAreaFilter}.`
                          : `Belum ada item checklist di ${m.name}.`}
                      </p>
                      <button
                        onClick={() => setActiveModalMonth(m.name)}
                        className="text-xs font-bold text-[#6A0DAD] hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3 h-3" /> Tambah Checklist {m.name}
                      </button>
                    </div>
                  ) : (
                    monthItems.map((item) => {
                      const isToggling = togglingId === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`group p-3 rounded-2xl border transition-all duration-200 space-y-2 ${
                            item.completed
                              ? "bg-purple-50/60 border-purple-200 shadow-sm"
                              : "bg-gray-50/80 border-gray-200 hover:border-[#A569BD] hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => handleToggle(item.id, item.completed)}
                              disabled={isToggling}
                              className="flex items-start gap-2.5 text-left cursor-pointer flex-1 group"
                            >
                              <div className="mt-0.5 shrink-0 transition-transform group-hover:scale-110">
                                {isToggling ? (
                                  <div className="w-5 h-5 border-2 border-[#6A0DAD] border-t-transparent rounded-full animate-spin" />
                                ) : item.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#6A0DAD] fill-[#F7C6D9]" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 group-hover:text-[#6A0DAD]" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p
                                  className={`text-xs font-bold leading-snug transition-colors ${
                                    item.completed
                                      ? "line-through text-purple-900/70"
                                      : "text-gray-900 group-hover:text-[#6A0DAD]"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                {item.description && (
                                  <p className="text-[11px] text-gray-500 font-medium line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              {item.isCustom && (
                                <button
                                  onClick={() => onDeleteChecklist(item.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Hapus checklist custom"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-gray-100/80 text-[10px]">
                            <DomainBadge domain={item.domain} size="sm" />
                            {item.area && item.area !== "All" && (
                              <span className="px-2 py-0.5 bg-[#F7C6D9] text-[#6A0DAD] font-extrabold rounded-md">
                                {item.area}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Item Button */}
                <button
                  onClick={() => {
                    setActiveModalMonth(m.name);
                    setNewDomain(m.domains[0] || "MQAA");
                  }}
                  className="w-full py-2.5 px-3 bg-[#FAF7FB] hover:bg-[#F7C6D9]/40 border border-dashed border-[#A569BD]/50 text-[#6A0DAD] font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Plus className="w-4 h-4 text-[#6A0DAD]" />
                  <span>Tambah Item Checklist {m.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Checklist Modal */}
      {activeModalMonth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#F7C6D9] shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-lg font-bold text-[#6A0DAD] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#A569BD]" />
                Tambah Checklist ({activeModalMonth})
              </h3>
              <button
                onClick={() => setActiveModalMonth(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChecklist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Domain Audit</label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD]"
                >
                  <option value="MQAA">MQAA (Manufacturing Quality Assurance Audit)</option>
                  <option value="6S">6S (Sort, Set, Shine, Standardize, Sustain, Safety)</option>
                  <option value="Visual Management">Visual Management</option>
                  <option value="HSE">HSE (Health, Safety & Environment)</option>
                  <option value="PS">PS (Process Standardization)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Target Area Audit</label>
                <select
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD]"
                >
                  <option value="All">Semua Area (All)</option>
                  <option value="Cutting">Cutting Area</option>
                  <option value="Prep">Prep Area</option>
                  <option value="CSC">CSC Area</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Judul Item Checklist</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Audit Kepatuhan SOP Cutting Leather..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Deskripsi / Detail Eksekusi (Opsional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Petunjuk spesifik pelaksanaan audit live..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD] h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalMonth(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#6A0DAD] hover:bg-[#580B90] rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Checklist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
