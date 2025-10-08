/**
 * Date Utilities
 * 
 * Advanced date manipulation and calculation functions using date-fns
 */

import {
  format,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  isAfter,
  isBefore,
  isWithinInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  isToday,
  isYesterday,
  isTomorrow,
  isPast,
  isFuture,
} from 'date-fns';
import { enUS, enAU, enGB } from 'date-fns/locale';

// ============================================
// Types
// ============================================

export type DateInput = Date | string | number;
export type DateRange = { from: Date; to: Date };
export type DateLocale = 'en-US' | 'en-AU' | 'en-GB';

// ============================================
// Locale Mapping
// ============================================

const LOCALE_MAP = {
  'en-US': enUS,
  'en-AU': enAU,
  'en-GB': enGB,
} as const;

// ============================================
// Date Parsing
// ============================================

/**
 * Parse date input into a Date object
 */
export function parseDate(date: DateInput): Date {
  if (date instanceof Date) {
    return date;
  }
  
  if (typeof date === 'string') {
    return parseISO(date);
  }
  
  return new Date(date);
}

/**
 * Check if date input is valid
 */
export function isValidDate(date: DateInput): boolean {
  try {
    const parsed = parseDate(date);
    return isValid(parsed);
  } catch {
    return false;
  }
}

// ============================================
// Date Formatting
// ============================================

/**
 * Format date with custom format string
 */
