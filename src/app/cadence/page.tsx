// File: src/app/cadence/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, subWeeks, addDays, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Save, Edit2, CheckCircle2, AlertCircle, ArrowLeft, Sparkles, Clock, Check } from "lucide-react";
import Link from "next/link";
import { saveWeeklyCadenceAction } from "@/app/actions/cadenceActions";

interface DayAgenda {
  date: Date;
  dayNameIndo: string;
  dayKey: string; // 'monday', 'tuesday', etc.
  taskKey: string;
  agendaText: string;
  status: string;
}

export default function CadencePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // Start on Monday of current week
    const now = new Date();
    return startOfWeek(now, { weekStartsOn: 1 });
  });

  const [cadenceId, setCadenceId] = useState<number>(1);
  const [weekTitle, setWeekTitle] = useState("Weekly Audit Cadence");
  const [agendas, setAgendas] = useState<Record<string, string>>({
    monday: "MQAA: Audit Presisi Die Cutting",
    tuesday: "Review Hasil Audit Cutting",
    wednesday: "6S & VM: Penataan Rak Material",
    thursday: "HSE & PS: Verifikasi APD",
    friday: "MQAA, 6S & VM Evaluasi",
    saturday: "Review Quality Control",
    sunday: "Libur Operasional",
  });

  const [editingDayKey, setEditingDayKey] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch initial cadence from server API
  useEffect(() => {
    async function loadCadence() {
      try {
        const res = await fetch("/api/weekly");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const item = json.data[0];
          setCadenceId(item.id);
          setWeekTitle(item.title || "Weekly Audit Cadence");
          setAgendas({
            monday: item.mondayTasks || "MQAA Audit",
            tuesday: item.tuesdayTasks || "Review Audit",
            wednesday: item.wednesdayTasks || "6S & VM Audit",
            thursday: item.thursdayTasks || "HSE & PS Audit",
            friday: item.fridayTasks || "Audit Evaluasi",
            saturday: "Review Quality Control",
            sunday: "Libur Operasional",
          });
        }
      } catch (err) {
        console.error("Failed to load weekly cadence:", err);
      }
    }
    loadCadence();
  }, []);

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  // Generate 7 days for current week (Senin to Minggu)
  const weekDays: DayAgenda[] = [
    { date: currentWeekStart, dayNameIndo: "Senin", dayKey: "monday", taskKey: "mondayTasks", agendaText: agendas.monday, status: "completed" },
    { date: addDays(currentWeekStart, 1), dayNameIndo: "Selasa", dayKey: "tuesday", taskKey: "tuesdayTasks", agendaText: agendas.tuesday, status: "in_progress" },
    { date: addDays(currentWeekStart, 2), dayNameIndo: "Rabu", dayKey: "wednesday", taskKey: "wednesdayTasks", agendaText: agendas.wednesday, status: "pending" },
    { date: addDays(currentWeekStart, 3), dayNameIndo: "Kamis", dayKey: "thursday", taskKey: "thursdayTasks", agendaText: agendas.thursday, status: "pending" },
    { date: addDays(currentWeekStart, 4), dayNameIndo: "Jumat", dayKey: "friday", taskKey: "fridayTasks", agendaText: agendas.friday, status: "pending" },
    { date: addDays(currentWeekStart, 5), dayNameIndo: "Sabtu", dayKey: "saturday", taskKey: "saturdayTasks", agendaText: agendas.saturday, status: "pending" },
    { date: addDays(currentWeekStart, 6), dayNameIndo: "Minggu", dayKey: "sunday", taskKey: "sundayTasks", agendaText: agendas.sunday, status: "pending" },
  ];

  const handleStartInlineEdit = (dayKey: string, currentText: string) => {
    setEditingDayKey(dayKey);
    setEditingText(currentText);
  };

  const handleSaveInlineEdit = async (dayKey: string) => {
    if (!editingText.trim()) return;

    const updatedAgendas = { ...agendas, [dayKey]: editingText.trim() };
    setAgendas(updatedAgendas);
    setEditingDayKey(null);

    setIsSaving(true);
    setMessage(null);

    try {
      // Execute Server Action with revalidatePath
      const res = await saveWeeklyCadenceAction(cadenceId, {
        title: weekTitle,
        mondayTasks: updatedAgendas.monday,
        tuesdayTasks: updatedAgendas.tuesday,
        wednesdayTasks: updatedAgendas.wednesday,
        thursdayTasks: updatedAgendas.thursday,
        fridayTasks: updatedAgendas.friday,
      });

      if (res.success) {
        setMessage({ text: `Jadwal hari ${dayKey.toUpperCase()} berhasil diperbarui secara real-time! ✨`, type: "success" });
      } else {
        setMessage({ text: res.error || "Gagal menyimpan ke server.", type: "error" });
      }
    } catch {
      setMessage({ text: "Terjadi kesalahan jaringan.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const weekRangeFormatted = `${format(currentWeekStart, "d MMMM", { locale: idLocale })} - ${format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: idLocale })}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 p-4 md:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke App Grid</span>
          </Link>

          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Inline Editing & Server Action
          </span>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-700 text-xs font-semibold tracking-wide mb-2 border border-indigo-100">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Weekly Cadence Calendar</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800">
                Kalender Weekly Cadence (Senin - Minggu)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Jadwal audit harian berjalan real-time dengan dukungan inline editing & revalidatePath.
              </p>
            </div>

            {/* Week Arrow Navigation */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={handlePrevWeek}
                className="px-3 py-2 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title="Minggu Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">&lt; Minggu Sebelumnya</span>
              </button>

              <span className="px-3 py-1 text-xs font-extrabold text-indigo-800 whitespace-nowrap">
                {weekRangeFormatted}
              </span>

              <button
                onClick={handleNextWeek}
                className="px-3 py-2 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title="Minggu Berikutnya"
              >
                <span className="hidden sm:inline">Minggu Berikutnya &gt;</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`p-3.5 text-xs font-bold rounded-2xl flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* 7-DAY CALENDAR GRID WITH INLINE EDITING */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const isToday = isSameDay(day.date, new Date());
            const isEditing = editingDayKey === day.dayKey;

            return (
              <div
                key={day.dayKey}
                className={`rounded-2xl p-4 border flex flex-col justify-between min-h-[180px] transition-all relative ${
                  isToday
                    ? "bg-indigo-50/70 border-indigo-300 shadow-md ring-2 ring-indigo-500/20"
                    : "bg-white border-slate-200/80 hover:border-indigo-200 hover:shadow-sm"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-xs font-extrabold text-indigo-700 block">
                        {day.dayNameIndo}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {format(day.date, "d MMM", { locale: idLocale })}
                      </span>
                    </div>

                    {isToday && (
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase">
                        Hari Ini
                      </span>
                    )}
                  </div>

                  {/* INLINE EDIT FIELD OR TEXT */}
                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-indigo-400 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingDayKey(null)}
                          className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveInlineEdit(day.dayKey)}
                          disabled={isSaving}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Simpan</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group space-y-2 pt-1">
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {day.agendaText}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleStartInlineEdit(day.dayKey, day.agendaText)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 hover:underline cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Agenda</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">Status Agenda</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">
                    Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
