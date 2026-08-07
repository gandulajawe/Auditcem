import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { weeklyCadence, auditLogs } from "@/db/schema";
import { ensureInitialData } from "@/lib/seedData";
import { sanitizeInput } from "@/lib/sanitize";
import { getSession } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    await ensureInitialData();
    const cadences = await db
      .select()
      .from(weeklyCadence)
      .orderBy(asc(weeklyCadence.weekNumber), asc(weeklyCadence.id));

    return NextResponse.json({ success: true, data: cadences });
  } catch (error) {
    console.error("GET weekly cadence error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data ritme mingguan." },
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
    const weekNumber = Number(body.weekNumber) || 1;
    const title = sanitizeInput(body.title || `Minggu ${weekNumber}`);
    const area = sanitizeInput(body.area || "All");
    const mondayTasks = sanitizeInput(body.mondayTasks || "MQAA");
    const tuesdayTasks = sanitizeInput(body.tuesdayTasks || "Review");
    const wednesdayTasks = sanitizeInput(body.wednesdayTasks || "6S & VM");
    const thursdayTasks = sanitizeInput(body.thursdayTasks || "Review");
    const fridayTasks = sanitizeInput(body.fridayTasks || "MQAA, 6S, VM");
    const notes = sanitizeInput(body.notes || "");

    const newCadence = await db
      .insert(weeklyCadence)
      .values({
        weekNumber,
        title,
        area,
        mondayTasks,
        tuesdayTasks,
        wednesdayTasks,
        thursdayTasks,
        fridayTasks,
        mondayStatus: "pending",
        tuesdayStatus: "pending",
        wednesdayStatus: "pending",
        thursdayStatus: "pending",
        fridayStatus: "pending",
        notes,
      })
      .returning();

    await db.insert(auditLogs).values({
      action: "CREATE",
      entity: "WEEKLY_CADENCE",
      entityId: newCadence[0].id,
      details: `Created weekly cadence week #${weekNumber} by ${performer}`,
      performedBy: performer,
    });

    return NextResponse.json({ success: true, data: newCadence[0] });
  } catch (error) {
    console.error("POST weekly cadence error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambah minggu baru." },
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
        { success: false, error: "ID ritme minggu diperlukan." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.weekNumber !== undefined) updateData.weekNumber = Number(body.weekNumber);
    if (body.title !== undefined) updateData.title = sanitizeInput(body.title);
    if (body.area !== undefined) updateData.area = sanitizeInput(body.area);
    if (body.mondayTasks !== undefined) updateData.mondayTasks = sanitizeInput(body.mondayTasks);
    if (body.tuesdayTasks !== undefined) updateData.tuesdayTasks = sanitizeInput(body.tuesdayTasks);
    if (body.wednesdayTasks !== undefined) updateData.wednesdayTasks = sanitizeInput(body.wednesdayTasks);
    if (body.thursdayTasks !== undefined) updateData.thursdayTasks = sanitizeInput(body.thursdayTasks);
    if (body.fridayTasks !== undefined) updateData.fridayTasks = sanitizeInput(body.fridayTasks);
    
    if (body.mondayStatus !== undefined) updateData.mondayStatus = sanitizeInput(body.mondayStatus);
    if (body.tuesdayStatus !== undefined) updateData.tuesdayStatus = sanitizeInput(body.tuesdayStatus);
    if (body.wednesdayStatus !== undefined) updateData.wednesdayStatus = sanitizeInput(body.wednesdayStatus);
    if (body.thursdayStatus !== undefined) updateData.thursdayStatus = sanitizeInput(body.thursdayStatus);
    if (body.fridayStatus !== undefined) updateData.fridayStatus = sanitizeInput(body.fridayStatus);
    if (body.notes !== undefined) updateData.notes = sanitizeInput(body.notes);

    const updated = await db
      .update(weeklyCadence)
      .set(updateData)
      .where(eq(weeklyCadence.id, Number(id)))
      .returning();

    await db.insert(auditLogs).values({
      action: "UPDATE",
      entity: "WEEKLY_CADENCE",
      entityId: Number(id),
      details: `Updated weekly cadence #${id} by ${performer}`,
      performedBy: performer,
    });

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("PATCH weekly cadence error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate ritme mingguan." },
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
        { success: false, error: "ID ritme minggu diperlukan." },
        { status: 400 }
      );
    }

    await db.delete(weeklyCadence).where(eq(weeklyCadence.id, Number(id)));

    await db.insert(auditLogs).values({
      action: "DELETE",
      entity: "WEEKLY_CADENCE",
      entityId: Number(id),
      details: `Deleted weekly cadence #${id} by ${performer}`,
      performedBy: performer,
    });

    return NextResponse.json({ success: true, message: "Minggu berhasil dihapus." });
  } catch (error) {
    console.error("DELETE weekly cadence error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus minggu." },
      { status: 500 }
    );
  }
}
