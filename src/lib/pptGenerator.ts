// File: src/lib/pptGenerator.ts
import PptxGenJS from "pptxgenjs";
import type { PresentationOutline, PresentationSlide } from "@/lib/aiPresentation";

// Brand palette — selaras dengan tema The Audit Crucible (indigo/purple)
const BRAND = {
  navy: "1E1B4B", // indigo-950
  indigo: "4338CA", // indigo-700
  purple: "6D28D9", // purple-700
  gold: "D97706", // amber-600
  slate: "334155",
  slateLight: "94A3B8",
  bg: "F8FAFC",
  white: "FFFFFF",
};

function addTitleSlide(pptx: PptxGenJS, slide: PresentationSlide, deckSubtitle: string) {
  const s = pptx.addSlide();
  s.background = { color: BRAND.navy };

  s.addShape("rect", { x: 0, y: 4.2, w: 10, h: 0.06, fill: { color: BRAND.gold } });

  s.addText("THE AUDIT CRUCIBLE", {
    x: 0.6, y: 0.6, w: 8.8, h: 0.4,
    fontSize: 12, bold: true, color: BRAND.gold, charSpacing: 2,
  });

  s.addText(slide.title, {
    x: 0.6, y: 2.1, w: 8.8, h: 1.6,
    fontSize: 34, bold: true, color: BRAND.white, fontFace: "Arial",
  });

  s.addText(slide.subtitle || deckSubtitle, {
    x: 0.6, y: 3.35, w: 8.8, h: 0.6,
    fontSize: 16, color: "C7D2FE",
  });

  if (slide.notes) s.addNotes(slide.notes);
}

function addSectionSlide(pptx: PptxGenJS, slide: PresentationSlide) {
  const s = pptx.addSlide();
  s.background = { color: BRAND.purple };

  s.addShape("rect", { x: 0.6, y: 2.55, w: 1.1, h: 0.08, fill: { color: BRAND.gold } });

  s.addText(slide.title, {
    x: 0.6, y: 1.9, w: 8.8, h: 0.6,
    fontSize: 28, bold: true, color: BRAND.white,
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.6, y: 2.75, w: 8.8, h: 0.5,
      fontSize: 14, color: "E9D5FF",
    });
  }

  if (slide.notes) s.addNotes(slide.notes);
}

function addBulletsSlide(pptx: PptxGenJS, slide: PresentationSlide) {
  const s = pptx.addSlide();
  s.background = { color: BRAND.white };

  s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.9, fill: { color: BRAND.indigo } });
  s.addText(slide.title, {
    x: 0.5, y: 0, w: 9, h: 0.9,
    fontSize: 22, bold: true, color: BRAND.white, valign: "middle",
  });

  const bullets = (slide.bullets && slide.bullets.length > 0
    ? slide.bullets
    : ["Tidak ada data untuk poin ini."]
  ).slice(0, 6);

  s.addText(
    bullets.map((b) => ({ text: b, options: { bullet: { code: "25AA", color: BRAND.gold }, breakLine: true } })),
    {
      x: 0.7, y: 1.3, w: 8.6, h: 3.7,
      fontSize: 15, color: BRAND.slate, valign: "top", lineSpacingMultiple: 1.35,
    }
  );

  if (slide.notes) s.addNotes(slide.notes);
}

function addTableSlide(pptx: PptxGenJS, slide: PresentationSlide) {
  const s = pptx.addSlide();
  s.background = { color: BRAND.white };

  s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.9, fill: { color: BRAND.indigo } });
  s.addText(slide.title, {
    x: 0.5, y: 0, w: 9, h: 0.9,
    fontSize: 22, bold: true, color: BRAND.white, valign: "middle",
  });

  const headers = (slide.tableHeaders && slide.tableHeaders.length > 0
    ? slide.tableHeaders
    : ["Item"]
  ).slice(0, 4);
  const rows = (slide.tableRows && slide.tableRows.length > 0 ? slide.tableRows : [["-"]]).slice(0, 6);

  const tableRows = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, color: BRAND.white, fill: { color: BRAND.purple }, fontSize: 11 },
    })),
    ...rows.map((row) =>
      row.slice(0, headers.length).map((cell) => ({
        text: String(cell ?? "-"),
        options: { color: BRAND.slate, fontSize: 10, fill: { color: BRAND.bg } },
      }))
    ),
  ];

  s.addTable(tableRows as any, { x: 0.5, y: 1.3, w: 9, h: 3.6, border: { type: "solid", color: "E2E8F0", pt: 0.5 } });

  if (slide.notes) s.addNotes(slide.notes);
}

function addClosingSlide(pptx: PptxGenJS, slide: PresentationSlide) {
  const s = pptx.addSlide();
  s.background = { color: BRAND.navy };

  s.addText(slide.title, {
    x: 0.6, y: 0.7, w: 8.8, h: 0.8,
    fontSize: 26, bold: true, color: BRAND.white,
  });

  const bullets = (slide.bullets && slide.bullets.length > 0
    ? slide.bullets
    : ["Tidak ada rekomendasi tercatat."]
  ).slice(0, 6);

  s.addText(
    bullets.map((b) => ({ text: b, options: { bullet: { code: "2022", color: BRAND.gold }, breakLine: true } })),
    {
      x: 0.8, y: 1.7, w: 8.4, h: 3.2,
      fontSize: 15, color: "E2E8F0", valign: "top", lineSpacingMultiple: 1.4,
    }
  );

  s.addText("Terima Kasih — The Audit Crucible", {
    x: 0.6, y: 5.0, w: 8.8, h: 0.4,
    fontSize: 11, color: BRAND.slateLight, italic: true,
  });

  if (slide.notes) s.addNotes(slide.notes);
}

export async function generatePresentationPPTX(outline: PresentationOutline): Promise<PptxGenJS> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "CRUCIBLE_16x9", width: 10, height: 5.63 });
  pptx.layout = "CRUCIBLE_16x9";
  pptx.author = "The Audit Crucible";
  pptx.title = outline.deckTitle;

  for (const slide of outline.slides) {
    switch (slide.layout) {
      case "title":
        addTitleSlide(pptx, slide, outline.deckSubtitle);
        break;
      case "section":
        addSectionSlide(pptx, slide);
        break;
      case "table":
        addTableSlide(pptx, slide);
        break;
      case "closing":
        addClosingSlide(pptx, slide);
        break;
      case "bullets":
      default:
        addBulletsSlide(pptx, slide);
        break;
    }
  }

  return pptx;
}

export async function downloadPresentationPPTX(outline: PresentationOutline, filename: string): Promise<void> {
  const pptx = await generatePresentationPPTX(outline);
  await pptx.writeFile({ fileName: filename });
}
