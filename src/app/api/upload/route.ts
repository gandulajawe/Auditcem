import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Only real image types are accepted. This blocks SVG (can carry inline
// <script>), HTML, and arbitrary file uploads from being hosted at a public
// URL under our domain/blob store.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.auth) {
      return NextResponse.json({ error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawFilename = searchParams.get("filename") || `audit-${Date.now()}.jpg`;
    // Clean filename
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9.-]/g, "_");

    const file = await request.blob();

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file melebihi batas 5MB." }, { status: 400 });
    }

    // Reject anything that isn't a genuine, allow-listed image MIME type.
    if (!file.type || !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Hanya gambar (JPEG, PNG, WEBP, HEIC) yang diizinkan." },
        { status: 400 }
      );
    }

    // If BLOB_READ_WRITE_TOKEN is configured, use Vercel Blob with unique random suffix
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`audit-photos/${cleanFilename}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      return NextResponse.json({ url: blob.url });
    }

    // Fallback if token is not set (e.g., local development) -> Data URL
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "Gagal mengunggah foto." }, { status: 500 });
  }
}
