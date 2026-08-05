// File: src/lib/dateUtils.ts

/**
 * Formats a Date object or YYYY-MM-DD / ISO date string to Indonesian date format (e.g., "5 Agustus 2026")
 */
export function formatIndonesianDate(date: Date | string | undefined | null): string {
  if (!date) return "-";

  const monthsIndonesian = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  if (date instanceof Date) {
    if (isNaN(date.getTime())) return "-";
    const day = date.getDate();
    const month = monthsIndonesian[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  const dateStr = String(date).trim();
  if (!dateStr) return "-";

  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      if (!isNaN(year) && !isNaN(monthIndex) && !isNaN(day) && monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${monthsIndonesian[monthIndex]} ${year}`;
      }
    }

    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      const day = parsedDate.getDate();
      const month = monthsIndonesian[parsedDate.getMonth()];
      const year = parsedDate.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch {
    // fallback
  }

  return dateStr;
}

export function matchesMonthTimeline(dateStr: string | undefined | null, monthFilter: string): boolean {
  if (!monthFilter || monthFilter === "All") return true;
  if (!dateStr) return true;

  const monthMap: Record<string, number> = {
    agustus: 8,
    september: 9,
    oktober: 10,
  };

  const targetMonthNum = monthMap[monthFilter.toLowerCase()];
  if (!targetMonthNum) return true;

  try {
    const parts = String(dateStr).split("T")[0].split("-");
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      return month === targetMonthNum;
    }
  } catch {
    // fallback
  }

  return true;
}
