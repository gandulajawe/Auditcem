// File: src/app/api/presentation/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditReports, kaizenPdca, auditLogs, appSettings } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { sanitizeInput } from "@/lib/sanitize";
import { matchesMonthTimeline } from "@/lib/dateUtils";
import { generatePresentationOutline, PresentationDataSource } from "@/lib/aiPresentation";
import { getGeminiDailyEstimate } from "@/lib/geminiConfig";
import { desc, eq } from "drizzle-orm";

// Gemini free tier has both a per-minute AND a per-day request cap. This
// cooldown is DB-backed (not in-memory) so it stays consistent across
// serverless cold starts / parallel instances, same pattern as login
// rate-limiting. It protects against accidental double-clicks or rapid
// re-generation burning through the daily free quota.
const GENERATE_COOLDOWN_SECONDS = 30;
const COOLDOWN_SETTINGS_KEY = "presentation_last_generated_at";

async function checkGenerateCooldown(): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, COOLDOWN_SETTINGS_KEY));
  if (rows.length === 0) return { allowed: true };

  const lastGeneratedAt = new Date(rows[0].value).getTime();
  const elapsedSeconds = (Date.now() - lastGeneratedAt) / 1000;

  if (elapsedSeconds < GENERATE_COOLDOWN_SECONDS) {
    return { allowed: false, retryAfterSeconds: Math.ceil(GENERATE_COOLDOWN_SECONDS - elapsedSeconds) };
  }
  return { allowed: true };
}

async function recordGenerateTimestamp(): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(appSettings)
    .values({ key: COOLDOWN_SETTINGS_KEY, value: now })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: now, updatedAt: new Date() } });
}

// Gemini's own RPD quota resets at midnight Pacific Time, so the daily
// counter key is derived from the Pacific-time date to stay in sync with
// Google's actual reset schedule (not the server's local/UTC date).
function getPacificDateKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA formats as YYYY-MM-DD
}

// Only counts actual Gemini API calls (success or quota-exceeded), not
// requests served by the rule-based fallback when no API key is configured —
// those never touch Gemini's quota at all.
async function incrementAndGetDailyGeminiCalls(didCallGemini: boolean): Promise<number> {
  const key = `presentation_gemini_calls_${getPacificDateKey()}`;
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, key));
  const current = rows.length > 0 ? parseInt(rows[0].value, 10) || 0 : 0;
  const next = didCallGemini ? current + 1 : current;

  if (didCallGemini) {
    await db
      .insert(appSettings)
      .values({ key, value: String(next) })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: String(next), updatedAt: new Date() } });
  }
  return next;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.auth) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    // Cooldown check BEFORE calling Gemini — protects the free-tier quota
    // from accidental double-clicks or rapid repeated generation.
    const cooldown = await checkGenerateCooldown();
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Mohon tunggu ${cooldown.retryAfterSeconds} detik sebelum generate outline lagi (proteksi kuota Gemini free tier).`,
        },
        { status: 429 }
      );
    }

    // Record the cooldown timestamp now (request accepted) rather than after
    // Gemini responds, so a second click while the first request is still
    // in-flight is also blocked.
    await recordGenerateTimestamp();

    const body = await request.json();
    const dataSource = sanitizeInput(body.dataSource || "combined") as PresentationDataSource;
    const dateMode = sanitizeInput(body.dateMode || "all");
    const startDate = sanitizeInput(body.startDate || "");
    const endDate = sanitizeInput(body.endDate || "");
    const selectedMonth = sanitizeInput(body.selectedMonth || "");
    const selectedDomain = sanitizeInput(body.selectedDomain || "All");
    const selectedArea = sanitizeInput(body.selectedArea || "All");

    if (!["audit", "kaizen", "combined"].includes(dataSource)) {
      return NextResponse.json({ success: false, error: "Sumber data tidak valid." }, { status: 400 });
    }

    let auditRecords: Record<string, unknown>[] = [];
    let kaizenRecords: Record<string, unknown>[] = [];

    if (dataSource === "audit" || dataSource === "combined") {
      const allReports = await db.select().from(auditReports).orderBy(desc(auditReports.createdAt));

      auditRecords = allReports.filter((report) => {
        const repDateClean = report.auditDate ? String(report.auditDate).split("T")[0] : "";

        if (dateMode === "range") {
          if (startDate && repDateClean < startDate) return false;
          if (endDate && repDateClean > endDate) return false;
        } else if (dateMode === "month" && selectedMonth) {
          if (!matchesMonthTimeline(repDateClean, selectedMonth)) return false;
        }

        if (selectedDomain !== "All" && report.domain !== selectedDomain) return false;
        if (selectedArea !== "All" && report.area !== selectedArea) return false;
        return true;
      });
    }

    if (dataSource === "kaizen" || dataSource === "combined") {
      const allKaizen = await db.select().from(kaizenPdca).orderBy(desc(kaizenPdca.createdAt));

      kaizenRecords = allKaizen.filter((k) => {
        const kDateClean = k.createdAt ? new Date(k.createdAt).toISOString().split("T")[0] : "";

        if (dateMode === "range") {
          if (startDate && kDateClean < startDate) return false;
          if (endDate && kDateClean > endDate) return false;
        } else if (dateMode === "month" && selectedMonth) {
          if (!matchesMonthTimeline(kDateClean, selectedMonth)) return false;
        }
        return true;
      });
    }

    let scopeLabel = "Seluruh Data";
    if (dateMode === "range" && (startDate || endDate)) {
      scopeLabel = `Rentang ${startDate || "Mulai"} s/d ${endDate || "Sekarang"}`;
    } else if (dateMode === "month" && selectedMonth) {
      scopeLabel = `Bulan ${selectedMonth}`;
    }
    if (selectedDomain !== "All") scopeLabel += ` • Domain ${selectedDomain}`;
    if (selectedArea !== "All") scopeLabel += ` • Area ${selectedArea}`;

    const result = await generatePresentationOutline({
      dataSource,
      scopeLabel,
      auditRecords: auditRecords as Record<string, unknown>[],
      kaizenRecords: kaizenRecords as Record<string, unknown>[],
    });

    // Only "success" and "quota_exceeded" represent an actual call that hit
    // Gemini's servers (and thus counts against its daily quota). "no_api_key"
    // means the rule-based fallback ran without ever calling Gemini.
    const didCallGemini = result.geminiStatus === "success" || result.geminiStatus === "quota_exceeded";
    const dailyGeminiCalls = await incrementAndGetDailyGeminiCalls(didCallGemini);
    const dailyEstimate = getGeminiDailyEstimate();

    const performer = String(session.name || session.email || "Auditor");
    await db.insert(auditLogs).values({
      action: "CREATE",
      entity: "PRESENTATION",
      details: `Generate outline PPT (sumber: ${dataSource}, cakupan: ${scopeLabel}, status Gemini: ${result.geminiStatus})`,
      performedBy: performer,
    });

    return NextResponse.json({
      success: true,
      data: {
        outline: result.outline,
        meta: {
          dataSource,
          scopeLabel,
          auditCount: auditRecords.length,
          kaizenCount: kaizenRecords.length,
          geminiStatus: result.geminiStatus,
          dailyGeminiCalls,
          dailyEstimate, // null unless the user set GEMINI_DAILY_ESTIMATE themselves
        },
      },
    });
  } catch (error) {
    console.error("POST /api/presentation/generate error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat outline presentasi. Coba lagi." },
      { status: 500 }
    );
  }
}
