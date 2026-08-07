import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsdom (dipakai oleh isomorphic-dompurify di sisi server) menarik
  // dependency yang pure-ESM (@exodus/bytes via html-encoding-sniffer).
  // Kalau ikut di-bundle oleh Turbopack, require()-nya gagal saat runtime
  // di Vercel (ERR_REQUIRE_ESM). Dengan menandainya sebagai "external",
  // paket ini di-load langsung dari node_modules saat runtime, bukan
  // dibundel jadi satu file CommonJS.
  serverExternalPackages: ["jsdom", "isomorphic-dompurify"],
};

export default nextConfig;