"use client";

import { useState } from "react";
import { Clock, Plus, CheckCircle2, AlertCircle, Edit3, Trash2, CalendarDays, Sparkles } from "lucide-react";

export interface WeeklyCadenceItem {
  id: number;
  weekNumber: number;
  title: string;
  area: string;
  mondayTasks: string;
  tuesdayTasks: string;
  wednesdayTasks: string;
  thursdayTasks: string;
  fridayTasks: string;
  mondayStatus: string;
  tuesdayStatus: string;
  wednesdayStatus: string;
  thursdayStatus: string;
  fridayStatus: string;
  notes?: string | null;
}

interface WeeklyCadenceSectionProps {
  cadences: WeeklyCadenceItem[];
  onAddWeek: (weekData: Partial<WeeklyCadenceItem>) => Promise<void>;
  onUpdateWeekStatus: (id: number, dayKey: string, nextStatus: string) => Promise<void>;
  onUpdateWeekDayTask: (id: number, dayTaskKey: string, taskValue: string, dayStatusKey: string, statusValue: string) => Promise<void>;
  onDeleteWeek: (id: number) => Promise<void>;
}

export function WeeklyCadenceSection({
  cadences,
  onAddWeek,
  onUpdateWeekStatus,
  onUpdateWeekDayTask,
  onDeleteWeek,
}: WeeklyCadenceSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWeekTab, setSelectedWeekTab] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Day Modal State
  const [editingDay, setEditingDay] = useState<{
    cadenceId: number;
    dayName: string;
    taskKey: string;
    statusKey: string;
    taskValue: string;
    statusValue: string;
  } | null>(null);

  // New week form state
  const nextWeekNum = cadences.length > 0 ? Math.max(...cadences.map((c) => c.weekNumber)) + 1 : 1;
  const [formData, setFormData] = useState({
    weekNumber: nextWeekNum,
    title: `Minggu ${nextWeekNum}: Ritme Eksekusi Audit`,
    area: "All",
    mondayTasks: "MQAA, 6S & Visual Management",
    tuesdayTasks: "HSE & Process Standardization",
    wednesdayTasks: "MQAA, 6S & Visual Management",
    thursdayTasks: "HSE & Process Standardization",
    fridayTasks: "Audit Report & Expert Review",
    notes: "",
  });

  const activeCadence = cadences.find((c) => c.weekNumber === selectedWeekTab) || cadences[0];

  const daysConfig = [
    { key: "monday", name: "Senin", taskKey: "mondayTasks", statusKey: "mondayStatus" },
    { key: "tuesday", name: "Selasa", taskKey: "tuesdayTasks", statusKey: "tuesdayStatus" },
    { key: "wednesday", name: "Rabu", taskKey: "wednesdayTasks", statusKey: "wednesdayStatus" },
    { key: "thursday", name: "Kamis", taskKey: "thursdayTasks", statusKey: "thursdayStatus" },
    { key: "friday", name: "Jumat", taskKey: "fridayTasks", statusKey: "fridayStatus" },
  ];

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return {
          label: "Selesai",
          bg: "bg-[#6A0DAD] text-white",
          icon: CheckCircle2,
          next: "pending",
        };
      case "in_progress":
        return {
          label: "Berjalan",
          bg: "bg-[#F2A7C6] text-[#6A0DAD]",
          icon: Clock,
          next: "completed",
        };
      default:
        return {
          label: "Pending",
          bg: "bg-gray-100 text-gray-600",
          icon: AlertCircle,
          next: "in_progress",
        };
    }
  }

  async function handleCycleStatus(cadenceId: number, dayKey: string, currentStatus: string) {
    const statusMap: Record<string, string> = {
      pending: "in_progress",
      in_progress: "completed",
      completed: "pending",
    };
    const next = statusMap[currentStatus] || "pending";
    await onUpdateWeekStatus(cadenceId, dayKey, next);
  }

  async function handleSaveDayEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDay) return;

    setIsSubmitting(true);
    try {
      await onUpdateWeekDayTask(
        editingDay.cadenceId,
        editingDay.taskKey,
        editingDay.taskValue,
        editingDay.statusKey,
        editingDay.statusValue
      );
      setEditingDay(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateWeek(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddWeek({
        ...formData,
        weekNumber: Number(formData.weekNumber),
      });
      setShowAddModal(false);
      setSelectedWeekTab(formData.weekNumber);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-md border border-[#F7C6D9] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#A569BD] tracking-wider uppercase">
            Ritme Mingguan (Weekly Cadence)
          </span>
          <h2 className="text-2xl font-black text-[#6A0DAD] flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#A569BD]" />
            Timeline 5 Hari Kerja (Senin - Jumat)
          </h2>
        </div>

        <button
          onClick={() => {
            const nextNum = cadences.length > 0 ? Math.max(...cadences.map((c) => c.weekNumber)) + 1 : 1;
            setFormData({
              weekNumber: nextNum,
              title: `Minggu ${nextNum}: Ritme Eksekusi Audit`,
              area: "All",
              mondayTasks: "MQAA, 6S, VM",
              tuesdayTasks: "HSE, PS",
              wednesdayTasks: "MQAA, 6S, VM",
              thursdayTasks: "HSE, PS",
              fridayTasks: "Audit Report & Review",
              notes: "",
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6A0DAD] to-[#A569BD] hover:from-[#580B90] hover:to-[#9455AC] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Minggu Baru</span>
        </button>
      </div>

      {/* Week Selector Tabs */}
      {cadences.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100">
          {cadences.map((cadence) => {
            const isActive = (activeCadence?.weekNumber || 1) === cadence.weekNumber;
            return (
              <button
                key={cadence.id}
                onClick={() => setSelectedWeekTab(cadence.weekNumber)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-[#6A0DAD] text-white shadow-md ring-2 ring-[#6A0DAD]/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>Minggu {cadence.weekNumber}</span>
                {cadence.area && cadence.area !== "All" && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? "bg-white/20 text-white" : "bg-[#F7C6D9] text-[#6A0DAD]"}`}>
                    {cadence.area}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Week Timeline Display */}
      {activeCadence ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF7FB] p-4 rounded-2xl border border-[#F2A7C6]/40">
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">
                {activeCadence.title}
              </h3>
              {activeCadence.notes && (
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Catatan: {activeCadence.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-[#F7C6D9] text-[#6A0DAD] rounded-full">
                Area: {activeCadence.area || "All"}
              </span>
              <button
                onClick={() => onDeleteWeek(activeCadence.id)}
                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Hapus Minggu Ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 5-Day Horizontal Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {daysConfig.map((day, idx) => {
              const taskText = (activeCadence as unknown as Record<string, string>)[day.taskKey] || "";
              const currentStatus = (activeCadence as unknown as Record<string, string>)[day.statusKey] || "pending";
              const badge = getStatusBadge(currentStatus);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={day.key}
                  className={`rounded-2xl p-4 border flex flex-col justify-between space-y-3 transition-all relative ${
                    currentStatus === "completed"
                      ? "bg-purple-50/70 border-purple-200"
                      : currentStatus === "in_progress"
                      ? "bg-[#F7C6D9]/20 border-[#F2A7C6]"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#6A0DAD] uppercase tracking-wider">
                        {day.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        H-{idx + 1}
                      </span>
                    </div>

                    <p className="text-xs font-extrabold text-gray-800 leading-snug">
                      {taskText}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => handleCycleStatus(activeCadence.id, day.statusKey, currentStatus)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${badge.bg}`}
                      title="Klik untuk ubah status cepat"
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </button>

                    {/* FIXED "KLIK UBAH" BUTTON */}
                    <button
                      onClick={() =>
                        setEditingDay({
                          cadenceId: activeCadence.id,
                          dayName: day.name,
                          taskKey: day.taskKey,
                          statusKey: day.statusKey,
                          taskValue: taskText,
                          statusValue: currentStatus,
                        })
                      }
                      className="text-[10px] text-[#6A0DAD] hover:text-[#580B90] font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                      title={`Edit tugas & status untuk hari ${day.name}`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Klik ubah</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed text-gray-400 text-xs">
          Belum ada data ritme mingguan. Silakan klik tombol &quot;Tambah Minggu Baru&quot;.
        </div>
      )}

      {/* EDIT DAY MODAL */}
      {editingDay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#F7C6D9] shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-lg font-bold text-[#6A0DAD] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#A569BD]" />
                Edit Aktivitas Hari {editingDay.dayName}
              </h3>
              <button
                onClick={() => setEditingDay(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDayEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Judul Aktivitas / Task Hari {editingDay.dayName}</label>
                <input
                  type="text"
                  value={editingDay.taskValue}
                  onChange={(e) => setEditingDay({ ...editingDay, taskValue: e.target.value })}
                  placeholder="Contoh: MQAA: Audit Presisi Die Cutting..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Status Hari {editingDay.dayName}</label>
                <select
                  value={editingDay.statusValue}
                  onChange={(e) => setEditingDay({ ...editingDay, statusValue: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#6A0DAD]"
                >
                  <option value="pending">Pending (Belum Diaksekusi)</option>
                  <option value="in_progress">Berjalan (In Progress)</option>
                  <option value="completed">Selesai (Completed)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#6A0DAD] hover:bg-[#580B90] rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Week Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#F7C6D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="text-lg font-bold text-[#6A0DAD] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#A569BD]" />
                Tambah Schedule Minggu Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWeek} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nomor Minggu</label>
                  <input
                    type="number"
                    value={formData.weekNumber}
                    onChange={(e) => setFormData({ ...formData, weekNumber: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Area Fokus</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                  >
                    <option value="All">Semua Area (All)</option>
                    <option value="Cutting">Cutting Area</option>
                    <option value="Prep">Prep Area</option>
                    <option value="CSC">CSC Area</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Judul Minggu</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Minggu 3: Full Scope HSE & PS Inspection"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#6A0DAD]"
                  required
                />
              </div>

              {/* Tasks per day */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="text-xs font-bold text-[#6A0DAD] block">Aktivitas Harian (Senin - Jumat)</label>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-4 items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Senin:</span>
                    <input
                      type="text"
                      value={formData.mondayTasks}
                      onChange={(e) => setFormData({ ...formData, mondayTasks: e.target.value })}
                      className="col-span-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#6A0DAD]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Selasa:</span>
                    <input
                      type="text"
                      value={formData.tuesdayTasks}
                      onChange={(e) => setFormData({ ...formData, tuesdayTasks: e.target.value })}
                      className="col-span-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#6A0DAD]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Rabu:</span>
                    <input
                      type="text"
                      value={formData.wednesdayTasks}
                      onChange={(e) => setFormData({ ...formData, wednesdayTasks: e.target.value })}
                      className="col-span-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#6A0DAD]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Kamis:</span>
                    <input
                      type="text"
                      value={formData.thursdayTasks}
                      onChange={(e) => setFormData({ ...formData, thursdayTasks: e.target.value })}
                      className="col-span-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#6A0DAD]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Jumat:</span>
                    <input
                      type="text"
                      value={formData.fridayTasks}
                      onChange={(e) => setFormData({ ...formData, fridayTasks: e.target.value })}
                      className="col-span-3 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#6A0DAD]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Catatan Mingguan (Opsional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan atau highlight mingguan..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6A0DAD]"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#6A0DAD] hover:bg-[#580B90] rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Minggu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
