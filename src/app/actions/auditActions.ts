// File: src/app/actions/auditActions.ts
"use server";

import { db } from "@/db";
import { audits, auditFindings, auditLogs } from "@/db/schema";
import { GoogleGenAI } from "@google/genai";
import { sanitizeInput } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

export interface FindingInputItem {
  findingDescription: string;
  isKaizenEscalated?: boolean;
}

export interface CreateAuditInput {
  area: string;
  lineNumber: string;
  findings: FindingInputItem[];
}

export interface AIFindingAnalysis {
  findingDescription: string;
  rootCause: string;
  capaRecommendation: string;
  isKaizenEscalated?: boolean;
}

export interface CreateAuditResult {
  success: boolean;
  auditId?: number;
  message?: string;
  error?: string;
  analysisResults?: AIFindingAnalysis[];
}

/**
 * Server Action to process audit findings array with Gemini AI (JSON Array prompt),
 * save Header to `audits` table, and loop-save detail results to `audit_findings` table.
 */
export async function processAndSaveAuditAction(
  input: CreateAuditInput
): Promise<CreateAuditResult> {
  try {
    const area = sanitizeInput(input.area || "Cutting");
    const lineNumber = sanitizeInput(input.lineNumber || "Line 01");
    const rawFindings = Array.isArray(input.findings) ? input.findings : [];

    const validFindings = rawFindings
      .map((f) => ({
        findingDescription: sanitizeInput(f.findingDescription || "").trim(),
        isKaizenEscalated: Boolean(f.isKaizenEscalated),
      }))
      .filter((f) => f.findingDescription.length > 0);

    if (!lineNumber) {
      return { success: false, error: "Line / Nomor Mesin wajib diisi." };
    }

    if (validFindings.length === 0) {
      return { success: false, error: "Minimal 1 deskripsi temuan lapangan wajib diisi." };
    }

    const findingDescriptions = validFindings.map((f) => f.findingDescription);
    let aiAnalysisList: AIFindingAnalysis[] = [];

    // 1. AI Prompting with Google Gemini (@google/genai SDK)
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemPrompt = `Anda adalah Chief Quality & Safety Auditor di pabrik manufaktur sepatu internasional (CEM Footwear Plant).
Analisislah daftar temuan lapangan berikut untuk Area "${area}" dan Line/Nomor Mesin "${lineNumber}".

Tugas & Instruksi Wajib:
1. Menerima array daftar deskripsi temuan lapangan: ${JSON.stringify(findingDescriptions)}
2. Dipaksa merespons HANYA dalam format JSON Array murni tanpa pembungkus markdown.
3. Setiap objek dalam JSON Array harus memiliki properti persis:
   - "findingDescription": string (deskripsi temuan asli untuk pencocokan)
   - "rootCause": string (analisis akar masalah mendalam metode 4M+1E)
   - "capaRecommendation": string (rencana aksi perbaikan Jangka Pendek/Containment & Jangka Panjang/Systemic beserta SLA)

Contoh struktur JSON Array yang WAJIB dipatuhi:
[
  {
    "findingDescription": "Deskripsi temuan...",
    "rootCause": "Akar masalah 4M+1E...",
    "capaRecommendation": "Rencana aksi perbaikan..."
  }
]`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: systemPrompt,
        });

        if (response && response.text) {
          const text = response.text.trim();
          const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);

          if (Array.isArray(parsed)) {
            aiAnalysisList = parsed.map((item, idx) => ({
              findingDescription: String(item.findingDescription || validFindings[idx]?.findingDescription || ""),
              rootCause: String(item.rootCause || item.root_cause || ""),
              capaRecommendation: String(item.capaRecommendation || item.capa_recommendation || item.actionPlan || ""),
              isKaizenEscalated: validFindings[idx]?.isKaizenEscalated || false,
            }));
          }
        }
      } catch (geminiError) {
        console.error("Gemini Server Action call failed, using fallback engine:", geminiError);
      }
    }

    // 2. Fallback AI Rule Engine if GEMINI_API_KEY is not configured or fails
    if (aiAnalysisList.length === 0) {
      aiAnalysisList = validFindings.map((fItem) => {
        const desc = fItem.findingDescription;
        const lower = desc.toLowerCase();
        let rootCause = `[Akar Masalah - 4M+1E]: Terjadi deviasi parameter operasional pada ${lineNumber} di area ${area}. Pemicu utama adalah variabilitas metode operasional dan alat ukur yang belum terkalibrasi.`;
        let capaRecommendation = `[1. JANGKA PENDEK / CONTAINMENT - SLA: <12 Jam]\n• Tindakan: Lakukan isolasi lot material terdampak dan kalibrasi ulang instrumen di ${lineNumber}.\n• Justifikasi: Mencegah perambatan defek ke proses berikutnya.\n\n[2. JANGKA PANJANG / PREVENTIVE - SLA: 1 Minggu]\n• Tindakan: Perbarui SOP Standard Operation Sheet (SOS) dan jadwalkan preventive maintenance berkala.`;

        if (lower.includes("suhu") || lower.includes("oven") || lower.includes("lem") || lower.includes("cement")) {
          rootCause = `[Akar Masalah - Machine/Material]: Residu uap solvent lem menumpuk pada heating element dan thermo-sensor mesin ${lineNumber} yang belum dikalibrasi selama >3 bulan.`;
          capaRecommendation = `[1. JANGKA PENDEK / CONTAINMENT - SLA: <12 Jam]\n• Tindakan: Pembersihan kerak elemen pemanas oven dan penyesuaian suhu manual dengan digital pyrometer terkalibrasi.\n• Justifikasi: Fluktuasi suhu >5°C menggagalkan otoklaf resin polyurethane.\n\n[2. JANGKA PANJANG / PREVENTIVE - SLA: 7 Hari]\n• Tindakan: Instalasikan digital temperature controller otomatis terhubung alarm interlock dan wadah lem sealed dispenser.`;
        } else if (lower.includes("potong") || lower.includes("cutting") || lower.includes("pisau") || lower.includes("die")) {
          rootCause = `[Akar Masalah - Machine/Tool]: Keausan pisau die cutter dan ketidakrataan landasan cutting pad hidrolik pada ${lineNumber}.`;
          capaRecommendation = `[1. JANGKA PENDEK / CONTAINMENT - SLA: <12 Jam]\n• Tindakan: Perataan resurfacing cutting pad dan pengasahan/penggantian pisau die cutting tumpul.\n• Justifikasi: Mencegah serat bersabut (ragged edges) pada upper sepatu.\n\n[2. JANGKA PANJANG / PREVENTIVE - SLA: 1 Minggu]\n• Tindakan: Terapkan kartu kontrol usia pakai pisau die-cutter otomatis setiap 5.000 siklus ketukan.`;
        } else if (lower.includes("6s") || lower.includes("kotor") || lower.includes("sampah")) {
          rootCause = `[Akar Masalah - Environment/System]: Belum ada zonasi red-tag area dan penampungan terpisah sisa bahan di ${lineNumber}.`;
          capaRecommendation = `[1. JANGKA PENDEK / CONTAINMENT - SLA: 24 Jam]\n• Tindakan: Lakukan pembersihan Red-Tag 30 menit dan penataan kontainer limbah berlabel warna.\n• Justifikasi: Mencegah kontaminasi silang oli/debu ke material upper.\n\n[2. JANGKA PANJANG / PREVENTIVE - SLA: 14 Hari]\n• Tindakan: Terapkan audit 6S mandiri 5-menit sebelum pergantian shift (Clean-as-you-go).`;
        }

        return {
          findingDescription: desc,
          rootCause,
          capaRecommendation,
          isKaizenEscalated: fItem.isKaizenEscalated,
        };
      });
    }

    // 3. Database Insertion:
    // a. Insert Header into `audits` table
    const [insertedAudit] = await db
      .insert(audits)
      .values({
        area,
        lineNumber,
      })
      .returning();

    const auditId = insertedAudit.id;

    // b. Loop & Insert detail results into `audit_findings` table
    const findingsToInsert = aiAnalysisList.map((item, idx) => ({
      auditId,
      findingDescription: item.findingDescription,
      aiRootCause: item.rootCause,
      aiCapa: item.capaRecommendation,
      isKaizenEscalated: validFindings[idx]?.isKaizenEscalated || false,
    }));

    await db.insert(auditFindings).values(findingsToInsert);

    // c. Audit Log Record
    await db.insert(auditLogs).values({
      action: "CREATE",
      entity: "AUDITS",
      entityId: auditId,
      details: `Saved Audit Header ID #${auditId} (${area} / ${lineNumber}) with ${findingsToInsert.length} detail findings`,
      performedBy: "Auditor CEM",
    });

    revalidatePath("/");

    return {
      success: true,
      auditId,
      message: `Audit #${auditId} (${area} - ${lineNumber}) berhasil disimpan ke database beserta ${findingsToInsert.length} analisis AI!`,
      analysisResults: aiAnalysisList,
    };
  } catch (error: any) {
    console.error("processAndSaveAuditAction Server Action Error:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan server saat memproses audit.",
    };
  }
}
