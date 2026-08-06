// File: src/app/actions/auditActions.ts
"use server";

import { db } from "@/db";
import { audits, auditFindings, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { sanitizeInput } from "@/lib/sanitize";
import { analyzeAuditFindingWithAi } from "@/lib/aiAudit";
import { revalidatePath } from "next/cache";

export interface FindingInputItem {
  findingDescription: string;
  isKaizenEscalated?: boolean;
}

export interface CreateAuditInput {
  area: string;
  lineNumber: string;
  findings: FindingInputItem[];
}

export interface AIFindingAnalysis {
  findingDescription: string;
  rootCause: string;
  capaRecommendation: string;
  isKaizenEscalated?: boolean;
}

export interface CreateAuditResult {
  success: boolean;
  auditId?: number;
  message?: string;
  error?: string;
  analysisResults?: AIFindingAnalysis[];
}

/**
 * Server Action to process audit findings array with Gemini AI,
 * save Header to `audits` table, and loop-save detail results to `audit_findings` table.
 */
export async function processAndSaveAuditAction(
  input: CreateAuditInput
): Promise<CreateAuditResult> {
  try {
    const session = await getSession();
    const performer = String(session?.name || session?.email || "Auditor");

    const area = sanitizeInput(input.area || "Cutting");
    const lineNumber = sanitizeInput(input.lineNumber || "Line 01");
    const rawFindings = Array.isArray(input.findings) ? input.findings : [];

    const validFindings = rawFindings
      .map((f) => ({
        findingDescription: sanitizeInput(f.findingDescription || "").trim(),
        isKaizenEscalated: Boolean(f.isKaizenEscalated),
      }))
      .filter((f) => f.findingDescription.length > 0);

    if (!lineNumber) {
      return { success: false, error: "Line / Nomor Mesin wajib diisi." };
    }

    if (validFindings.length === 0) {
      return { success: false, error: "Minimal 1 deskripsi temuan lapangan wajib diisi." };
    }

    const aiAnalysisList: AIFindingAnalysis[] = [];

    for (const fItem of validFindings) {
      const aiResult = await analyzeAuditFindingWithAi({
        description: fItem.findingDescription,
        area,
      });

      aiAnalysisList.push({
        findingDescription: fItem.findingDescription,
        rootCause: aiResult.rootCause,
        capaRecommendation: aiResult.actionPlan,
        isKaizenEscalated: fItem.isKaizenEscalated,
      });
    }

    // Database Insertion:
    // a. Insert Header into `audits` table
    const [insertedAudit] = await db
      .insert(audits)
      .values({
        area,
        lineNumber,
      })
      .returning();

    const auditId = insertedAudit.id;

    // b. Loop & Insert detail results into `audit_findings` table
    const findingsToInsert = aiAnalysisList.map((item, idx) => ({
      auditId,
      findingDescription: item.findingDescription,
      aiRootCause: item.rootCause,
      aiCapa: item.capaRecommendation,
      isKaizenEscalated: validFindings[idx]?.isKaizenEscalated || false,
    }));

    await db.insert(auditFindings).values(findingsToInsert);

    // c. Audit Log Record with real user from session
    await db.insert(auditLogs).values({
      action: "CREATE",
      entity: "AUDITS",
      entityId: auditId,
      details: `Saved Audit Header ID #${auditId} (${area} / ${lineNumber}) with ${findingsToInsert.length} detail findings`,
      performedBy: performer,
    });

    revalidatePath("/");

    return {
      success: true,
      auditId,
      message: `Audit #${auditId} (${area} - ${lineNumber}) berhasil disimpan ke database beserta ${findingsToInsert.length} analisis AI!`,
      analysisResults: aiAnalysisList,
    };
  } catch (error: any) {
    console.error("processAndSaveAuditAction Server Action Error:", error);
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan server saat memproses audit.",
    };
  }
}
