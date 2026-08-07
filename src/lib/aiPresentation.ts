// File: src/lib/aiPresentation.ts
import { GoogleGenAI } from "@google/genai";
import { sanitizeInput } from "@/lib/sanitize";
import { getGeminiModel } from "@/lib/geminiConfig";

export interface PresentationSlide {
  layout: "title" | "section" | "bullets" | "table" | "closing";
  title: string;
  subtitle?: string;
  bullets?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  notes?: string;
}

export interface PresentationOutline {
  deckTitle: string;
  deckSubtitle: string;
  slides: PresentationSlide[];
}

export type PresentationDataSource = "audit" | "kaizen" | "combined";

const PPT_SYSTEM_PROMPT = `Anda adalah Konsultan Manajemen Senior yang ahli menyusun deck presentasi eksekutif untuk hasil audit mutu & continuous improvement di pabrik manufaktur sepatu (CEM Footwear Manufacturing / The Audit Crucible).

Tugas Anda: ubah data mentah (laporan audit dan/atau lembar Kaizen PDCA) menjadi OUTLINE SLIDE presentasi PowerPoint yang ringkas, profesional, dan mudah dipahami manajemen.

Aturan penyusunan:
- Slide pertama WAJIB layout "title" berisi judul deck & subjudul (periode/cakupan data).
- Sisipkan slide "section" sebagai pembatas antar bagian besar (misal: Ringkasan Eksekutif, Temuan Audit, Kaizen PDCA, Rekomendasi).
- Slide isi memakai layout "bullets" (maksimum 5 bullet, tiap bullet singkat & padat, tanpa basa-basi) atau "table" (untuk data tabular ringkas, maksimum 5 baris x 4 kolom).
- Slide terakhir WAJIB layout "closing" berisi kesimpulan & rekomendasi tindak lanjut utama.
- Setiap slide sertakan "notes" singkat (catatan pembicara 1-2 kalimat).
- Total slide antara 6 sampai 12, jangan berlebihan.
- Gunakan Bahasa Indonesia formal-profesional.

Hasilkan HANYA output JSON murni tanpa markdown/pembungkus dengan format persis:
{
  "deckTitle": "string",
  "deckSubtitle": "string",
  "slides": [
    {
      "layout": "title|section|bullets|table|closing",
      "title": "string",
      "subtitle": "string (opsional)",
      "bullets": ["string", "..."] ,
      "tableHeaders": ["string", "..."],
      "tableRows": [["string", "..."]],
      "notes": "string"
    }
  ]
}`;

function buildRuleBasedOutline(params: {
  dataSource: PresentationDataSource;
  scopeLabel: string;
  auditSummary: string;
  kaizenSummary: string;
  auditCount: number;
  kaizenCount: number;
}): PresentationOutline {
  const { dataSource, scopeLabel, auditSummary, kaizenSummary, auditCount, kaizenCount } = params;

  const slides: PresentationSlide[] = [
    {
      layout: "title",
      title: "Laporan Presentasi Audit Crucible",
      subtitle: scopeLabel,
      notes: "Slide pembuka, sampaikan cakupan data yang disajikan.",
    },
    {
      layout: "section",
      title: "Ringkasan Eksekutif",
      notes: "Transisi ke ringkasan angka utama.",
    },
    {
      layout: "bullets",
      title: "Angka Kunci",
      bullets: [
        dataSource !== "kaizen" ? `Total Laporan Audit tercatat: ${auditCount}` : "",
        dataSource !== "audit" ? `Total Lembar Kaizen PDCA tercatat: ${kaizenCount}` : "",
        "Data diambil langsung dari basis data sistem The Audit Crucible.",
      ].filter(Boolean),
      notes: "Sampaikan jumlah data sebagai konteks awal.",
    },
  ];

  if (dataSource !== "kaizen") {
    slides.push(
      { layout: "section", title: "Temuan Audit", notes: "Transisi ke pembahasan temuan audit." },
      {
        layout: "bullets",
        title: "Ringkasan Temuan Audit",
        bullets: auditSummary
          ? auditSummary.split("\n").filter(Boolean).slice(0, 5)
          : ["Belum ada temuan audit signifikan pada cakupan data terpilih."],
        notes: "Bacakan poin-poin temuan audit utama.",
      }
    );
  }

  if (dataSource !== "audit") {
    slides.push(
      { layout: "section", title: "Kaizen PDCA", notes: "Transisi ke pembahasan continuous improvement." },
      {
        layout: "bullets",
        title: "Ringkasan Kaizen PDCA",
        bullets: kaizenSummary
          ? kaizenSummary.split("\n").filter(Boolean).slice(0, 5)
          : ["Belum ada lembar Kaizen PDCA signifikan pada cakupan data terpilih."],
        notes: "Bacakan poin-poin perbaikan berkelanjutan utama.",
      }
    );
  }

  slides.push({
    layout: "closing",
    title: "Kesimpulan & Rekomendasi",
    bullets: [
      "Lanjutkan pemantauan tindak lanjut Corrective & Preventive Action.",
      "Standarisasi hasil Kaizen PDCA ke SOP terkait.",
      "Jadwalkan audit lanjutan sesuai siklus berikutnya.",
    ],
    notes: "Tutup presentasi dengan rekomendasi tindak lanjut.",
  });

  return {
    deckTitle: "Laporan Presentasi Audit Crucible",
    deckSubtitle: scopeLabel,
    slides,
  };
}

