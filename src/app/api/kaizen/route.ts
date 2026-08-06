// File: src/app/api/kaizen/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { kaizenPdca, auditFindings } from "@/db/schema";
import { sanitizeInput } from "@/lib/sanitize";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const findingId = searchParams.get("findingId");

    if (!findingId) {
      const allKaizen = await db.select().from(kaizenPdca);
      return NextResponse.json({ success: true, data: allKaizen });
    }

    const records = await db
      .select()
      .from(kaizenPdca)
      .where(eq(kaizenPdca.findingId, Number(findingId)));

    if (records.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: records[0] });
  } catch (error: any) {
    console.error("GET /api/kaizen error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data Kaizen PDCA." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const findingId = Number(body.findingId);

    if (!findingId) {
      return NextResponse.json(
        { success: false, error: "findingId wajib diisi." },
        { status: 400 }
      );
    }

    const problemSituation = sanitizeInput(body.problemSituation || "");
    const breakdown4H1W = sanitizeInput(body.breakdown4H1W || "");
    const targetSetting = sanitizeInput(body.targetSetting || "");
    const fishboneData = sanitizeInput(body.fishboneData || "");
    const rootCause5Why = sanitizeInput(body.rootCause5Why || "");
    const actionPlan = sanitizeInput(body.actionPlan || "");
    const evaluationResults = sanitizeInput(body.evaluationResults || "");
    const standardizationSOP = sanitizeInput(body.standardizationSOP || "");
    const beforePhotoUrl = sanitizeInput(body.beforePhotoUrl || "");
    const afterPhotoUrl = sanitizeInput(body.afterPhotoUrl || "");

    // Check if entry already exists
    const existing = await db
      .select()
      .from(kaizenPdca)
      .where(eq(kaizenPdca.findingId, findingId));

    let resultRecord;

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(kaizenPdca)
        .set({
          problemSituation,
          breakdown4H1W,
          targetSetting,
          fishboneData,
          rootCause5Why,
          actionPlan,
          evaluationResults,
          standardizationSOP,
          beforePhotoUrl,
          afterPhotoUrl,
        })
        .where(eq(kaizenPdca.findingId, findingId))
        .returning();
      resultRecord = updated;
    } else {
      // Insert new
      const [inserted] = await db
        .insert(kaizenPdca)
        .values({
          findingId,
          problemSituation,
          breakdown4H1W,
          targetSetting,
          fishboneData,
          rootCause5Why,
          actionPlan,
          evaluationResults,
          standardizationSOP,
          beforePhotoUrl,
          afterPhotoUrl,
        })
        .returning();
      resultRecord = inserted;
    }

    // Also set isKaizenEscalated = true on auditFindings
    await db
      .update(auditFindings)
      .set({ isKaizenEscalated: true })
      .where(eq(auditFindings.id, findingId));

    return NextResponse.json({ success: true, data: resultRecord });
  } catch (error: any) {
    console.error("POST /api/kaizen error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan Lembar Kaizen PDCA." },
      { status: 500 }
    );
  }
}