export function formatDate(
  date: DateInput,
  formatStr: string = 'PPP',
  locale: DateLocale = 'en-US'
): string {
  const parsed = parseDate(date);
  return format(parsed, formatStr, { locale: LOCALE_MAP[locale] });
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeDate(
  date: DateInput,
  baseDate: DateInput = new Date(),
  locale: DateLocale = 'en-US'
): string {
  const parsed = parseDate(date);
  const base = parseDate(baseDate);
  return formatDistance(parsed, base, {
    addSuffix: true,
    locale: LOCALE_MAP[locale],
  });
}

/**
 * Format date as relative (e.g., "yesterday at 3:15 PM")
 */
export function formatRelativeTime(
  date: DateInput,
  baseDate: DateInput = new Date(),
  locale: DateLocale = 'en-US'
): string {
  const parsed = parseDate(date);
  const base = parseDate(baseDate);
  return formatRelative(parsed, base, { locale: LOCALE_MAP[locale] });
}

/**
 * Format date for display in different contexts
 */
export function formatDateForDisplay(
  date: DateInput,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const parsed = parseDate(date);
  
  const formats = {
    short: 'MM/dd/yyyy',
    medium: 'MMM d, yyyy',
    long: 'MMMM d, yyyy',
    full: 'EEEE, MMMM d, yyyy',
  };
  
  return format(parsed, formats[style]);
}

/**
 * Format time for display
 */
export function formatTimeForDisplay(
  date: DateInput,
  use24Hour: boolean = false
): string {
  const parsed = parseDate(date);
  return format(parsed, use24Hour ? 'HH:mm' : 'h:mm a');
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: DateInput,
  dateStyle: 'short' | 'medium' | 'long' = 'medium',
  use24Hour: boolean = false
): string {
  const dateStr = formatDateForDisplay(date, dateStyle);
  const timeStr = formatTimeForDisplay(date, use24Hour);
  return `${dateStr} at ${timeStr}`;
}

// ============================================
// Date Calculations
// ============================================

/**
 * Add days to a date
 */
export function addDaysToDate(date: DateInput, days: number): Date {
  const parsed = parseDate(date);
  return addDays(parsed, days);
}

/**
 * Add weeks to a date
 */
export function addWeeksToDate(date: DateInput, weeks: number): Date {
  const parsed = parseDate(date);
  return addWeeks(parsed, weeks);
}

/**
 * Add months to a date
 */
export function addMonthsToDate(date: DateInput, months: number): Date {
  const parsed = parseDate(date);
  return addMonths(parsed, months);
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: DateInput, days: number): Date {
  const parsed = parseDate(date);
  return subDays(parsed, days);
}

/**
 * Subtract weeks from a date
 */
export function subtractWeeks(date: DateInput, weeks: number): Date {
  const parsed = parseDate(date);
  return subWeeks(parsed, weeks);
}

/**
 * Subtract months from a date
 */
export function subtractMonths(date: DateInput, months: number): Date {
  const parsed = parseDate(date);
  return subMonths(parsed, months);
}

// ============================================
// Date Comparisons
// ============================================

/**
 * Check if date is after another date
 */
export function isDateAfter(date: DateInput, compareDate: DateInput): boolean {
  const parsed = parseDate(date);
  const compare = parseDate(compareDate);
  return isAfter(parsed, compare);
}

/**
 * Check if date is before another date
 */
export function isDateBefore(date: DateInput, compareDate: DateInput): boolean {
  const parsed = parseDate(date);
  const compare = parseDate(compareDate);
  return isBefore(parsed, compare);
}

/**
 * Check if date is within a range
 */
export function isDateInRange(date: DateInput, range: DateRange): boolean {
  const parsed = parseDate(date);
  return isWithinInterval(parsed, { start: range.from, end: range.to });
}

/**
 * Check if two dates are the same day
 */
export function isSameDayAs(date: DateInput, compareDate: DateInput): boolean {
  const parsed = parseDate(date);
  const compare = parseDate(compareDate);
  return isSameDay(parsed, compare);
}

/**
 * Check if date is today
 */
export function isDateToday(date: DateInput): boolean {
  const parsed = parseDate(date);
  return isToday(parsed);
}

/**
 * Check if date is yesterday
 */
export function isDateYesterday(date: DateInput): boolean {
  const parsed = parseDate(date);
  return isYesterday(parsed);
}

/**
 * Check if date is tomorrow
 */
export function isDateTomorrow(date: DateInput): boolean {
  const parsed = parseDate(date);
  return isTomorrow(parsed);
}

/**
 * Check if date is in the past
 */
export function isDatePast(date: DateInput): boolean {
  const parsed = parseDate(date);
  return isPast(parsed);
}

/**
 * Check if date is in the future
 */
export function isDateFuture(date: DateInput): boolean {
  const parsed = parseDate(date);
  return isFuture(parsed);
}

// ============================================
// Date Ranges
// ============================================

/**
 * Get start of day
 */
export function getStartOfDay(date: DateInput): Date {
  const parsed = parseDate(date);
  return startOfDay(parsed);
}

/**
 * Get end of day
 */
export function getEndOfDay(date: DateInput): Date {
  const parsed = parseDate(date);
  return endOfDay(parsed);
}

/**
 * Get start of week
 */
export function getStartOfWeek(date: DateInput): Date {
  const parsed = parseDate(date);
  return startOfWeek(parsed);
}

/**
 * Get end of week
 */
export function getEndOfWeek(date: DateInput): Date {
  const parsed = parseDate(date);
  return endOfWeek(parsed);
}

/**
 * Get start of month
 */
export function getStartOfMonth(date: DateInput): Date {
  const parsed = parseDate(date);
  return startOfMonth(parsed);
}

/**
 * Get end of month
 */
export function getEndOfMonth(date: DateInput): Date {
  const parsed = parseDate(date);
  return endOfMonth(parsed);
}

/**
 * Get date range for today
 */
export function getTodayRange(): DateRange {
  const now = new Date();
  return {
    from: getStartOfDay(now),
    to: getEndOfDay(now),
  };
}

/**
 * Get date range for this week
 */
export function getThisWeekRange(): DateRange {
  const now = new Date();
  return {
    from: getStartOfWeek(now),
    to: getEndOfWeek(now),
  };
}

/**
 * Get date range for this month
 */
export function getThisMonthRange(): DateRange {
  const now = new Date();
  return {
    from: getStartOfMonth(now),
    to: getEndOfMonth(now),
  };
}

/**
 * Get date range for last N days
 */
export function getLastNDaysRange(days: number): DateRange {
  const now = new Date();
  return {
    from: subtractDays(now, days),
    to: now,
  };
}

// ============================================
// Date Differences
// ============================================

/**
 * Get difference in days between two dates
 */
export function getDaysDifference(date1: DateInput, date2: DateInput): number {
  const parsed1 = parseDate(date1);
  const parsed2 = parseDate(date2);
  return differenceInDays(parsed1, parsed2);
}

/**
 * Get difference in hours between two dates
 */
export function getHoursDifference(date1: DateInput, date2: DateInput): number {
  const parsed1 = parseDate(date1);
  const parsed2 = parseDate(date2);
  return differenceInHours(parsed1, parsed2);
}

/**
 * Get difference in minutes between two dates
 */
export function getMinutesDifference(date1: DateInput, date2: DateInput): number {
  const parsed1 = parseDate(date1);
  const parsed2 = parseDate(date2);
  return differenceInMinutes(parsed1, parsed2);
}

/**
 * Get difference in seconds between two dates
 */
export function getSecondsDifference(date1: DateInput, date2: DateInput): number {
  const parsed1 = parseDate(date1);
  const parsed2 = parseDate(date2);
  return differenceInSeconds(parsed1, parsed2);
}

/**
 * Get human-readable time until date
 */
export function getTimeUntil(date: DateInput): string {
  const parsed = parseDate(date);
  const now = new Date();
  
  if (isDatePast(parsed)) {
    return 'Overdue';
  }
  
  const days = getDaysDifference(parsed, now);
  const hours = getHoursDifference(parsed, now);
  const minutes = getMinutesDifference(parsed, now);
  
  if (days > 1) {
    return `${days} days`;
  }
  
  if (days === 1) {
    return '1 day';
  }
  
  if (hours > 1) {
    return `${hours} hours`;
  }
  
  if (hours === 1) {
    return '1 hour';
  }
  
  if (minutes > 1) {
    return `${minutes} minutes`;
  }
  
  return 'Less than a minute';
}

/**
 * Get deadline status
 */
export function getDeadlineStatus(deadline: DateInput): {
  status: 'overdue' | 'critical' | 'warning' | 'normal';
  daysRemaining: number;
  message: string;
} {
  const parsed = parseDate(deadline);
  const now = new Date();
  const daysRemaining = getDaysDifference(parsed, now);
  
  if (isDatePast(parsed)) {
    return {
      status: 'overdue',
      daysRemaining: Math.abs(daysRemaining),
      message: `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}`,
    };
  }
  
  if (daysRemaining <= 1) {
    return {
      status: 'critical',
      daysRemaining,
      message: 'Due today or tomorrow',
    };
  }
  
  if (daysRemaining <= 7) {
    return {
      status: 'warning',
      daysRemaining,
      message: `Due in ${daysRemaining} days`,
    };
  }
  
  return {
    status: 'normal',
    daysRemaining,
    message: `Due in ${daysRemaining} days`,
  };
}

// ============================================
// Timezone Helpers
// ============================================

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format date in user's timezone
 */
export function formatInUserTimezone(
  date: DateInput,
  formatStr: string = 'PPP p'
): string {
  const parsed = parseDate(date);
  return format(parsed, formatStr);
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60;
}