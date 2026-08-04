import jsPDF from "jspdf";
import { formatIndonesianDate } from "./dateUtils";
import { ChecklistItem } from "@/components/ThreeMonthTimeline";
import { AuditReportItem } from "@/components/AuditReportBuilder";

interface PDFGeneratorOptions {
  timelineFilter: string;
  specificDateFilter: string;
  domainFilter: string;
  areaFilter: string;
  checklists: ChecklistItem[];
  reports: AuditReportItem[];
}

/**
 * Fetches an image URL and converts it to a base64 Data URL for jsPDF embedding.
 * Returns null gracefully if fetch fails so PDF generation never crashes.
 */
async function fetchImageAsDataUrl(url: string): Promise<{ dataUrl: string; format: "JPEG" | "PNG" | "WEBP" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = blob.type.toLowerCase();

    let format: "JPEG" | "PNG" | "WEBP" = "JPEG";
    if (mime.includes("png")) format = "PNG";
    else if (mime.includes("webp")) format = "WEBP";

    return {
      dataUrl: `data:${mime || "image/jpeg"};base64,${base64}`,
      format,
    };
  } catch (error) {
    console.error("Failed to fetch image for PDF:", url, error);
    return null;
  }
}

/**
 * Generates formal black-and-white (monochrome) PDF for audit resumes.
 */
