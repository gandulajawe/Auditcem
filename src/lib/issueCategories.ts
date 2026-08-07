// File: src/lib/issueCategories.ts
// Taksonomi kategori masalah — dipakai bersama oleh:
// 1. Form Audit Report Builder (dropdown manual)
// 2. AI CAPA Analyzer (auto-suggest kategori dari deskripsi temuan)
// 3. Modul Analitik Pareto 80/20 (pengelompokan & perhitungan)
//
// Daftar ini sengaja generik lintas-domain (bukan spesifik MQAA/6S/HSE/dst)
// supaya distribusi Pareto tetap bisa dibandingkan antar domain.

export const ISSUE_CATEGORIES = [
  "Kebersihan & Housekeeping",
  "APD & Keselamatan Kerja",
  "Dokumentasi & SOP",
  "Kondisi Mesin & Peralatan",
  "Material & WIP",
  "Skill & Kompetensi Operator",
  "Visual Control & Labeling",
  "Lainnya",
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

const KEYWORD_MAP: Array<{ category: IssueCategory; keywords: string[] }> = [
  {
    category: "Kebersihan & Housekeeping",
    keywords: ["kotor", "sampah", "debu", "tumpah", "bersih", "housekeeping", "sisa material", "scrap berserakan"],
  },
  {
    category: "APD & Keselamatan Kerja",
    keywords: ["apd", "helm", "sarung tangan", "safety shoes", "kacamata", "masker", "k3", "kecelakaan", "cedera", "bahaya", "unsafe"],
  },
  {
    category: "Dokumentasi & SOP",
    keywords: ["sop", "dokumen", "checklist", "rekam", "record", "form", "prosedur", "instruksi kerja", "expired", "kadaluarsa"],
  },
  {
    category: "Kondisi Mesin & Peralatan",
    keywords: ["mesin", "pisau", "die", "oven", "suhu", "kalibrasi", "maintenance", "rusak", "aus", "tumpul", "jig", "sensor"],
  },
  {
    category: "Material & WIP",
    keywords: ["material", "bahan baku", "wip", "kulit", "lem", "cacat produk", "reject", "viskositas", "cement"],
  },
  {
    category: "Skill & Kompetensi Operator",
    keywords: ["operator", "training", "pelatihan", "belum paham", "kompetensi", "kesalahan kerja", "human error"],
  },
  {
    category: "Visual Control & Labeling",
    keywords: ["label", "visual management", "andon", "penandaan", "marka", "signage", "warna identifikasi"],
  },
];

/**
 * Menebak kategori masalah dari teks deskripsi temuan secara sederhana
 * berbasis kata kunci. Dipakai sebagai fallback rule-engine ketika AI
 * tidak tersedia, dan sebagai referensi silang untuk validasi hasil AI.
 */
export function suggestIssueCategory(text: string): IssueCategory {
  const lower = (text || "").toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.category;
    }
  }
  return "Lainnya";
}
