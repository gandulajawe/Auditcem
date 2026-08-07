"use server";

import { db } from "@/db";
import { auditReports as audits, auditChecklists as auditFindings, auditLogs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { sanitizeInput } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

export interface AIFindingAnalysis {
  title?: string;
  description?: string;
  findingDescription?: string;
  category?: string;
  issueCategory?: string;
  rootCause?: string;
  actionPlan?: string;
  lessonLearned?: string;
  severity?: string;
  [key: string]: any;
}

export async function processAndSaveAuditAction(payload: any) {
  try {
    const session = await getSession();
    if (!session || !session.auth) {
      return {
        success: false,
        error: "Sesi tidak ditemukan. Silakan login terlebih dahulu.",
      };
    }

    const performer = String(session.name || session.email || "Auditor");
    
    const area = sanitizeInput(payload?.area || "Cutting");
    const lineNumber = sanitizeInput(payload?.lineNumber || "") || null;
    const rawFindings = Array.isArray(payload?.findings) ? payload.findings : [payload];

    const insertedRecords = [];

    for (const item of rawFindings) {
      if (!item) continue;
      const title = sanitizeInput(item.title || item.description || "Temuan Audit Baru");
      const domain = sanitizeInput(item.domain || payload?.domain || "MQAA");
      const findingDescription = sanitizeInput(item.findingDescription || item.description || title);
      const rootCause = sanitizeInput(item.rootCause || item.aiAnalysis?.rootCause || "-");
      const actionPlan = sanitizeInput(item.actionPlan || item.aiAnalysis?.actionPlan || "-");
      const lessonLearned = sanitizeInput(item.lessonLearned || item.aiAnalysis?.lessonLearned || "-");
      const severity = sanitizeInput(item.severity || item.aiAnalysis?.severity || "Medium");
      const status = sanitizeInput(item.status || "Open");
      const auditDate = sanitizeInput(item.auditDate || payload?.auditDate || new Date().toISOString().split("T")[0]);
      const issueCategory = sanitizeInput(item.issueCategory || item.aiAnalysis?.category || "") || null;

      const [inserted] = await db
        .insert(audits)
        .values({
          title,
          area,
          lineNumber,
          domain,
          findingDescription,
          rootCause,
          actionPlan,
          lessonLearned,
          auditorName: performer,
          severity,
          status,
          auditDate,
          issueCategory,
        })
        .returning();

      insertedRecords.push(inserted);

      await db.insert(auditLogs).values({
        action: "CREATE",
        entity: "AUDIT_REPORT",
        entityId: inserted.id,
        details: "Membuat laporan audit baru " + title + " di area " + area,
        performedBy: performer,
      });
    }

    revalidatePath("/audit");
    revalidatePath("/analytics");

    return {
      success: true,
      message: "Audit & temuan lapangan berhasil disimpan!",
      data: insertedRecords,
      auditId: insertedRecords[0]?.id,
      analysisResults: rawFindings.map((item: any) => item.aiAnalysis || null),
    };
  } catch (error) {
    console.error("Error processAndSaveAuditAction:", error);
    return {
      success: false,
      error: "Gagal memproses dan menyimpan laporan audit.",
    };
  }
}

export async function createAuditAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || !session.auth) {
      return { success: false, error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." };
    }

    const performer = String(session.name || session.email || "Auditor");

    const title = sanitizeInput(String(formData.get("title") || "Temuan Audit Baru"));
    const area = sanitizeInput(String(formData.get("area") || "Cutting"));
    const lineNumber = sanitizeInput(String(formData.get("lineNumber") || "")) || null;
    const domain = sanitizeInput(String(formData.get("domain") || "MQAA"));
    const findingDescription = sanitizeInput(String(formData.get("findingDescription") || title));
    const rootCause = sanitizeInput(String(formData.get("rootCause") || "-"));
    const actionPlan = sanitizeInput(String(formData.get("actionPlan") || "-"));
    const lessonLearned = sanitizeInput(String(formData.get("lessonLearned") || "-"));
    const severity = sanitizeInput(String(formData.get("severity") || "Medium"));
    const status = sanitizeInput(String(formData.get("status") || "Open"));
    const auditDate = sanitizeInput(String(formData.get("auditDate") || new Date().toISOString().split("T")[0]));

    const [insertedAudit] = await db
      .insert(audits)
      .values({
        title,
        area,
        lineNumber,
        domain,
        findingDescription,
        rootCause,
        actionPlan,
        lessonLearned,
        auditorName: performer,
        severity,
        status,
        auditDate,
      })
      .returning();

    await db.insert(auditLogs).values({
      action: "CREATE",
      entity: "AUDIT_REPORT",
      entityId: insertedAudit.id,
      details: "Membuat laporan audit baru " + title + " di area " + area,
      performedBy: performer,
    });

    revalidatePath("/audit");
    revalidatePath("/analytics");

    return {
      success: true,
      message: "Laporan audit berhasil disimpan!",
      data: insertedAudit,
      auditId: insertedAudit.id,
    };
  } catch (error) {
    console.error("Error createAuditAction:", error);
    return { success: false, error: "Gagal menyimpan laporan audit." };
  }
}