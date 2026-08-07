import { NextResponse } from "next/server";
import { generateActionPlanFromRootCause } from "@/lib/aiAudit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, rootCause, severity, area, domain } = body;

    if (!rootCause || rootCause.trim() === "") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Mohon isi Akar Masalah (Root Cause) secara manual terlebih dahulu sebelum membuat Action Plan AI." 
        },
        { status: 400 }
      );
    }

    const actionPlan = await generateActionPlanFromRootCause({
      title,
      description,
      rootCause,
      severity,
      area,
      domain
    });

    return NextResponse.json({
      success: true,
      data: {
        actionPlan
      }
    });

  } catch (error: any) {
    console.error("API Analyze Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Gagal menghasilkan Action Plan dari AI." 
      },
      { status: 500 }
    );
  }
}