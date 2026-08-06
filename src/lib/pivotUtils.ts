// File: src/lib/pivotUtils.ts

export interface PivotRow {
  areaKey: "Cutting" | "Prep" | "CSC";
  areaLabel: string;
  months: Record<string, number>;
  totalFindings: number;
  fixed: number;
  open: number;
}

export interface PivotTotals {
  months: Record<string, number>;
  totalFindings: number;
  fixed: number;
  open: number;
}

export interface PivotChartItem {
  area: string;
  areaKey: string;
  total: number;
  [key: string]: string | number;
}

export interface PivotMatrixResult {
  rows: PivotRow[];
  totals: PivotTotals;
  chartData: PivotChartItem[];
  months: string[];
  isEmpty: boolean;
}

export const DEFAULT_MONTHS = ["Agustus", "September", "Oktober"];

export function getMonthNameFromDateOrMonth(dateOrMonthStr?: string | null): string {
  if (!dateOrMonthStr) return "Agustus";
  const str = String(dateOrMonthStr).trim();
  const lower = str.toLowerCase();

  if (lower.includes("agustus") || lower.includes("august")) return "Agustus";
  if (lower.includes("september")) return "September";
  if (lower.includes("oktober") || lower.includes("october")) return "Oktober";

  const parts = str.split("T")[0].split("-");
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10);
    if (m === 8) return "Agustus";
    if (m === 9) return "September";
    if (m === 10) return "Oktober";
    const monthNames = [
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
    if (m >= 1 && m <= 12) return monthNames[m - 1];
  }
  return "Agustus";
}

export function normalizeAreaName(areaStr?: string | null): { key: "Cutting" | "Prep" | "CSC"; label: string } {
  if (!areaStr) return { key: "Cutting", label: "Cutting Area" };
  const str = String(areaStr).toLowerCase();
  if (str.includes("cut")) return { key: "Cutting", label: "Cutting Area" };
  if (str.includes("prep")) return { key: "Prep", label: "Prep Area" };
  if (str.includes("csc") || str.includes("sole") || str.includes("cement")) return { key: "CSC", label: "CSC Area" };
  return { key: "Cutting", label: "Cutting Area" };
}

/**
 * Utility Pivot Transformer function:
 * Transforms raw audit findings into a Pivot Matrix (Rows, Columns, Totals, Chart Data).
 */
export function generatePivotData(
  findings: any[] = [],
  availableMonths: string[] = DEFAULT_MONTHS
): PivotMatrixResult {
  const areasConfig: Array<{ key: "Cutting" | "Prep" | "CSC"; label: string }> = [
    { key: "Cutting", label: "Cutting Area" },
    { key: "Prep", label: "Prep Area" },
    { key: "CSC", label: "CSC Area" },
  ];

  // Initialize Month buckets
  const monthSet = new Set<string>(availableMonths && availableMonths.length > 0 ? availableMonths : DEFAULT_MONTHS);

  // Scan findings for month names if any
  findings.forEach((r) => {
    const monthName = getMonthNameFromDateOrMonth(r.month || r.auditDate);
    monthSet.add(monthName);
  });

  const months = Array.from(monthSet);

  // Initialize Rows
  const rowsMap: Record<string, PivotRow> = {
    Cutting: {
      areaKey: "Cutting",
      areaLabel: "Cutting Area",
      months: months.reduce((acc, m) => ({ ...acc, [m]: 0 }), {}),
      totalFindings: 0,
      fixed: 0,
      open: 0,
    },
    Prep: {
      areaKey: "Prep",
      areaLabel: "Prep Area",
      months: months.reduce((acc, m) => ({ ...acc, [m]: 0 }), {}),
      totalFindings: 0,
      fixed: 0,
      open: 0,
    },
    CSC: {
      areaKey: "CSC",
      areaLabel: "CSC Area",
      months: months.reduce((acc, m) => ({ ...acc, [m]: 0 }), {}),
      totalFindings: 0,
      fixed: 0,
      open: 0,
    },
  };

  let totalItemsCount = 0;

  // Process findings / reports
  findings.forEach((rep) => {
    totalItemsCount++;
    const { key } = normalizeAreaName(rep.area);
    const monthName = getMonthNameFromDateOrMonth(rep.month || rep.auditDate);

    if (rowsMap[key]) {
      rowsMap[key].months[monthName] = (rowsMap[key].months[monthName] || 0) + 1;
      rowsMap[key].totalFindings += 1;

      const status = String(rep.status || "").toLowerCase();
      if (status === "resolved" || status === "selesai" || status === "closed") {
        rowsMap[key].fixed += 1;
      } else {
        rowsMap[key].open += 1;
      }
    }
  });

  const rows = areasConfig.map(({ key }) => rowsMap[key]);

  // Automatic Calculation for TOTAL Row at the bottom
  const totals: PivotTotals = {
    months: months.reduce((acc, m) => {
      const sum = rows.reduce((s, row) => s + (row.months[m] || 0), 0);
      return { ...acc, [m]: sum };
    }, {}),
    totalFindings: rows.reduce((sum, r) => sum + r.totalFindings, 0),
    fixed: rows.reduce((sum, r) => sum + r.fixed, 0),
    open: rows.reduce((sum, r) => sum + r.open, 0),
  };

  // Build Recharts Stacked Bar Chart data format
  const chartData: PivotChartItem[] = rows.map((row) => {
    const item: PivotChartItem = {
      area: row.areaLabel,
      areaKey: row.areaKey,
      total: row.totalFindings,
    };

    months.forEach((m) => {
      item[m] = row.months[m] || 0;
    });

    return item;
  });

  return {
    rows,
    totals,
    chartData,
    months,
    isEmpty: totalItemsCount === 0,
  };
}

/**
 * Alias for backward compatibility
 */
export function buildAuditPivotData(reports: any[] = [], checklists: any[] = []): PivotMatrixResult {
  const combined = [...(reports || []), ...(checklists || [])];
  return generatePivotData(combined);
}
