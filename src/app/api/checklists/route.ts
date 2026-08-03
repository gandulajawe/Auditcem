import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditChecklists } from "@/db/schema";
import { ensureInitialData } from "@/lib/seedData";
import { sanitizeInput } from "@/lib/sanitize";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    await ensureInitialData();
    const checklists = await db
      .select()
      .from(auditChecklists)
      .orderBy(asc(auditChecklists.month), asc(auditChecklists.orderIndex), asc(auditChecklists.id));

    return NextResponse.json({ success: true, data: checklists });
  } catch (error) {
    console.error("GET checklists error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data checklist." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const month = sanitizeInput(body.month || "September");
    const domain = sanitizeInput(body.domain || "MQAA");
    const title = sanitizeInput(body.title || "");
    const description = sanitizeInput(body.description || "");
    const area = sanitizeInput(body.area || "All");
    const auditDate = body.auditDate ? sanitizeInput(body.auditDate) : null;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Judul checklist tidak boleh kosong." },
        { status: 400 }
      );
    }

    const newChecklist = await db
      .insert(auditChecklists)
      .values({
        month,
        domain,
        title,
        description,
        area,
        auditDate,
        completed: false,
        isCustom: true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newChecklist[0] });
  } catch (error) {
    console.error("POST checklist error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambah item checklist." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, completed, title, description, domain, area, month, auditDate } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID checklist diperlukan." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (typeof completed === "boolean") {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
    }
    if (title !== undefined) updateData.title = sanitizeInput(title);
    if (description !== undefined) updateData.description = sanitizeInput(description);
    if (domain !== undefined) updateData.domain = sanitizeInput(domain);
    if (area !== undefined) updateData.area = sanitizeInput(area);
    if (month !== undefined) updateData.month = sanitizeInput(month);
    if (auditDate !== undefined) updateData.auditDate = auditDate ? sanitizeInput(auditDate) : null;

    const updated = await db
      .update(auditChecklists)
      .set(updateData)
      .where(eq(auditChecklists.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("PATCH checklist error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui status checklist." },
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
        { success: false, error: "ID checklist diperlukan." },
        { status: 400 }
      );
    }

    await db.delete(auditChecklists).where(eq(auditChecklists.id, Number(id)));

    return NextResponse.json({ success: true, message: "Checklist berhasil dihapus." });
  } catch (error) {
    console.error("DELETE checklist error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus checklist." },
      { status: 500 }
    );
  }
}
