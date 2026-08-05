"use client";

import React, { useState } from "react";

// Struktur data untuk setiap slot hari
export interface ScheduleDay {
  id: string;
  dayName: string; // Senin, Selasa, dst.
  domains: string[]; // ['MQAA', '6S', 'Review']
}

// Struktur data untuk setiap Fase Mingguan
export interface WeeklyPhase {
  id: string;
  phaseTitle: string; // misal: "Week 1", "Week 2 - Finish"
  days: ScheduleDay[];
}

// Data awal (Default Schedule - dapat diubah manual lewat UI)
const initialSchedule: WeeklyPhase[] = [
  {
    id: "phase-1",
    phaseTitle: "Week 1",
    days: [
      { id: "p1-mon", dayName: "Mon", domains: ["MQAA"] },
      { id: "p1-tue", dayName: "Tue", domains: ["Review"] },
      { id: "p1-wed", dayName: "Wed", domains: ["6S", "VM"] },
      { id: "p1-thu", dayName: "Thu", domains: ["Review"] },
      { id: "p1-fri", dayName: "Fri", domains: ["MQAA", "6S", "VM"] },
    ],
  },
  {
    id: "phase-2",
    phaseTitle: "Week 2 - Finish",
    days: [
      { id: "p2-mon", dayName: "Mon", domains: ["MQAA", "6S", "VM"] },
      { id: "p2-tue", dayName: "Tue", domains: ["HSE", "PS"] },
      { id: "p2-wed", dayName: "Wed", domains: ["MQAA", "6S", "VM"] },
      { id: "p2-thu", dayName: "Thu", domains: ["HSE", "PS"] },
      { id: "p2-fri", dayName: "Fri", domains: ["Audit Repeat"] },
    ],
  },
];

export function WeeklyCadenceSection() {
  const [schedule, setSchedule] = useState<WeeklyPhase[]>(initialSchedule);
  const [editingSlot, setEditingSlot] = useState<{
    phaseId: string;
    dayId: string;
    dayName: string;
    domainsText: string;
  } | null>(null);

  // Fungsi menyimpan hasil edit hari
  const handleSaveDayEdit = () => {
    if (!editingSlot) return;

    const newDomains = editingSlot.domainsText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    setSchedule((prev) =>
      prev.map((phase) => {
        if (phase.id !== editingSlot.phaseId) return phase;
        return {
          ...phase,
          days: phase.days.map((day) =>
            day.id === editingSlot.dayId
              ? { ...day, domains: newDomains }
              : day
          ),
        };
      })
    );

    setEditingSlot(null);
  };

  // Warna badge otomatis berdasarkan tipe domain
  const getBadgeStyle = (domain: string) => {
    const d = domain.toUpperCase();
    if (d.includes("MQAA"))
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (d.includes("6S"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (d.includes("HSE") || d.includes("PS"))
      return "bg-amber-50 text-amber-700 border-amber-200";
    if (d.includes("REVIEW"))
      return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-purple-50 text-purple-700 border-purple-200";
  };

  return (
    <section id="weekly-cadence-section" className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8 transition-all hover:shadow-md">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 text-xs font-semibold tracking-wide mb-2 border border-indigo-100">
            <span>📅 Dynamic Schedule</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Weekly Audit Cadence
          </h2>
          <p className="text-sm text-slate-500">
            Klik slot hari apa saja untuk mengubah fokus domain audit secara fleksibel.
          </p>
        </div>
      </div>

      {/* Grid Fase Mingguan */}
      <div className="space-y-6">
        {schedule.map((phase) => (
          <div key={phase.id} className="space-y-3">
            {/* Judul Fase */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {phase.phaseTitle}
              </span>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>

            {/* Grid 5 Hari (Senin - Jumat) */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {phase.days.map((day) => (
                <div
                  key={day.id}
                  onClick={() =>
                    setEditingSlot({
                      phaseId: phase.id,
                      dayId: day.id,
                      dayName: day.dayName,
                      domainsText: day.domains.join(", "),
                    })
                  }
                  className="group relative cursor-pointer bg-slate-50/80 hover:bg-white p-4 rounded-2xl border border-slate-200/60 hover:border-indigo-300 shadow-none hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[100px]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">
                      {day.dayName}
                    </span>
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ✏️ Edit
                    </span>
                  </div>

                  {/* List Badge Domain */}
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {day.domains.length > 0 ? (
                      day.domains.map((domain, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${getBadgeStyle(
                            domain
                          )}`}
                        >
                          {domain}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Kosong
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDIT JADWAL */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Edit Fokus Hari ({editingSlot.dayName})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan domain audit yang akan dilakukan (pisahkan dengan tanda koma).
            </p>

            <label className="block text-xs font-medium text-slate-700 mb-1">
              Domain Audit / Agenda
            </label>
            <input
              type="text"
              value={editingSlot.domainsText}
              onChange={(e) =>
                setEditingSlot({ ...editingSlot, domainsText: e.target.value })
              }
              placeholder="Contoh: MQAA, 6S, HSE"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all mb-6 text-slate-800"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDayEdit}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all hover:shadow cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default WeeklyCadenceSection;
