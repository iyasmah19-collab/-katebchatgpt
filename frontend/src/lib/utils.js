import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Extract a user-facing error message from an axios error.
 * Prefers the backend's `detail` (Arabic copy on this app) and falls back to
 * the provided generic message. Pydantic 422 returns `detail` as an array of
 * objects — in that case we surface the first issue's message.
 */
export function errMsg(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first?.msg) return first.msg;
  }
  if (err?.message && err.message !== "Network Error") return fallback || err.message;
  return fallback;
}
