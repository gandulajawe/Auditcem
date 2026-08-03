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

export function generateAuditResumePDF({
  timelineFilter,
  specificDateFilter,
  domainFilter,
  areaFilter,
  checklists,
  reports,
}: PDFGeneratorOptions): jsPDF {
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
      // Page Header
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(
        `The Audit Crucible — Resume Audit Lapangan (Halaman ${pageNum})`,
        margin,
        10
      );
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 12, pageWidth - margin, 12);
      y = 18;
    }
  }

  // --- TOP ACCENT HEADER BAR ---
  doc.setFillColor(106, 13, 173); // #6A0DAD
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("THE AUDIT CRUCIBLE — CERTIFIED ENGINEERING MANAGER (CEM)", margin, 12);

  y = 26;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(106, 13, 173); // #6A0DAD
  doc.text("Audit Crucible Resume Report", margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Pabrik Manufaktur Sepatu — Evaluasi Live On-Site Execution", margin, y);
  y += 8;

  // Filter Box
  doc.setFillColor(248, 243, 252);
  doc.setDrawColor(242, 167, 198); // #F2A7C6 border
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "FD");

  const todayStr = formatIndonesianDate(new Date().toISOString().split("T")[0]);
  const displayTimeline = specificDateFilter
    ? `Tanggal Spesifik: ${formatIndonesianDate(specificDateFilter)} (${specificDateFilter})`
    : timelineFilter === "All"
    ? "Semua Bulan (Agustus, September, Oktober)"
    : timelineFilter;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(106, 13, 173);
  doc.text("KRITERIA FILTER AKTIF:", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`• Timeline / Tanggal : ${displayTimeline}`, margin + 6, y + 12);
  doc.text(`• Domain Audit      : ${domainFilter === "All" ? "Semua Domain (MQAA, 6S, VM, HSE, PS)" : domainFilter}`, margin + 6, y + 17);
  doc.text(`• Area Audit        : ${areaFilter === "All" ? "Semua Area (Cutting, Prep, CSC)" : areaFilter}`, margin + 6, y + 22);
  doc.text(`• Tanggal Generate  : ${todayStr}`, margin + 105, y + 12);

  y += 34;

  // --- SECTION 1: RINGKASAN CHECKLIST ---
  checkNewPage(20);
  doc.setFillColor(106, 13, 173); // #6A0DAD
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
      if (isCompleted) {
        doc.setTextColor(106, 13, 173);
      } else {
        doc.setTextColor(180, 50, 50);
      }
      doc.text(`${index + 1}. ${statusSymbol}`, margin + 2, y);

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(item.title, contentWidth - 25);
      doc.text(titleLines, margin + 22, y);
      y += titleLines.length * 4.2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const dateTag = item.auditDate ? ` | Tanggal: ${formatIndonesianDate(item.auditDate)}` : "";
      doc.text(`Target: ${item.month} | Domain: ${item.domain} | Area: ${item.area || "All"}${dateTag}`, margin + 22, y);
      y += 4;

      if (item.description) {
        doc.setTextColor(80, 80, 80);
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
  doc.setFillColor(106, 13, 173); // #6A0DAD
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
    reports.forEach((rep, index) => {
      checkNewPage(35);

      const indonesianDate = formatIndonesianDate(rep.auditDate);

      // Report Header Box
      doc.setFillColor(245, 240, 250);
      doc.setDrawColor(200, 180, 220);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(106, 13, 173);
      doc.text(`LAPORAN #${index + 1}: ${rep.title}`, margin + 3, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(
        `Tanggal: ${indonesianDate} | Area: ${rep.area} | Domain: ${rep.domain} | Severity: ${rep.severity} | Status: ${rep.status}`,
        margin + 3,
        y + 10
      );

      y += 18;

      // Auditor
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text(`Auditor: ${rep.auditorName}`, margin + 2, y);
      y += 5;

      // Deskripsi Temuan
      checkNewPage(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(106, 13, 173);
      doc.text("Deskripsi Temuan Lapangan:", margin + 2, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const findingLines = doc.splitTextToSize(rep.findingDescription, contentWidth - 6);
      doc.text(findingLines, margin + 4, y);
      y += findingLines.length * 3.8 + 4;

      // 3 REQUIRED COLUMNS
      // 1. Root Cause Analysis
      checkNewPage(15);
      doc.setFillColor(243, 234, 248);
      doc.roundedRect(margin + 2, y, contentWidth - 4, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(106, 13, 173);
      doc.text("1. Root Cause Analysis (Akar Masalah):", margin + 4, y + 3.5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const rcLines = doc.splitTextToSize(rep.rootCause, contentWidth - 8);
      doc.text(rcLines, margin + 6, y);
      y += rcLines.length * 3.8 + 4;

      // 2. Action Plan
      checkNewPage(15);
      doc.setFillColor(252, 235, 242);
      doc.roundedRect(margin + 2, y, contentWidth - 4, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(224, 130, 168);
      doc.text("2. Action Plan Remediasi (Rencana Perbaikan):", margin + 4, y + 3.5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const apLines = doc.splitTextToSize(rep.actionPlan, contentWidth - 8);
      doc.text(apLines, margin + 6, y);
      y += apLines.length * 3.8 + 4;

      // 3. Lesson Learned
      checkNewPage(15);
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(margin + 2, y, contentWidth - 4, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229);
      doc.text("3. Key Lesson Learned (Pembelajaran Utama):", margin + 4, y + 3.5);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      const llLines = doc.splitTextToSize(rep.lessonLearned, contentWidth - 8);
      doc.text(llLines, margin + 6, y);
      y += llLines.length * 3.8 + 6;

      // Divider line
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    });
  }

  // Page Footer for last page
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Laporan Resume PDF Dihasilkan Otomatis oleh Portal Audit Crucible — Halaman ${pageNum}`,
    margin,
    pageHeight - 8
  );

  return doc;
}

/**
 * Generates a PDF for a single specific audit report.
 */
export function generateSingleReportPDF(rep: AuditReportItem): jsPDF {
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
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Laporan Audit On-Site — ${rep.title} (Halaman ${pageNum})`,
        margin,
        10
      );
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 12, pageWidth - margin, 12);
      y = 18;
    }
  }

  // --- TOP ACCENT HEADER BAR ---
  doc.setFillColor(106, 13, 173); // #6A0DAD
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN AUDIT LIVE ON-SITE — CERTIFIED ENGINEERING MANAGER", margin, 12);

  y = 26;

  // Title
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(106, 13, 173); // #6A0DAD
  const titleLines = doc.splitTextToSize(rep.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 4;

  const indonesianDate = formatIndonesianDate(rep.auditDate);

  // Summary Metadata Card
  doc.setFillColor(248, 243, 252);
  doc.setDrawColor(242, 167, 198);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(106, 13, 173);
  doc.text("METADATA LAPORAN AUDIT:", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
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
  doc.setTextColor(106, 13, 173);
  doc.text("Deskripsi Temuan Lapangan:", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  const findingLines = doc.splitTextToSize(rep.findingDescription, contentWidth);
  doc.text(findingLines, margin, y);
  y += findingLines.length * 4 + 6;

  // 3 REQUIRED COLUMNS
  // 1. Root Cause Analysis
  checkNewPage(20);
  doc.setFillColor(243, 234, 248);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(106, 13, 173);
  doc.text("1. Root Cause Analysis (Akar Masalah):", margin + 3, y + 4);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  const rcLines = doc.splitTextToSize(rep.rootCause, contentWidth - 4);
  doc.text(rcLines, margin + 2, y);
  y += rcLines.length * 4 + 8;

  // 2. Action Plan
  checkNewPage(20);
  doc.setFillColor(252, 235, 242);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(224, 130, 168);
  doc.text("2. Action Plan Remediasi (Rencana Perbaikan):", margin + 3, y + 4);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  const apLines = doc.splitTextToSize(rep.actionPlan, contentWidth - 4);
  doc.text(apLines, margin + 2, y);
  y += apLines.length * 4 + 8;

  // 3. Lesson Learned
  checkNewPage(20);
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text("3. Key Lesson Learned (Pembelajaran Utama):", margin + 3, y + 4);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  const llLines = doc.splitTextToSize(rep.lessonLearned, contentWidth - 4);
  doc.text(llLines, margin + 2, y);
  y += llLines.length * 4 + 10;

  // Page Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Dokumen Laporan Audit On-Site Resmi — Dihasilkan oleh Dashboard Gandul`,
    margin,
    pageHeight - 8
  );

  return doc;
}
