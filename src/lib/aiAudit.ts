// File: src/lib/aiAudit.ts
import { GoogleGenAI } from "@google/genai";
import { sanitizeInput } from "@/lib/sanitize";
import { ISSUE_CATEGORIES, IssueCategory, suggestIssueCategory } from "@/lib/issueCategories";
import { getGeminiModel } from "@/lib/geminiConfig";

export interface ActionPlanRow {
  horizon: "Jangka Pendek" | "Jangka Panjang";
  category: "Corrective Action" | "Preventive Action";
  action: string;
  rationale: string;
  targetSla: string;
}

export interface AuditAnalysisResult {
  insightNote: string;
  actionPlanTable: ActionPlanRow[];
  actionPlan: string;
  issueCategory: IssueCategory;
  aiEngine: "gemini" | "openai" | "fallback";
}

// IMPORTANT: Root Cause is ALWAYS determined manually by the auditor in the form.
// The AI is a downstream consumer of that root cause — it must never invent or
// overwrite it. Its only job is to turn (title + manual root cause + severity +
// area + domain + description) into a concrete CAPA action plan.
export const AI_SYSTEM_PROMPT = `Anda adalah Chief Quality & Safety Auditor senior berpengalaman di industri manufaktur sepatu (CEM Footwear Manufacturing).

Auditor SUDAH menentukan Root Cause (akar masalah) secara manual berdasarkan investigasi lapangan — root cause tersebut diberikan di bawah sebagai FAKTA yang TIDAK BOLEH Anda ubah, ganti, atau buat ulang. Tugas Anda HANYA menyusun Rencana Tindakan Remediation (Corrective and Preventive Action / CAPA Table) yang secara logis dan teknis menindaklanjuti root cause tersebut — bukan membuat root cause baru dari deskripsi temuan.

Gunakan Judul Temuan, Root Cause manual, Severity, Area, Domain, dan Deskripsi Temuan sebagai konteks utama untuk merancang action plan yang spesifik dan relevan — bukan template generik.

Selain itu, klasifikasikan temuan ke dalam SATU kategori masalah dari daftar tetap berikut (pilih yang paling sesuai, jangan buat kategori baru):
${ISSUE_CATEGORIES.map((c) => `- ${c}`).join("\n")}

Hasilkan output JSON murni tanpa pembungkus markdown dengan format struktur persis seperti berikut:
{
  "insightNote": "Catatan singkat AI (1-2 kalimat) yang menghubungkan root cause manual dengan strategi action plan yang dipilih — BUKAN root cause baru",
  "issueCategory": "Salah satu nilai persis dari daftar kategori di atas",
  "actionPlanTable": [
    {
      "horizon": "Jangka Pendek",
      "category": "Corrective Action",
      "action": "Deskripsi langkah perbaikan cepat yang konkret dan spesifik, menindaklanjuti root cause manual di atas",
      "rationale": "Justifikasi teknis mendalam mengapa langkah ini efektif menghentikan masalah saat ini",
      "targetSla": "Immediate / < 12 Jam / 24 Jam"
    },
    {
      "horizon": "Jangka Panjang",
      "category": "Preventive Action",
      "action": "Deskripsi perbaikan sistem/SOP/maintenance jangka panjang yang menghilangkan root cause manual di atas",
      "rationale": "Justifikasi teknis bagaimana langkah ini mencegah masalah terulang kembali di masa depan",
      "targetSla": "1 Minggu / 1 Bulan / Sesuai Siklus PM"
    }
  ]
}`;

