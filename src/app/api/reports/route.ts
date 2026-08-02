import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditReports } from "@/db/schema";
import { ensureInitialData } from "@/lib/seedData";
import { sanitizeInput } from "@/lib/sanitize";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await ensureInitialData();
    const reports = await db
      .select()
      .from(auditReports)
      .orderBy(desc(auditReports.createdAt));

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data laporan audit." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const title = sanitizeInput(body.title || "");
    const area = sanitizeInput(body.area || "Cutting");
    const domain = sanitizeInput(body.domain || "MQAA");
    const findingDescription = sanitizeInput(body.findingDescription || "");
    
    // Required 3 columns
    const rootCause = sanitizeInput(body.rootCause || "");
    const actionPlan = sanitizeInput(body.actionPlan || "");
    const lessonLearned = sanitizeInput(body.lessonLearned || "");

    const auditorName = sanitizeInput(body.auditorName || "CEM Auditor");
    const severity = sanitizeInput(body.severity || "Medium");
    const status = sanitizeInput(body.status || "Open");
    const auditDate = sanitizeInput(body.auditDate || new Date().toISOString().split("T")[0]);

    // Validate required fields
    if (!title || !findingDescription) {
      return NextResponse.json(
        { success: false, error: "Judul dan deskripsi temuan wajib diisi." },
        { status: 400 }
      );
    }

    if (!rootCause || !actionPlan || !lessonLearned) {
      return NextResponse.json(
        {
          success: false,
          error: "3 Kolom Wajib (Root Cause, Action Plan, & Lesson Learned) harus diisi dengan lengkap.",
        },
        { status: 400 }
      );
    }

    const newReport = await db
      .insert(auditReports)
      .values({
        title,
        area,
        domain,
        findingDescription,
        rootCause,
        actionPlan,
        lessonLearned,
        auditorName,
        severity,
        status,
        auditDate,
      })
      .returning();

    return NextResponse.json({ success: true, data: newReport[0] });
  } catch (error) {
    console.error("POST report error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan laporan audit." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID laporan diperlukan." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = sanitizeInput(body.title);
    if (body.area !== undefined) updateData.area = sanitizeInput(body.area);
    if (body.domain !== undefined) updateData.domain = sanitizeInput(body.domain);
    if (body.findingDescription !== undefined) updateData.findingDescription = sanitizeInput(body.findingDescription);
    if (body.rootCause !== undefined) updateData.rootCause = sanitizeInput(body.rootCause);
    if (body.actionPlan !== undefined) updateData.actionPlan = sanitizeInput(body.actionPlan);
    if (body.lessonLearned !== undefined) updateData.lessonLearned = sanitizeInput(body.lessonLearned);
    if (body.auditorName !== undefined) updateData.auditorName = sanitizeInput(body.auditorName);
    if (body.severity !== undefined) updateData.severity = sanitizeInput(body.severity);
    if (body.status !== undefined) updateData.status = sanitizeInput(body.status);
    if (body.auditDate !== undefined) updateData.auditDate = sanitizeInput(body.auditDate);

    const updated = await db
      .update(auditReports)
      .set(updateData)
      .where(eq(auditReports.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("PATCH report error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate laporan audit." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID laporan diperlukan." },
        { status: 400 }
      );
    }

    await db.delete(auditReports).where(eq(auditReports.id, Number(id)));

    return NextResponse.json({ success: true, message: "Laporan berhasil dihapus." });
  } catch (error) {
    console.error("DELETE report error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus laporan." },
      { status: 500 }
    );
  }
}
