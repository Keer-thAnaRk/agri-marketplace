import { FreshnessResult, FreshnessStatus } from '@/types';

function clampPercentage(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function resolveDate(input: string | Date | undefined | null, fallback: Date): Date {
  if (!input) return fallback;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? fallback : input;
  }
  return fallback;
}

/**
 * Parses various date formats used in the Krishi Market application.
 * Accepts ISO string, Date object, or human readable dates like "Sept 24, 2026" / "Today, 5:30 AM".
 */
export function parseHarvestDate(
  harvestDate: string | Date | null | undefined,
  referenceDate: Date = new Date()
): Date {
  const ref = Number.isNaN(referenceDate.getTime()) ? new Date() : referenceDate;
  if (!harvestDate) return ref;

  if (harvestDate instanceof Date) {
    return Number.isNaN(harvestDate.getTime()) ? ref : harvestDate;
  }

  if (typeof harvestDate !== 'string') return ref;
  const lower = harvestDate.toLowerCase().trim();
  if (!lower) return ref;

  if (lower.startsWith('today')) {
    const d = new Date(ref);
    const timeMatch = lower.match(/(\d+):(\d+)\s*(am|pm)?/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const mins = parseInt(timeMatch[2], 10);
      const meridiem = timeMatch[3];
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      d.setHours(hours, mins, 0, 0);
    } else {
      d.setHours(6, 0, 0, 0);
    }
    return d;
  }

  if (lower.startsWith('yesterday')) {
    const d = new Date(ref);
    d.setDate(d.getDate() - 1);
    d.setHours(6, 0, 0, 0);
    return d;
  }

  const daysAgoMatch = lower.match(/(\d+)\s*days?\s*ago/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const d = new Date(ref);
    d.setDate(d.getDate() - days);
    return d;
  }

  const parsed = new Date(harvestDate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const normalized = harvestDate.replace(/Sept\b/g, 'Sep');
  const monthParsed = new Date(normalized);
  if (!Number.isNaN(monthParsed.getTime())) {
    return monthParsed;
  }

  return ref;
}

/**
 * Calculates real-time freshness percentage, days remaining, and status.
 *
 * Statuses:
 * - Fresh: 75–100%
 * - Good: 40–74%
 * - Use Soon: 1–39%
 * - Expired: 0%
 */
export function calculateFreshness(
  harvestDateInput: string | Date | null | undefined,
  shelfLifeDays: number = 7,
  currentDateInput?: string | Date
): FreshnessResult {
  const currentDate = currentDateInput
    ? resolveDate(currentDateInput, new Date())
    : new Date();

  const harvestDate = parseHarvestDate(harvestDateInput, currentDate);

  const parsedShelf = Number(shelfLifeDays);
  const safeShelfLife = Number.isFinite(parsedShelf) && parsedShelf > 0 ? parsedShelf : 1;
  const totalShelfLifeMs = safeShelfLife * 24 * 60 * 60 * 1000;

  const harvestMs = harvestDate.getTime();
  const currentMs = currentDate.getTime();
  const elapsedMs = Number.isFinite(harvestMs) && Number.isFinite(currentMs)
    ? Math.max(0, currentMs - harvestMs)
    : 0;
  const hoursAgo = Math.round(elapsedMs / (1000 * 60 * 60));

  const remainingMs = totalShelfLifeMs - elapsedMs;
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  const percentage = clampPercentage((remainingMs / totalShelfLifeMs) * 100);

  let status: FreshnessStatus = 'Fresh';
  if (percentage === 0) {
    status = 'Expired';
  } else if (percentage < 40) {
    status = 'Use Soon';
  } else if (percentage < 75) {
    status = 'Good';
  } else {
    status = 'Fresh';
  }

  const isExpired = status === 'Expired' || percentage === 0;
  const isApproachingExpiry = !isExpired && (daysRemaining <= 2 || percentage < 40);

  let label = `${percentage}% Fresh`;
  if (status === 'Expired') {
    label = 'Expired (0%)';
  } else if (status === 'Use Soon') {
    label = `${percentage}% • Use Soon (${daysRemaining}d left)`;
  } else if (status === 'Good') {
    label = `${percentage}% • Good (${daysRemaining}d left)`;
  }

  return {
    percentage,
    status,
    daysRemaining,
    hoursAgo: Number.isFinite(hoursAgo) ? hoursAgo : 0,
    label,
    isApproachingExpiry,
    isExpired,
  };
}
