// File: src/lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes input data to prevent XSS attacks.
 *
 * Uses DOMPurify (a real HTML parser, via isomorphic-dompurify so it also
 * runs server-side under Node) instead of hand-written regexes. Every field
 * sanitized here (finding descriptions, root cause, action plans, etc.) is
 * meant to be plain text, so we configure DOMPurify to strip ALL tags and
 * attributes — output is text content only, with no HTML surviving at all.
 * This closes bypasses that regex-based stripping is prone to (nested or
 * obfuscated markup, unusual attribute spacing/casing, HTML entity tricks,
 * malformed-but-browser-tolerant tag soup), because DOMPurify actually
 * parses the DOM tree rather than pattern-matching text.
 */
export function sanitizeString(input: string, maxLength: number = 2000): string {
  if (typeof input !== "string") return "";

  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
    // DOMPurify with no allowed tags returns text content only, but we still
    // strip stray null bytes and normalize whitespace defensively.
    .replace(/\0/g, "")
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

export function sanitizeInput(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return sanitizeString(data);
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeInput(item));
  }

  if (typeof data === "object") {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      sanitizedObj[key] = sanitizeInput(data[key]);
    }
    return sanitizedObj;
  }

  return data;
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  return sanitizeInput(obj) as T;
}
