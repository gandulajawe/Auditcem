// File: src/lib/aiAudit.ts
import { GoogleGenAI } from "@google/genai";
import { sanitizeInput } from "@/lib/sanitize";

export interface ActionPlanRow {
  horizon: "Jangka Pendek" | "Jangka Panjang";
  category: "Corrective Action" | "Preventive Action";
  action: string;
  rationale: string;
  targetSla: string;
}

export interface AuditAnalysisResult {
  summary: string;
  actionPlanTable: ActionPlanRow[];
  rootCause: string;
  actionPlan: string;
}

export const AI_SYSTEM_PROMPT = `Anda adalah Chief Quality & Safety Auditor senior berpengalaman di industri manufaktur sepatu (CEM Footwear Manufacturing).

Analisislah temuan audit operasional berikut dan buatkan Rencana Tindakan Remediation (Corrective and Preventive Action / CAPA Table).

Hasilkan output JSON murni tanpa pembungkus markdown dengan format struktur persis seperti berikut:
{
  "summary": "Ringkasan singkat analisis akar masalah (1-2 kalimat)",
  "actionPlanTable": [
    {
      "horizon": "Jangka Pendek",
      "category": "Corrective Action",
      "action": "Deskripsi langkah perbaikan cepat yang konkret dan spesifik",
      "rationale": "Justifikasi teknis mendalam mengapa langkah ini efektif menghentikan masalah saat ini",
      "targetSla": "Immediate / < 12 Jam / 24 Jam"
    },
    {
      "horizon": "Jangka Panjang",
      "category": "Preventive Action",
      "action": "Deskripsi perbaikan sistem/SOP/maintenance jangka panjang",
      "rationale": "Justifikasi teknis bagaimana langkah ini mencegah masalah terulang kembali di masa depan",
      "targetSla": "1 Minggu / 1 Bulan / Sesuai Siklus PM"
    }
  ]
}`;

export async function analyzeAuditFindingWithAi(params: {
  description: string;
  area: string;
  domain?: string;
  severity?: string;
  auditorNotes?: string;
}): Promise<AuditAnalysisResult> {
  const description = sanitizeInput(params.description || "");
  const area = sanitizeInput(params.area || "Cutting");
  const domain = sanitizeInput(params.domain || "MQAA");
  const severity = sanitizeInput(params.severity || "Medium");
  const auditorNotes = sanitizeInput(params.auditorNotes || "");

  // 1. Try Google Gemini via @google/genai SDK
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const userPrompt = `Area Pabrik: ${area}
Domain Audit: ${domain}
Tingkat Keparahan (Severity): ${severity}
Deskripsi Temuan: ${description}
Catatan Auditor: ${auditorNotes || "-"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${AI_SYSTEM_PROMPT}\n\n[DATA TEMUAN AUDIT]\n${userPrompt}`,
      });

      if (response && response.text) {
        const text = response.text.trim();
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        const summary = parsed.summary || "Analisis akar masalah temuan audit operasional.";
        const actionPlanTable: ActionPlanRow[] = Array.isArray(parsed.actionPlanTable) ? parsed.actionPlanTable : [];

        const formattedActionPlanText = actionPlanTable
          .map(
            (row: ActionPlanRow, idx: number) =>
              `[${idx + 1}. ${row.horizon.toUpperCase()} / ${row.category.toUpperCase()} - SLA: ${row.targetSla}]\n• Tindakan: ${row.action}\n• Justifikasi Teknis: ${row.rationale}`
          )
          .join("\n\n");

        return {
          summary,
          actionPlanTable,
          rootCause: summary,
          actionPlan: formattedActionPlanText,
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
            { role: "user", content: `Area Pabrik: ${area}\nDomain Audit: ${domain}\nSeverity: ${severity}\nDeskripsi Temuan: ${description}` },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const parsed = JSON.parse(aiData.choices[0].message.content);

        const summary = parsed.summary || "Analisis akar masalah temuan audit operasional.";
        const actionPlanTable: ActionPlanRow[] = Array.isArray(parsed.actionPlanTable) ? parsed.actionPlanTable : [];

        const formattedActionPlanText = actionPlanTable
          .map(
            (row: ActionPlanRow, idx: number) =>
              `[${idx + 1}. ${row.horizon.toUpperCase()} / ${row.category.toUpperCase()} - SLA: ${row.targetSla}]\n• Tindakan: ${row.action}\n• Justifikasi Teknis: ${row.rationale}`
          )
          .join("\n\n");

        return {
          summary,
          actionPlanTable,
          rootCause: summary,
          actionPlan: formattedActionPlanText,
        };
      }
    } catch (e) {
      console.error("OpenAI API call failed, falling back to rule engine:", e);
    }
  }

  // 3. Rule Engine Fallback
  const lowerDesc = description.toLowerCase();
  let summary = "";
  let actionPlanTable: ActionPlanRow[] = [];

  if (lowerDesc.includes("suhu") || lowerDesc.includes("oven") || lowerDesc.includes("panas") || lowerDesc.includes("lem") || lowerDesc.includes("cement")) {
    summary = "Variasi suhu oven aktivasi lem dan penurunan viskositas primer disebabkan oleh deposit uap lem pada thermo-sensor dan penguapan solvent pada wadah terbuka.";
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
  } else if (lowerDesc.includes("cutting") || lowerDesc.includes("potong") || lowerDesc.includes("pisau") || lowerDesc.includes("die") || lowerDesc.includes("kulit")) {
    summary = "Kerusakan tepi bahan potongan disebabkan oleh tumpulnya mata pisau die cutter dan landasan cutting pad yang bergelombang akibat keterlambatan jadwal pemeliharaan rutin.";
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
    summary = `Penyimpangan operasional di area ${area} dipicu oleh ketidaksesuaian prosedur operasional standar dan belum optimalnya pengawasan mutu secara berkala.`;
    actionPlanTable = [
      {
        horizon: "Jangka Pendek",
        category: "Corrective Action",
        action: `Lakukan isolasi lot material terdampak di area ${area} dan penyesuaian instrumen kerja secara langsung oleh supervisor shift.`,
        rationale: "Tindakan penahanan cepat (containment) mencegah merambatnya cacat ke stasiun kerja berikutnya di jalur perakitan.",
        targetSla: "Immediate / < 12 Jam",
      },
      {
        horizon: "Jangka Panjang",
        category: "Preventive Action",
        action: `Perbarui Standard Operation Sheet (SOS) area ${area}, integrasikan papan visual kontrol Andon, dan lakukan pemeliharaan preventif terjadwal.`,
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
    summary,
    actionPlanTable,
    rootCause: summary,
    actionPlan: formattedActionPlanText,
  };
}
