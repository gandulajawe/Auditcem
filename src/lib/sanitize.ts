// File: src/lib/sanitize.ts

/**
 * Sanitizes input data recursively to prevent XSS attacks.
 * Strips dangerous HTML tags (<script>, <iframe>, <object>, <embed>), inline handlers,
 * javascript: and data:text/html schemes.
 */
export function sanitizeString(input: string, maxLength: number = 2000): string {
  if (typeof input !== "string") return "";

  let sanitized = input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove iframe tags and content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Remove object tags and content
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    // Remove embed tags and content
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    // Remove inline event handlers
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/on\w+=\w+/gi, "")
    // Remove javascript: URLs
    .replace(/javascript:[^\s"']*/gi, "")
    // Remove data:text/html URLs
    .replace(/data:text\/html[^\s"']*/gi, "")
    // Strip remaining HTML tags
    .replace(/<[^>]*>?/gm, "")
    // Remove null bytes
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
