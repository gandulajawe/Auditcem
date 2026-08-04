import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
