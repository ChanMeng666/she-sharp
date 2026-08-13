import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Builds uppercase initials from a person's name.
 *
 * @param str The name to reduce. Nullish or blank input yields the fallback.
 * @param opts.max Keep at most this many initials (avatar chips use 2).
 * @param opts.fallback Rendered when there is no usable name. Defaults to "?".
 */
export const getInitials = (
  str: string | null | undefined,
  opts?: { max?: number; fallback?: string }
): string => {
  const fallback = opts?.fallback ?? "?"
  if (typeof str !== "string" || !str.trim()) return fallback

  const initials = str
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  if (!initials) return fallback

  return opts?.max === undefined ? initials : initials.slice(0, opts.max)
}

/**
 * Initials for an `<AvatarFallback>`: at most two, uppercase, "U" when unknown.
 *
 * This is what every avatar in the dashboard had reimplemented locally.
 */
export const getAvatarInitials = (name: string | null | undefined): string =>
  getInitials(name, { max: 2, fallback: "U" })

export function formatCurrency(
  amount: number,
  opts?: {
    currency?: string
    locale?: string
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    noDecimals?: boolean
  }
) {
  const { currency = "USD", locale = "en-US", minimumFractionDigits, maximumFractionDigits, noDecimals } = opts ?? {}

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : minimumFractionDigits,
    maximumFractionDigits: noDecimals ? 0 : maximumFractionDigits,
  }

  return new Intl.NumberFormat(locale, formatOptions).format(amount)
}

/**
 * Serializes an object by converting Date instances to ISO strings.
 * This is necessary for passing data from Server Components to Client Components.
 */
export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeData(value);
    }
    return serialized as T;
  }

  return data;
}

/**
 * Masks an email address for display, showing only the first character
 * of the local part and the full domain.
 * Example: "nanthan.singaravel@myob.com" → "n***@myob.com"
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '***';
  const local = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  return `${local.charAt(0)}***${domain}`;
}
