import { getGeminiModel } from "./geminiConfig";

export interface ActionPlanInput {
  title: string;
  description: string;
  rootCause: string;
  severity: string;
  area?: string;
  domain?: string;
}

export async function generateActionPlanFromRootCause(input: ActionPlanInput) {
  const model = getGeminiModel();

  const prompt = `
Anda adalah seorang Auditor Utama & Konsultan CAPA (Corrective and Preventive Action) berpengalaman.
Tugas Anda adalah membuat Action Plan Remediasi (CAPA) yang konkret, realistis, dan tepat sasaran BERDASARKAN Akar Masalah (Root Cause) yang telah ditentukan secara manual oleh auditor.

[INFORMASI LAPORAN AUDIT]
- Judul Temuan: ${input.title || "Tidak terdefinisi"}
- Domain: ${input.domain || "Umum"}
- Area: ${input.area || "Umum"}
- Tingkat Keparahan (Severity): ${input.severity || "Medium"}
- Deskripsi Temuan: ${input.description || "Tidak ada deskripsi"}
- AKAR MASALAH (ROOT CAUSE MANUAL): "${input.rootCause || "Tidak diisi"}"

[INSTRUKSI KHUSUS]
1. Susun Action Plan yang LANGSUNG MENYELESAIKAN Akar Masalah di atas.
2. Format output WAJIB dibagi menjadi 3 tahapan waktu yang jelas:
   - [1. JANGKA PENDEK / CORRECTIVE ACTION - SLA: Immediate / < 24 Jam]
   - [2. JANGKA MENENGAH / PREVENTIVE ACTION - SLA: 1 - 2 Minggu]
   - [3. JANGKA PANJANG / SYSTEMIC IMPROVEMENT - SLA: 1 Bulan / Continuous]
3. Gunakan poin-poin yang dapat diukur dan langsung bisa dieksekusi oleh tim operasional di lapangan.
4. JANGAN membuat Akar Masalah baru. Fokus hanya pada pembuat Action Plan berdasarkan input Akar Masalah yang diberikan.

Hasilkan respons dalam teks ringkas, profesional, dan berorientasi pada tindakan.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text;
  } catch (error: any) {
    console.error("Gemini Action Plan Generation Error:", error);
    
    // Fallback dinamis jika API Gemini sibuk/error
    return `[1. JANGKA PENDEK / CORRECTIVE ACTION - SLA: Immediate / < 24 Jam]
• Tindakan Langsung: Tangani segera akar masalah "${input.rootCause || input.title}" di area ${input.area || "terkait"}.
• Isolasi: Lakukan verifikasi dan penghentian sementara prosedur yang terdampak.

[2. JANGKA MENENGAH / PREVENTIVE ACTION - SLA: 1 - 2 Minggu]
• Koreksi Prosedur: Perbaiki SOP dan lakukan re-evaluasi pada domain ${input.domain || "operasional"}.
• Pelatihan & Pengawasan: Adakan sosialisasi ulang kepada tim operasional mengenai mitigasi risiko severity ${input.severity}.

[3. JANGKA PANJANG / SYSTEMIC IMPROVEMENT - SLA: 1 Bulan / Continuous]
• Audit Periodik: Masukkan indikator penanganan "${input.rootCause || "temuan ini"}" ke dalam checklist pengawasan mingguan.
• Systemic Review: Integrasikan kontrol otomatis untuk mencegah penumpukan isu sejenis di masa mendatang.`;
  }
}