// File: src/lib/paretoUtils.ts
import { AuditReportItem } from "@/components/AuditReportBuilder";

export interface ParetoBar {
  category: string;
  count: number;
  cumulativePercent: number; // 0-100
  isVitalFew: boolean; // true jika termasuk kategori yang menyumbang hingga ~80% kumulatif
}

export interface ParetoResult {
  bars: ParetoBar[];
  totalFindings: number;
  uncategorizedCount: number; // laporan tanpa issueCategory (dikeluarkan dari hitungan bar)
  vitalFewCategories: string[];
  vitalFewShare: number; // persentase temuan yang disumbang vitalFewCategories
}

/**
 * Menghitung distribusi Pareto 80/20 dari sekumpulan audit_reports.
 * - Mengelompokkan berdasarkan `issueCategory`.
 * - Mengurutkan descending berdasarkan jumlah kemunculan.
 * - Menghitung persentase kumulatif.
 * - Menandai "vital few": kategori-kategori pertama yang totalnya
 *   baru MELEWATI 80% kumulatif (kategori penyeberang garis 80% tetap disertakan,
 *   sesuai konvensi Pareto standar).
 */
export function computeParetoAnalysis(reports: AuditReportItem[]): ParetoResult {
  const categorized = reports.filter((r) => r.issueCategory && r.issueCategory.trim().length > 0);
  const uncategorizedCount = reports.length - categorized.length;

  const counts: Record<string, number> = {};
  categorized.forEach((r) => {
    const key = r.issueCategory as string;
    counts[key] = (counts[key] || 0) + 1;
  });

  const totalFindings = categorized.length;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  let cumulative = 0;
  let crossedEighty = false;
  const vitalFewCategories: string[] = [];

  const bars: ParetoBar[] = sorted.map(([category, count]) => {
    cumulative += count;
    const cumulativePercent = totalFindings > 0 ? (cumulative / totalFindings) * 100 : 0;
    const isVitalFew = !crossedEighty;
    if (isVitalFew) vitalFewCategories.push(category);
    if (cumulativePercent >= 80) crossedEighty = true;

    return { category, count, cumulativePercent, isVitalFew };
  });

  const vitalFewShare = totalFindings > 0
    ? (vitalFewCategories.reduce((sum, cat) => sum + counts[cat], 0) / totalFindings) * 100
    : 0;

  return { bars, totalFindings, uncategorizedCount, vitalFewCategories, vitalFewShare };
}
