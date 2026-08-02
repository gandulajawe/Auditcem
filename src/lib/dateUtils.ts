/**
 * Formats YYYY-MM-DD or ISO date string to Indonesian date format (e.g., "12 Agustus 2026")
 */
export function formatIndonesianDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";

  // Handle YYYY-MM-DD or standard ISO dates
  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

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

      if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 0 && month < 12) {
        return `${day} ${monthsIndonesian[month]} ${year}`;
      }
    }

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    }
  } catch {
    // fallback
  }

  return dateStr;
}

/**
 * Checks if a YYYY-MM-DD date falls into a specific month name ("Agustus", "September", "Oktober")
 */
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
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      return month === targetMonthNum;
    }
  } catch {
    // fallback
  }

  return true;
}
