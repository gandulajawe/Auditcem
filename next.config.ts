import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @google/genai ships a conditional-exports package (separate node/web
  // builds). Vercel's automatic serverless-function file tracing sometimes
  // fails to pick up the actual runtime file behind those exports when the
  // package is bundled by webpack/Turbopack, causing a runtime crash:
  // "Cannot find module '.../@google/genai/dist/node/index.cjs'"
  // (FUNCTION_INVOCATION_FAILED) even though the build itself succeeds.
  // Marking it external makes Next.js load it directly via Node's own
  // require() from node_modules at runtime instead of bundling it.
  serverExternalPackages: ["@google/genai"],
};

export default nextConfig;