export async function generateAuditResumePDF({
  specificDateFilter,
  domainFilter,
  areaFilter,
  checklists,
  reports,
}: PDFGeneratorOptions): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297 mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // ~180 mm

  let y = margin;
  let pageNum = 1;

  function checkNewPage(neededHeight: number = 10) {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      pageNum++;
      y = margin + 8;
      // Monochrome Page Header
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(
        `LAPORAN AUDIT GANDUL — RESUME LAPANGAN (HALAMAN ${pageNum})`,
        margin,
        10
      );
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
      y = 18;
    }
  }

  // --- TOP SOLID BLACK HEADER BAR ---
  doc.setFillColor(0, 0, 0); // Black
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255); // White
  doc.text("LAPORAN AUDIT GANDUL", margin, 12);

  y = 26;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0); // Black
  doc.text("Audit Crucible Resume Report", margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Pabrik Manufaktur Sepatu — Evaluasi Live On-Site Execution", margin, y);
  y += 8;

  // Filter Box (Light Grey Box, Neutral Dark Border)
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, "FD");

  const todayStr = formatIndonesianDate(new Date().toISOString().split("T")[0]);
  const displayTimeline = specificDateFilter
    ? `Tanggal Spesifik: ${formatIndonesianDate(specificDateFilter)} (${specificDateFilter})`
    : "Semua Tanggal di Semua Bulan";

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("KRITERIA FILTER AKTIF:", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`• Timeline / Tanggal : ${displayTimeline}`, margin + 6, y + 12);
  doc.text(`• Domain Audit      : ${domainFilter === "All" ? "Semua Domain (MQAA, 6S, VM, HSE, PS)" : domainFilter}`, margin + 6, y + 17);
  doc.text(`• Area Audit        : ${areaFilter === "All" ? "Semua Area (Cutting, Prep, CSC)" : areaFilter}`, margin + 6, y + 21);
  doc.text(`• Tanggal Generate  : ${todayStr}`, margin + 105, y + 12);

  y += 32;

  // --- SECTION 1: RINGKASAN CHECKLIST ---
  checkNewPage(20);
  doc.setFillColor(0, 0, 0); // Black Header Box
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);

  const completedCount = checklists.filter((c) => c.completed).length;
  const checklistPercent = checklists.length > 0 ? Math.round((completedCount / checklists.length) * 100) : 0;
  doc.text(
    `1. RINGKASAN CHECKLIST AUDIT (${completedCount}/${checklists.length} Selesai - ${checklistPercent}%)`,
    margin + 4,
    y + 5
  );

  y += 11;

  if (checklists.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Tidak ada item checklist yang cocok dengan filter aktif.", margin + 2, y);
    y += 8;
  } else {
    checklists.forEach((item, index) => {
      checkNewPage(18);

      const isCompleted = item.completed;
      const statusSymbol = isCompleted ? "[SELESAI]" : "[BELUM]";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${statusSymbol}`, margin + 2, y);

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(item.title, contentWidth - 25);
      doc.text(titleLines, margin + 22, y);
      y += titleLines.length * 4.2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const dateTag = item.auditDate ? ` | Tanggal: ${formatIndonesianDate(item.auditDate)}` : "";
      doc.text(`Target: ${item.month} | Domain: ${item.domain} | Area: ${item.area || "All"}${dateTag}`, margin + 22, y);
      y += 4;

      if (item.description) {
        doc.setTextColor(60, 60, 60);
        const descLines = doc.splitTextToSize(`Deskripsi: ${item.description}`, contentWidth - 25);
        doc.text(descLines, margin + 22, y);
        y += descLines.length * 3.8;
      }

      y += 3;
    });
  }

  y += 4;

  // --- SECTION 2: DAFTAR LAPORAN AUDIT ---
  checkNewPage(20);
  doc.setFillColor(0, 0, 0); // Black Header Box
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`2. DAFTAR LAPORAN AUDIT LENGKAP (${reports.length} Laporan)`, margin + 4, y + 5);

  y += 12;

  if (reports.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text("Tidak ada laporan audit yang cocok dengan filter aktif.", margin + 2, y);
    y += 8;
  } else {
    for (let index = 0; index < reports.length; index++) {
      const rep = reports[index];
      checkNewPage(35);

      const indonesianDate = formatIndonesianDate(rep.auditDate);

      // Report Header Box
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`LAPORAN #${index + 1}: ${rep.title.toUpperCase()}`, margin + 3, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text(
        `Tanggal: ${indonesianDate} | Area: ${rep.area} | Domain: ${rep.domain} | Severity: ${rep.severity} | Status: ${rep.status}`,
        margin + 3,
        y + 10
      );

      y += 18;

      // Auditor
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Auditor: ${rep.auditorName}`, margin + 2, y);
      y += 5;

      // Deskripsi Temuan
      checkNewPage(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Deskripsi Temuan Lapangan:", margin + 2, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const findingLines = doc.splitTextToSize(rep.findingDescription, contentWidth - 6);
      doc.text(findingLines, margin + 4, y);
      y += findingLines.length * 3.8 + 4;

      // 3 REQUIRED COLUMNS
      // 1. Root Cause Analysis
      checkNewPage(15);
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(margin + 2, y, contentWidth - 4, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("1. Root Cause Analysis (Akar Masalah):", margin + 4, y + 3.5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const rcLines = doc.splitTextToSize(rep.rootCause, contentWidth - 8);
      doc.text(rcLines, margin + 6, y);
      y += rcLines.length * 3.8 + 4;

      // 2. Action Plan
      checkNewPage(15);
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(margin + 2, y, contentWidth - 4, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("2. Action Plan Remediasi (Rencana Perbaikan):", margin + 4, y + 3.5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const apLines = doc.splitTextToSize(rep.actionPlan, contentWidth - 8);
      doc.text(apLines, margin + 6, y);
      y += apLines.length * 3.8 + 4;

      // 3. Lesson Learned
      checkNewPage(15);
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(margin + 2, y, contentWidth - 4, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text("3. Key Lesson Learned (Pembelajaran Utama):", margin + 4, y + 3.5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const llLines = doc.splitTextToSize(rep.lessonLearned, contentWidth - 8);
      doc.text(llLines, margin + 6, y);
      y += llLines.length * 3.8 + 4;

      // Embedded Photos
      if (rep.photoUrls && rep.photoUrls.length > 0) {
        checkNewPage(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        doc.text("Lampiran Foto Temuan Lapangan:", margin + 2, y);
        y += 5;

        const photoWidth = 52; // mm
        const photoHeight = 38; // mm
        const gap = 6; // mm
        const maxPerRow = 3;
        let renderedRows = 0;

        for (let pIdx = 0; pIdx < rep.photoUrls.length; pIdx++) {
          const photoUrl = rep.photoUrls[pIdx];
          const imgData = await fetchImageAsDataUrl(photoUrl);

          if (imgData) {
            const col = pIdx % maxPerRow;
            if (col === 0 && pIdx > 0) {
              y += photoHeight + 8;
              renderedRows++;
            }
            checkNewPage(photoHeight + 8);

            const xPos = margin + 2 + col * (photoWidth + gap);

            try {
              doc.addImage(
                imgData.dataUrl,
                imgData.format,
                xPos,
                y,
                photoWidth,
                photoHeight
              );
              // Border
              doc.setDrawColor(200, 200, 200);
              doc.rect(xPos, y, photoWidth, photoHeight);

              // Caption
              doc.setFont("helvetica", "normal");
              doc.setFontSize(7.5);
              doc.setTextColor(80, 80, 80);
              doc.text(`Foto ${pIdx + 1}`, xPos + 2, y + photoHeight + 4);
            } catch (err) {
              console.error("Error drawing photo in PDF:", err);
            }
          }
        }

        y += photoHeight + 8;
      }

      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    }
  }

  // Page Footer for last page
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Dokumen Laporan Resume Resmi — Dihasilkan oleh Portal Audit Crucible (Halaman ${pageNum})`,
    margin,
    pageHeight - 8
  );

  return doc;
}

