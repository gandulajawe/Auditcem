// File: src/app/api/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditReports, auditLogs } from "@/db/schema";
import { ensureInitialData } from "@/lib/seedData";
import { sanitizeInput } from "@/lib/sanitize";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await ensureInitialData();
    // TODO: add pagination when data grows
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
    const session = await getSession();
    if (!session || !session.auth) {
      return NextResponse.json({ success: false, error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const performer = String(session.name || session.email || "Auditor");
    const body = await request.json();

    const area = sanitizeInput(body.area || "Cutting");
    const lineNumber = body.lineNumber ? sanitizeInput(body.lineNumber) : null;
    const domain = sanitizeInput(body.domain || "MQAA");
    const auditorName = sanitizeInput(body.auditorName || performer);
    const bodyIssueCategory = body.issueCategory ? sanitizeInput(body.issueCategory) : null;
    const severity = sanitizeInput(body.severity || "Medium");
    const status = sanitizeInput(body.status || "Open");
    const auditDate = sanitizeInput(body.auditDate || new Date().toISOString().split("T")[0]);

    if (Array.isArray(body.findings) && body.findings.length > 0) {
      const recordsToInsert = body.findings.map((f: any) => {
        const title = sanitizeInput(f.title || `Temuan Audit ${area}`);
        const issueCategory = f.issueCategory ? sanitizeInput(f.issueCategory) : bodyIssueCategory;
        const findingDescription = sanitizeInput(f.findingDescription || "");
        const rootCause = sanitizeInput(f.rootCause || "");
        const actionPlan = sanitizeInput(f.actionPlan || "");
        const lessonLearned = sanitizeInput(f.lessonLearned || "");
        const isKaizenEscalated = Boolean(f.isKaizenEscalated);
        const photoUrls: string[] = Array.isArray(f.photoUrls)
          ? f.photoUrls.map((url: unknown) => (typeof url === "string" ? sanitizeInput(url) : ""))
          : [];

        return {
          title,
          area,
          lineNumber,
          domain,
          issueCategory,
          findingDescription,
          rootCause,
          actionPlan,
          lessonLearned,
          auditorName,
          severity,
          status,
          auditDate,
          isKaizenEscalated,
          photoUrls: photoUrls.length > 0 ? photoUrls : null,
        };
      });

      const insertedRecords = await db
        .insert(auditReports)
        .values(recordsToInsert)
        .returning();

      // Log action with real user from session
      await db.insert(auditLogs).values({
        action: "CREATE",
        entity: "AUDIT_REPORTS",
        entityId: insertedRecords[0].id,
        details: `Batch created ${insertedRecords.length} audit reports by ${performer}`,
        performedBy: performer,
      });

      return NextResponse.json({ success: true, data: insertedRecords[0], insertedRecords });
    }

    // Single report submission
    const title = sanitizeInput(body.title || `Temuan Audit ${area}`);
    const findingDescription = sanitizeInput(body.findingDescription || "");
    const rootCause = sanitizeInput(body.rootCause || "");
    const actionPlan = sanitizeInput(body.actionPlan || "");
    const lessonLearned = sanitizeInput(body.lessonLearned || "");
    const isKaizenEscalated = Boolean(body.isKaizenEscalated);

    const photoUrls: string[] = Array.isArray(body.photoUrls)
      ? body.photoUrls.map((url: unknown) => (typeof url === "string" ? sanitizeInput(url) : ""))
      : [];

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
        lineNumber,
        domain,
        issueCategory: bodyIssueCategory,
        findingDescription,
        rootCause,
        actionPlan,
        lessonLearned,
        auditorName,
        severity,
        status,
        auditDate,
        isKaizenEscalated,
        photoUrls: photoUrls.length > 0 ? photoUrls : null,
      })
      .returning();

    await db.insert(auditLogs).values({
      action: "CREATE",
      entity: "AUDIT_REPORTS",
      entityId: newReport[0].id,
      details: `Created report ID #${newReport[0].id} by ${performer}`,
      performedBy: performer,
    });

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
    const session = await getSession();
    if (!session || !session.auth) {
      return NextResponse.json({ success: false, error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const performer = String(session.name || session.email || "Auditor");
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
    if (body.lineNumber !== undefined) updateData.lineNumber = body.lineNumber ? sanitizeInput(body.lineNumber) : null;
    if (body.domain !== undefined) updateData.domain = sanitizeInput(body.domain);
    if (body.issueCategory !== undefined) updateData.issueCategory = body.issueCategory ? sanitizeInput(body.issueCategory) : null;
    if (body.findingDescription !== undefined) updateData.findingDescription = sanitizeInput(body.findingDescription);
    if (body.rootCause !== undefined) updateData.rootCause = sanitizeInput(body.rootCause);
    if (body.actionPlan !== undefined) updateData.actionPlan = sanitizeInput(body.actionPlan);
    if (body.lessonLearned !== undefined) updateData.lessonLearned = sanitizeInput(body.lessonLearned);
    if (body.auditorName !== undefined) updateData.auditorName = sanitizeInput(body.auditorName);
    if (body.severity !== undefined) updateData.severity = sanitizeInput(body.severity);
    if (body.status !== undefined) updateData.status = sanitizeInput(body.status);
    if (body.auditDate !== undefined) updateData.auditDate = sanitizeInput(body.auditDate);
    if (body.isKaizenEscalated !== undefined) updateData.isKaizenEscalated = Boolean(body.isKaizenEscalated);
    if (body.photoUrls !== undefined) {
      updateData.photoUrls = Array.isArray(body.photoUrls)
        ? body.photoUrls.map((url: unknown) => (typeof url === "string" ? sanitizeInput(url) : ""))
        : null;
    }

    const updated = await db
      .update(auditReports)
      .set(updateData)
      .where(eq(auditReports.id, Number(id)))
      .returning();

    await db.insert(auditLogs).values({
      action: "UPDATE",
      entity: "AUDIT_REPORTS",
      entityId: Number(id),
      details: `Updated report ID #${id} by ${performer}`,
      performedBy: performer,
    });

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
    const session = await getSession();
    if (!session || !session.auth) {
      return NextResponse.json({ success: false, error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const performer = String(session.name || session.email || "Admin");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID laporan diperlukan." },
        { status: 400 }
      );
    }

    await db.delete(auditReports).where(eq(auditReports.id, Number(id)));

    await db.insert(auditLogs).values({
      action: "DELETE",
      entity: "AUDIT_REPORTS",
      entityId: Number(id),
      details: `Deleted report ID #${id} by ${performer}`,
      performedBy: performer,
    });

    return NextResponse.json({ success: true, message: "Laporan berhasil dihapus." });
  } catch (error) {
    console.error("DELETE report error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus laporan." },
      { status: 500 }
    );
  }
}
