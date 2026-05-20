import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Start of "today" in WIB (UTC+7) as a UTC Date. The server runs in UTC, so we
 * derive the WIB midnight boundary explicitly instead of relying on the host's
 * local day. Used for "verified/rejected today" counts.
 */
export function startOfTodayWIB(): Date {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const nowWIB = new Date(Date.now() + WIB_OFFSET_MS);
  const wibMidnightUTC = Date.UTC(nowWIB.getUTCFullYear(), nowWIB.getUTCMonth(), nowWIB.getUTCDate());
  return new Date(wibMidnightUTC - WIB_OFFSET_MS);
}
