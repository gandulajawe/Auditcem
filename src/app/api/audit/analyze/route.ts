// File: src/app/api/audit/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { sanitizeInput } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawDescription = body.description || "";
    const description = sanitizeInput(rawDescription);
    const area = sanitizeInput(body.area || "Cutting");
    const severity = sanitizeInput(body.severity || "Medium");

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Deskripsi temuan minimal 5 karakter untuk dianalisis oleh AI." },
        { status: 400 }
      );
    }

    // 1. Try Google Gemini via @google/genai SDK if GEMINI_API_KEY is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Anda adalah Lead Engineering & QA Auditor di pabrik manufaktur sepatu internasional. Berikan analisis mendalam untuk temuan audit live.
Tanggapi HANYA dalam format JSON valid dengan kunci "rootCause" (penyebab akar masalah 4M+1E) dan "actionPlan" (langkah konkret remediasi bertahap beserta PIC dan estimasi waktu).

Area Audit: ${area}
Tingkat Keparahan (Severity): ${severity}
Deskripsi Temuan Lapangan: ${description}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        if (response && response.text) {
          const text = response.text.trim();
          const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          return NextResponse.json({
            success: true,
            rootCause: parsed.rootCause || parsed.root_cause || "",
            actionPlan: parsed.actionPlan || parsed.action_plan || "",
          });
        }
      } catch (e) {
        console.error("Gemini API call via @google/genai failed, attempting fallback:", e);
      }
    }

    // 2. Try OpenAI API if OPENAI_API_KEY exists
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
              {
                role: "system",
                content:
                  "Anda adalah Lead Engineering & QA Auditor di pabrik manufaktur sepatu internasional. Berikan analisis mendalam untuk temuan audit live. Tanggapi HANYA dalam format JSON valid dengan kunci 'rootCause' dan 'actionPlan'.",
              },
              {
                role: "user",
                content: `Area Audit: ${area}\nTingkat Keparahan (Severity): ${severity}\nDeskripsi Temuan: ${description}`,
              },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const parsed = JSON.parse(aiData.choices[0].message.content);
          return NextResponse.json({
            success: true,
            rootCause: parsed.rootCause || parsed.root_cause || "",
            actionPlan: parsed.actionPlan || parsed.action_plan || "",
          });
        }
      } catch (e) {
        console.error("OpenAI API call failed, falling back to rule engine:", e);
      }
    }

    // 3. Fallback: Footwear Manufacturing Engineering AI Engine
    const lowerDesc = description.toLowerCase();

    let rootCause = "";
    let actionPlan = "";

    if (lowerDesc.includes("suhu") || lowerDesc.includes("oven") || lowerDesc.includes("panas") || lowerDesc.includes("lem") || lowerDesc.includes("cement")) {
      rootCause = `1. Fluktuasi termal pada oven aktivasi perekat disebabkan oleh penumpukan residu uap lem pada heating element dan thermo-sensor yang belum dikalibrasi berkala.\n2. Viskositas bahan pelekat/primer berubah akibat kontaminasi udara lingkungan dan waktu tunggu (open time) yang melebihi standar SOS.`;
      actionPlan = `1. [Segera] Bersihkan elemen pemanas oven dan lakukan re-kalibrasi thermo-sensor dengan instrumen standar sertifikasi.\n2. [24 Jam] Tetapkan SOP pengujian viskositas lem setiap awal shift menggunakan cup viskometer.\n3. [Mingguan] Tambahkan checklist perawatan preventif harian untuk pembersihan ducting oven di area ${area}.`;
    } else if (lowerDesc.includes("cutting") || lowerDesc.includes("potong") || lowerDesc.includes("pisau") || lowerDesc.includes("die") || lowerDesc.includes("kulit")) {
      rootCause = `1. Terdapat keausan pada die-cutting blade serta ketidakrataan plat landasan (cutting pad) mesin press clicker.\n2. Material sintetis/kulit upper tidak melalui proses acclimatization dan pemeriksaan kelembaban (moisture test) sebelum proses pemotongan.`;
      actionPlan = `1. [Segera] Lakukan perataan (resurfacing) cutting pad dan pengasahan/penggantian pisau die cutting yang aus.\n2. [24 Jam] Buat kartu kontrol toleransi ketebalan bahan sebelum masuk ke line Cutting.\n3. [Pencegahan] Lakukan inspeksi berkala pada keausan die cutter setiap 5.000 kali pemotongan.`;
    } else if (lowerDesc.includes("6s") || lowerDesc.includes("sampah") || lowerDesc.includes("kotor") || lowerDesc.includes("berantakan") || lowerDesc.includes("rak")) {
      rootCause = `1. Belum ada zonasi standar (5S/6S red-tag area) dan alur pengisian/pengosongan tempat penampungan sisa bahan di sektor kerja.\n2. Kurangnya kedisiplinan dan pengawasan rutin supervisor shift terhadap kebersihan tempat kerja di akhir jam operasional.`;
      actionPlan = `1. [Segera] Lakukan pembersihan (red-tagging) dan tata ulang rak/kontainer bahan dengan penanda visual warna yang jelas.\n2. [Shift Harian] Berlakukan audit 6S mandiri selama 5 menit sebelum pergantian shift (Clean-as-you-go).\n3. [PIC] Tunjuk PIC supervisor area ${area} untuk audit mingguan berhadiah reward 6S.`;
    } else if (lowerDesc.includes("exhaust") || lowerDesc.includes("apd") || lowerDesc.includes("masker") || lowerDesc.includes("bahaya") || lowerDesc.includes("safety")) {
      rootCause = `1. Penurunan daya hisap sistem exhaust ventilation akibat penyumbatan filter partikel dan kurangnya perawatan ducting.\n2. Kedisiplinan operator dalam menggunakan APD respirator belum maksimal karena ukuran respirator kurang pas atau ketidaknyamanan termal.`;
      actionPlan = `1. [Segera] Ganti filter ducting exhaust dan bersihkan kisi-kisi penangkap uap bahan kimia.\n2. [24 Jam] Lakukan pembagian APD respirator tipe baru yang ergonomic dan aman sesuai standar HSE.\n3. [Edukasi] Adakan safety briefing wajib 10 menit mengenai bahaya uap solvent untuk seluruh operator area ${area}.`;
    } else {
      rootCause = `1. Ketidaksesuaian parameter operasional di area ${area} dipicu oleh variasi metode kerja operator dan belum terkalibrasinya alat ukur standar.\n2. Kurangnya verifikasi visual harian pada papan kontrol kerja serta belum adanya pengawasan berkala dari tim Quality Control.`;
      actionPlan = `1. [Langkah 1 - Immediate] Lakukan penghentian sementara dan penyesuaian ulang instrumen kerja di lokasi temuan.\n2. [Langkah 2 - Corrective] Perbarui Standard Operation Sheet (SOS) dan selenggarakan re-training singkat bagi operator di area ${area}.\n3. [Langkah 3 - Preventive] Jadwalkan audit berkala tingkat keparahan ${severity} secara mingguan oleh auditor internal.`;
    }

    return NextResponse.json({
      success: true,
      rootCause,
      actionPlan,
    });
  } catch (error) {
    console.error("API audit analyze error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis temuan audit dengan AI." },
      { status: 500 }
    );
  }
}