export type GeminiCallStatus = "success" | "quota_exceeded" | "no_api_key" | "other_error" | "fallback_disabled";

export interface PresentationGenerationResult {
  outline: PresentationOutline;
  geminiStatus: GeminiCallStatus;
}

function isQuotaExceededError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number; code?: number })?.status ?? (err as { code?: number })?.code;
  return (
    status === 429 ||
    /RESOURCE_EXHAUSTED/i.test(message) ||
    /quota/i.test(message) ||
    /429/.test(message)
  );
}

export async function generatePresentationOutline(params: {
  dataSource: PresentationDataSource;
  scopeLabel: string;
  auditRecords: Record<string, unknown>[];
  kaizenRecords: Record<string, unknown>[];
}): Promise<PresentationGenerationResult> {
  const dataSource = params.dataSource;
  const scopeLabel = sanitizeInput(params.scopeLabel || "Seluruh Data");
  const auditRecords = params.auditRecords || [];
  const kaizenRecords = params.kaizenRecords || [];

  const auditSummary = auditRecords
    .slice(0, 20)
    .map(
      (r: any) =>
        `- [${r.area || "-"} / ${r.domain || "-"} / ${r.severity || "-"}] ${r.findingDescription || ""} | Root cause: ${r.rootCause || "-"} | Action: ${r.actionPlan || "-"}`
    )
    .join("\n");

  const kaizenSummary = kaizenRecords
    .slice(0, 20)
    .map(
      (r: any) =>
        `- Proyek: ${r.projectTitle || "(tanpa judul)"} | Masalah: ${r.problemSituation || "-"} | Akar masalah: ${r.rootCause5Why || "-"} | Rencana: ${r.actionPlan || "-"} | Standarisasi: ${r.standardizationSOP || "-"}`
    )
    .join("\n");

  const fallback = buildRuleBasedOutline({
    dataSource,
    scopeLabel,
    auditSummary,
    kaizenSummary,
    auditCount: auditRecords.length,
    kaizenCount: kaizenRecords.length,
  });

  if (!process.env.GEMINI_API_KEY) {
    return { outline: fallback, geminiStatus: "no_api_key" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const userPrompt = `Cakupan Data: ${scopeLabel}
Sumber Data: ${dataSource === "audit" ? "Laporan Audit" : dataSource === "kaizen" ? "Lembar Kaizen PDCA" : "Gabungan Laporan Audit + Kaizen PDCA"}

[DATA LAPORAN AUDIT] (${auditRecords.length} record, ditampilkan maksimal 20)
${dataSource !== "kaizen" ? (auditSummary || "Tidak ada data audit pada cakupan ini.") : "(tidak diikutsertakan)"}

[DATA LEMBAR KAIZEN PDCA] (${kaizenRecords.length} record, ditampilkan maksimal 20)
${dataSource !== "audit" ? (kaizenSummary || "Tidak ada data Kaizen pada cakupan ini.") : "(tidak diikutsertakan)"}`;

    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: `${PPT_SYSTEM_PROMPT}\n\n${userPrompt}`,
    });

    if (response && response.text) {
      const text = response.text.trim();
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        return {
          outline: {
            deckTitle: parsed.deckTitle || fallback.deckTitle,
            deckSubtitle: parsed.deckSubtitle || fallback.deckSubtitle,
            slides: parsed.slides,
          },
          geminiStatus: "success",
        };
      }
    }
  } catch (e) {
    if (isQuotaExceededError(e)) {
      console.error("Gemini quota exceeded, falling back to rule engine:", e);
      return { outline: fallback, geminiStatus: "quota_exceeded" };
    }
    console.error("Gemini presentation generation failed, falling back to rule engine:", e);
    return { outline: fallback, geminiStatus: "other_error" };
  }

  return { outline: fallback, geminiStatus: "fallback_disabled" };
}
