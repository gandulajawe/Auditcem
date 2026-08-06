// File: src/app/api/audit/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput } from "@/lib/sanitize";
import { analyzeAuditFindingWithAi } from "@/lib/aiAudit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawDescription = body.description || "";
    const description = sanitizeInput(rawDescription);
    const area = sanitizeInput(body.area || "Cutting");
    const domain = sanitizeInput(body.domain || "MQAA");
    const severity = sanitizeInput(body.severity || "Medium");
    const auditorNotes = sanitizeInput(body.auditorNotes || "");

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Deskripsi temuan minimal 5 karakter untuk dianalisis oleh AI." },
        { status: 400 }
      );
    }

    const result = await analyzeAuditFindingWithAi({
      description,
      area,
      domain,
      severity,
      auditorNotes,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("API audit analyze error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menganalisis temuan audit dengan AI." },
      { status: 500 }
    );
  }
}