export async function analyzeAuditFindingWithAi(params: {
  title?: string;
  rootCause: string;
  description: string;
  area: string;
  domain?: string;
  severity?: string;
  auditorNotes?: string;
}): Promise<AuditAnalysisResult> {
  const title = sanitizeInput(params.title || "");
  const rootCause = sanitizeInput(params.rootCause || "");
  const description = sanitizeInput(params.description || "");
  const area = sanitizeInput(params.area || "Cutting");
  const domain = sanitizeInput(params.domain || "MQAA");
  const severity = sanitizeInput(params.severity || "Medium");
  const auditorNotes = sanitizeInput(params.auditorNotes || "");

  const userPrompt = `Judul Temuan: ${title || "-"}
Area Pabrik: ${area}
Domain Audit: ${domain}
Tingkat Keparahan (Severity): ${severity}
Deskripsi Temuan: ${description}
Root Cause (Akar Masalah) - DITENTUKAN MANUAL OLEH AUDITOR, JANGAN DIUBAH: ${rootCause}
Catatan Auditor: ${auditorNotes || "-"}`;

  // 1. Try Google Gemini via @google/genai SDK
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: getGeminiModel(),
        contents: `${AI_SYSTEM_PROMPT}\n\n[DATA TEMUAN AUDIT]\n${userPrompt}`,
      });

      if (response && response.text) {
        const text = response.text.trim();
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        const insightNote = parsed.insightNote || parsed.summary || "";
        const actionPlanTable: ActionPlanRow[] = Array.isArray(parsed.actionPlanTable) ? parsed.actionPlanTable : [];
        const issueCategory: IssueCategory = ISSUE_CATEGORIES.includes(parsed.issueCategory)
          ? parsed.issueCategory
          : suggestIssueCategory(description);

        const formattedActionPlanText = actionPlanTable
          .map(
            (row: ActionPlanRow, idx: number) =>
              `[${idx + 1}. ${row.horizon.toUpperCase()} / ${row.category.toUpperCase()} - SLA: ${row.targetSla}]\n• Tindakan: ${row.action}\n• Justifikasi Teknis: ${row.rationale}`
          )
          .join("\n\n");

        return {
          insightNote,
          actionPlanTable,
          actionPlan: formattedActionPlanText,
          issueCategory,
          aiEngine: "gemini",
        };
      }
    } catch (e) {
      console.error("Gemini API call failed, falling back to rule engine:", e);
    }
  }

  // 2. Try OpenAI if key is present
  if (process.env.OPENAI_API_KEY) {
    try {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: AI_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const parsed = JSON.parse(aiData.choices[0].message.content);

        const insightNote = parsed.insightNote || parsed.summary || "";
        const actionPlanTable: ActionPlanRow[] = Array.isArray(parsed.actionPlanTable) ? parsed.actionPlanTable : [];
        const issueCategory: IssueCategory = ISSUE_CATEGORIES.includes(parsed.issueCategory)
          ? parsed.issueCategory
          : suggestIssueCategory(description);

        const formattedActionPlanText = actionPlanTable
          .map(
            (row: ActionPlanRow, idx: number) =>
              `[${idx + 1}. ${row.horizon.toUpperCase()} / ${row.category.toUpperCase()} - SLA: ${row.targetSla}]\n• Tindakan: ${row.action}\n• Justifikasi Teknis: ${row.rationale}`
          )
          .join("\n\n");

        return {
          insightNote,
          actionPlanTable,
          actionPlan: formattedActionPlanText,
          issueCategory,
          aiEngine: "openai",
        };
      }
    } catch (e) {
      console.error("OpenAI API call failed, falling back to rule engine:", e);
    }
  }

  // 3. Rule Engine Fallback — now anchored on the manual root cause + title,
  // not just description keywords, so it varies with what the auditor typed.
  const lowerContext = `${rootCause} ${description} ${title}`.toLowerCase();
  let insightNote = "";
  let actionPlanTable: ActionPlanRow[] = [];
  const issueCategory: IssueCategory = suggestIssueCategory(description);

  if (lowerContext.includes("suhu") || lowerContext.includes("oven") || lowerContext.includes("panas") || lowerContext.includes("lem") || lowerContext.includes("cement")) {
    insightNote = "Action plan disusun menindaklanjuti root cause manual terkait suhu/viskositas proses lem yang diinput auditor.";
    actionPlanTable = [
      {
        horizon: "Jangka Pendek",
        category: "Corrective Action",
        action: "Lakukan pembersihan kerak pada heating element oven, isolasi lot komponen sole terkontaminasi, dan kalibrasi suhu oven menggunakan digital pyrometer.",
        rationale: "Deviasi suhu >5°C dari standar 65-75°C menggagalkan otoklaf resin polyurethane sehingga daya rekat sole turun di bawah standar ISO 17708.",
        targetSla: "Immediate / < 12 Jam",
      },
      {
        horizon: "Jangka Pendek",
        category: "Corrective Action",
        action: "Penghentian penggunaan container terbuka dan wajibkan uji viskositas lem dengan cup viskometer di awal shift.",
        rationale: "Penguapan solvent mengubah rasio padatan lem yang berdampak langsung pada kegagalan bonding strength.",
        targetSla: "24 Jam",
      },
      {
        horizon: "Jangka Panjang",
        category: "Preventive Action",
        action: "Instalasikan automatic temperature controller dengan alarm interlock mesin dan ganti wadah lem manual dengan sealed auto-feed dispenser.",
        rationale: "Menghilangkan kelalaian operator serta menjamin suhu dan viskositas lem selalu berada pada window parameter proses yang konsisten.",
        targetSla: "1 Minggu",
      },
    ];
  } else if (lowerContext.includes("cutting") || lowerContext.includes("potong") || lowerContext.includes("pisau") || lowerContext.includes("die") || lowerContext.includes("kulit")) {
    insightNote = "Action plan disusun menindaklanjuti root cause manual terkait mata pisau/cutting pad yang diinput auditor.";
    actionPlanTable = [
      {
        horizon: "Jangka Pendek",
        category: "Corrective Action",
        action: "Lakukan perataan (resurfacing) pada cutting pad dan pengasahan atau penggantian pisau die cutting yang tumpul.",
        rationale: "Permukaan pad yang bergelombang dan pisau tumpul menyebabkan distribusi tekanan hidrolik tidak merata, yang secara langsung menghasilkan serat kain bersabut (ragged edges) pada bagian upper.",
        targetSla: "Immediate / < 12 Jam",
      },
      {
        horizon: "Jangka Pendek",
        category: "Corrective Action",
        action: "Sosialisasi ulang penggunaan Quality Control Card toleransi ketebalan bahan sebelum masuk ke Line Cutting.",
        rationale: "Pemeriksaan awal memastikan variasi ketebalan material yang melebihi batas toleransi tidak langsung dipotong tanpa penyesuaian tekanan mesin.",
        targetSla: "24 Jam",
      },
      {
        horizon: "Jangka Panjang",
        category: "Preventive Action",
        action: "Implementasi sistem Preventive Maintenance (PM) otomatis untuk inspek & asah die cutter setiap 5.000 siklus pemotongan.",
        rationale: "Mengalihkan pola perawatan dari merespons kerusakan (breakdown maintenance) menjadi pencegahan terencana, sehingga standar ketajaman alat selalu terjamin sebelum kualitas produk terganggu.",
        targetSla: "1 Minggu",
      },
    ];
  } else {
    // Generic branch — now weaves in the auditor's actual root cause text
    // instead of a static boilerplate sentence, so two different findings
    // no longer produce byte-identical output.
    const rootCauseSnippet = rootCause || "penyimpangan prosedur operasional standar";
    insightNote = `Action plan disusun menindaklanjuti root cause manual: "${rootCauseSnippet}".`;
    actionPlanTable = [
      {
        horizon: "Jangka Pendek",
        category: "Corrective Action",
        action: `Lakukan isolasi lot/area terdampak terkait "${rootCauseSnippet}" di area ${area}, dan penyesuaian instrumen kerja secara langsung oleh supervisor shift.`,
        rationale: "Tindakan penahanan cepat (containment) mencegah merambatnya dampak root cause ke stasiun kerja berikutnya di jalur produksi.",
        targetSla: "Immediate / < 12 Jam",
      },
      {
        horizon: "Jangka Panjang",
        category: "Preventive Action",
        action: `Perbarui Standard Operation Sheet (SOS) area ${area} untuk menutup akar masalah "${rootCauseSnippet}", integrasikan papan visual kontrol Andon, dan lakukan pemeliharaan preventif terjadwal.`,
        rationale: "Pencegahan sistemik menghilangkan variabilitas metode kerja operator dan memastikan parameter proses stabil jangka panjang.",
        targetSla: "1 Minggu",
      },
    ];
  }

  const formattedActionPlanText = actionPlanTable
    .map(
      (row: ActionPlanRow, idx: number) =>
        `[${idx + 1}. ${row.horizon.toUpperCase()} / ${row.category.toUpperCase()} - SLA: ${row.targetSla}]\n• Tindakan: ${row.action}\n• Justifikasi Teknis: ${row.rationale}`
    )
    .join("\n\n");

  return {
    insightNote,
    actionPlanTable,
    actionPlan: formattedActionPlanText,
    issueCategory,
    aiEngine: "fallback",
  };
}
