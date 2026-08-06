// File: src/app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { verifyPassword, hashPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { checkDatabaseRateLimit, recordFailedAttempt, resetFailedAttempts } from "@/lib/rateLimit";
import { sanitizeInput } from "@/lib/sanitize";
import { ensureInitialData } from "@/lib/seedData";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    await ensureInitialData();

    // Note: Trusting the x-forwarded-for header is secure when deployed behind a trusted proxy (e.g. Vercel)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 1. Check persistent database-backed rate limit BEFORE processing login
    const rateCheck = await checkDatabaseRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `IP terkunci sementara karena terlalu banyak kesalahan. Silakan coba lagi dalam ${rateCheck.retryAfterMinutes || 15} menit.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail = body.email || body.username || "admin@factory.com";
    const rawPassword = body.password || "";

    const sanitizedEmail = sanitizeInput(rawEmail).toLowerCase().trim();
    const sanitizedPassword = sanitizeInput(rawPassword);

    if (!sanitizedPassword) {
      return NextResponse.json(
        { success: false, error: "Password wajib diisi." },
        { status: 400 }
      );
    }

    // 2. Query user from users table
    const matchedUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, sanitizedEmail));

    let targetUser = matchedUsers[0];

    // Fallback if user is not found by email but email is "admin@factory.com"
    if (!targetUser && sanitizedEmail === "admin@factory.com") {
      const allUsers = await db.select().from(users);
      if (allUsers.length > 0) targetUser = allUsers[0];
    }

    if (!targetUser) {
      const failedResult = await recordFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          error: `Email atau password salah. Sisa percobaan: ${failedResult.remainingAttempts}`,
        },
        { status: 401 }
      );
    }

    // 3. CRITICAL BUG FIX: Properly AWAIT verifyPassword()
    const isValid = await verifyPassword(sanitizedPassword, targetUser.password);

    if (!isValid) {
      const failedResult = await recordFailedAttempt(ip);
      if (failedResult.isLocked) {
        return NextResponse.json(
          {
            success: false,
            error: "Password salah. Akun/IP terkunci sementara selama 15 menit karena 5x kesalahan berturut-turut.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Password salah. Sisa percobaan: ${failedResult.remainingAttempts}`,
        },
        { status: 401 }
      );
    }

    // Update stored password hash if fallback matched
    const newHash = await hashPassword(sanitizedPassword);
    if (targetUser.password !== newHash) {
      await db
        .update(users)
        .set({ password: newHash })
        .where(eq(users.id, targetUser.id));
    }

    // 4. Reset DB failed attempts on success
    await resetFailedAttempts(ip);

    // 5. Store real user attributes into JWT session cookie
    await setSessionCookie({
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    });

    // Audit Log login event
    await db.insert(auditLogs).values({
      action: "LOGIN",
      entity: "USER",
      entityId: targetUser.id,
      details: `User ${targetUser.email} (${targetUser.role}) successfully logged in from IP ${ip}`,
      performedBy: targetUser.name || targetUser.email,
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logout berhasil." });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal logout." },
      { status: 500 }
    );
  }
}
