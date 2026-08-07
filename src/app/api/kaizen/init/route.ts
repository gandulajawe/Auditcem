// File: src/app/api/kaizen/init/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditReports, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { sanitizeInput } from "@/lib/sanitize";

// Lembar Kaizen selalu berelasi One-to-One ke sebuah baris `audit_reports` (lihat src/db/schema.ts).
// Untuk Kaizen yang dibuat mandiri (bukan hasil eskalasi dari Laporan Audit yang sudah ada),
// endpoint ini membuat baris `audit_reports` placeholder terlebih dahulu (ditandai isKaizenOriginOnly),
// lalu mengembalikan id-nya untuk dipakai sebagai findingId Lembar Kaizen.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.auth) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const performer = String(session.name || session.email || "Auditor");
    const body = await request.json().catch(() => ({}));

    const title = sanitizeInput(body.title || "Inisiasi Kaizen Mandiri Sektor Operasional");
    const area = sanitizeInput(body.area || "Cutting");
    const today = new Date().toISOString().split("T")[0];

    const [inserted] = await db
      .insert(auditReports)
      .values({
        title,
        area,
        domain: "PS",
        findingDescription: title,
        rootCause: "-",
        actionPlan: "-",
        lessonLearned: "-",
        auditorName: performer,
        severity: "Medium",
        status: "Open",
        auditDate: today,
        isKaizenEscalated: true,
        isKaizenOriginOnly: true,
      })
      .returning();

    await db.insert(auditLogs).values({
      action: "CREATE",
      entity: "KAIZEN_PDCA",
      entityId: inserted.id,
      details: `Membuat wadah Kaizen mandiri baru "${title}" oleh ${performer}`,
      performedBy: performer,
    });

    return NextResponse.json({ success: true, data: { id: inserted.id, title: inserted.title, area: inserted.area } });
  } catch (error) {
    console.error("POST /api/kaizen/init error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat Lembar Kaizen mandiri baru." },
      { status: 500 }
    );
  }
}