/**
 * Generates a formal black-and-white (monochrome) PDF for a single specific audit report with embedded photos.
 */
export async function generateSingleReportPDF(rep: AuditReportItem): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;
  let pageNum = 1;

  function checkNewPage(neededHeight: number = 10) {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      pageNum++;
      y = margin + 8;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(
        `LAPORAN AUDIT GANDUL — ${rep.title.toUpperCase()} (HALAMAN ${pageNum})`,
        margin,
        10
      );
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
      y = 18;
    }
  }

  // --- TOP SOLID BLACK HEADER BAR ---
  doc.setFillColor(0, 0, 0); // Solid Black
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255); // White
  doc.text("LAPORAN AUDIT GANDUL", margin, 12);

  y = 26;

  // Title
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0); // Black
  const titleLines = doc.splitTextToSize(rep.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 4;

  const indonesianDate = formatIndonesianDate(rep.auditDate);

  // Summary Metadata Card
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("METADATA LAPORAN AUDIT:", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text(`• Tanggal Audit : ${indonesianDate} (${rep.auditDate})`, margin + 6, y + 12);
  doc.text(`• Area Audit    : ${rep.area}`, margin + 6, y + 17);
  doc.text(`• Domain Audit  : ${rep.domain}`, margin + 95, y + 12);
  doc.text(`• Severity / Status: ${rep.severity} Severity | ${rep.status}`, margin + 95, y + 17);
  doc.text(`• Auditor Name  : ${rep.auditorName}`, margin + 6, y + 21);

  y += 30;

  // Deskripsi Temuan
  checkNewPage(15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Deskripsi Temuan Lapangan:", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const findingLines = doc.splitTextToSize(rep.findingDescription, contentWidth);
  doc.text(findingLines, margin, y);
  y += findingLines.length * 4 + 6;

  // 3 REQUIRED COLUMNS
  // 1. Root Cause Analysis
  checkNewPage(20);
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("1. Root Cause Analysis (Akar Masalah):", margin + 3, y + 4);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const rcLines = doc.splitTextToSize(rep.rootCause, contentWidth - 4);
  doc.text(rcLines, margin + 2, y);
  y += rcLines.length * 4 + 8;

  // 2. Action Plan
  checkNewPage(20);
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("2. Action Plan Remediasi (Rencana Perbaikan):", margin + 3, y + 4);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const apLines = doc.splitTextToSize(rep.actionPlan, contentWidth - 4);
  doc.text(apLines, margin + 2, y);
  y += apLines.length * 4 + 8;

  // 3. Lesson Learned
  checkNewPage(20);
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("3. Key Lesson Learned (Pembelajaran Utama):", margin + 3, y + 4);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const llLines = doc.splitTextToSize(rep.lessonLearned, contentWidth - 4);
  doc.text(llLines, margin + 2, y);
  y += llLines.length * 4 + 8;

  // Embedded Photos for Single Report
  if (rep.photoUrls && rep.photoUrls.length > 0) {
    checkNewPage(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Lampiran Foto Temuan Lapangan:", margin, y);
    y += 6;

    const photoWidth = 52; // mm
    const photoHeight = 38; // mm
    const gap = 6; // mm
    const maxPerRow = 3;

    for (let pIdx = 0; pIdx < rep.photoUrls.length; pIdx++) {
      const photoUrl = rep.photoUrls[pIdx];
      const imgData = await fetchImageAsDataUrl(photoUrl);

      if (imgData) {
        const col = pIdx % maxPerRow;
        if (col === 0 && pIdx > 0) {
          y += photoHeight + 8;
        }
        checkNewPage(photoHeight + 8);

        const xPos = margin + col * (photoWidth + gap);

        try {
          doc.addImage(
            imgData.dataUrl,
            imgData.format,
            xPos,
            y,
            photoWidth,
            photoHeight
          );
          // Border
          doc.setDrawColor(200, 200, 200);
          doc.rect(xPos, y, photoWidth, photoHeight);

          // Caption
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(80, 80, 80);
          doc.text(`Foto ${pIdx + 1}`, xPos + 2, y + photoHeight + 4);
        } catch (err) {
          console.error("Error drawing photo in single report PDF:", err);
        }
      }
    }

    y += photoHeight + 8;
  }

  // Page Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Dokumen Laporan Audit On-Site Resmi — Dihasilkan oleh Dashboard Gandul`,
    margin,
    pageHeight - 8
  );

  return doc;
}
