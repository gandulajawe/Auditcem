import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, resetFailedAttempts } from "@/lib/rateLimit";
import { sanitizeInput } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    // Check rate limiting
    const rateCheck = await checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan gagal. Silakan coba lagi dalam ${rateCheck.retryAfterMinutes || 15} menit.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawPassword = body.password || "";
    const sanitizedPassword = sanitizeInput(rawPassword);

    if (!sanitizedPassword) {
      return NextResponse.json(
        { success: false, error: "Password wajib diisi." },
        { status: 400 }
      );
    }

    const isValid = verifyPassword(sanitizedPassword);

    if (!isValid) {
      const failedResult = await recordFailedAttempt(ip);
      if (failedResult.isLocked) {
        return NextResponse.json(
          {
            success: false,
            error: "Password salah. Akun terkunci sementara selama 15 menit karena 5x kesalahan berturut-turut.",
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

    // Success login -> reset failed attempts and set session cookie
    await resetFailedAttempts(ip);
    await setSessionCookie();

    return NextResponse.json({ success: true, message: "Login berhasil." });
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
