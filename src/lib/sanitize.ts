/**
 * Sanitizes input strings to prevent XSS and malicious scripts.
 * Strips <script>, <iframe>, <object>, <embed> tags and their content.
 * Blocks javascript: and data:text/html URLs.
 * Truncates string to maxLength (default 2000 characters).
 */
export function sanitizeInput(input: unknown, maxLength: number = 2000): string {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input
    // Remove potential script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove potential iframe tags and content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Remove potential object tags and content
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    // Remove potential embed tags and content
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    // Remove inline event handlers like onload, onerror, etc.
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/on\w+=\w+/gi, "")
    // Remove javascript: URLs
    .replace(/javascript:[^\s"']*/gi, "")
    // Remove data:text/html URLs
    .replace(/data:text\/html[^\s"']*/gi, "")
    // Strip HTML tags if any (keep plain text for safety)
    .replace(/<[^>]*>?/gm, "")
    // Remove null bytes
    .replace(/\0/g, "")
    .trim();

  // Enforce maxLength
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Helper to recursively sanitize values (strings, arrays, nested objects).
 */
export function sanitizeValue<T>(val: T, maxLength: number = 2000): T {
  if (typeof val === "string") {
    return sanitizeInput(val, maxLength) as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(item, maxLength)) as unknown as T;
  }
  if (val !== null && typeof val === "object" && val.constructor === Object) {
    return sanitizeObject(val as Record<string, unknown>, maxLength) as unknown as T;
  }
  return val;
}

/**
 * Object sanitizer helper that handles nested objects and arrays of strings recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxLength: number = 2000
): T {
  if (!obj || typeof obj !== "object") return obj;
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      sanitized[key] = sanitizeValue(sanitized[key], maxLength);
    }
  }
  return sanitized;
}
