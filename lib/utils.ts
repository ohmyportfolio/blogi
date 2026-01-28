import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price string for display.
 *
 * - Pure numbers or comma-separated numbers (e.g. "150000", "150,000") → "150,000"
 * - Text like "문의", "200~300만원", "$50" → returned as-is
 * - Does NOT append any currency unit (supports multi-currency use cases)
 */
export function formatPrice(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Check if it's a pure number (possibly with commas already)
  const digitsOnly = trimmed.replace(/,/g, "");
  if (/^\d+$/.test(digitsOnly)) {
    return Number(digitsOnly).toLocaleString("ko-KR");
  }

  // Text-based or mixed price → return as-is
  return trimmed;
}

/**
 * Format price input in real-time (for admin forms).
 * Adds comma separators as the user types numbers.
 * Non-numeric input (e.g. "200~300만원", "$50") is passed through unchanged.
 */
export function formatPriceInput(value: string): string {
  // If it's only digits and commas, treat as numeric input
  const digitsOnly = value.replace(/,/g, "");
  if (/^\d+$/.test(digitsOnly) && digitsOnly.length > 0) {
    return Number(digitsOnly).toLocaleString("ko-KR");
  }

  // Non-numeric or mixed → return original
  return value;
}
