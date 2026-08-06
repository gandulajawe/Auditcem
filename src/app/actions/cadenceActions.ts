// File: src/app/actions/cadenceActions.ts
"use server";

import { db } from "@/db";
import { weeklyReports } from "@/db/schema";
import { sanitizeInput } from "@/lib/sanitize";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface UpdateCadenceDayInput {
  id: number;
  dayTaskKey: string;
  taskValue: string;
  dayStatusKey: string;
  statusValue: string;
}

export async function saveWeeklyCadenceAction(
  id: number,
  data: Record<string, any>
) {
  try {
    const updateData: Record<string, any> = {};

    if (data.title) updateData.title = sanitizeInput(data.title);
    if (data.area) updateData.area = sanitizeInput(data.area);
    if (data.mondayTasks !== undefined) updateData.mondayTasks = sanitizeInput(data.mondayTasks);
    if (data.tuesdayTasks !== undefined) updateData.tuesdayTasks = sanitizeInput(data.tuesdayTasks);
    if (data.wednesdayTasks !== undefined) updateData.wednesdayTasks = sanitizeInput(data.wednesdayTasks);
    if (data.thursdayTasks !== undefined) updateData.thursdayTasks = sanitizeInput(data.thursdayTasks);
    if (data.fridayTasks !== undefined) updateData.fridayTasks = sanitizeInput(data.fridayTasks);
    if (data.notes !== undefined) updateData.notes = sanitizeInput(data.notes);

    const [updated] = await db
      .update(weeklyReports)
      .set(updateData)
      .where(eq(weeklyReports.id, id))
      .returning();

    revalidatePath("/cadence");
    revalidatePath("/");

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("saveWeeklyCadenceAction error:", error);
    return { success: false, error: error?.message || "Gagal menyimpan jadwal minggu." };
  }
}
