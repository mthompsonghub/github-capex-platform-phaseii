// utils/businessDays.ts - Utility for calculating business days and holidays

/**
 * Calculate the number of business days between two dates
 * Excludes weekends and US federal holidays
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  if (startDate > endDate) {
    return 0;
  }

  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Check if it's a weekday (Monday = 1, Friday = 5)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (!isHoliday(current)) {
        count++;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Check if a date is a US federal holiday
 * This is a simplified version - in production, you might want to use a library
 * or more comprehensive holiday calculation
 */
function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getHolidays(year);
  
  return holidays.some(holiday => 
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
}

/**
 * Get US federal holidays for a given year
 * Includes fixed and floating holidays
 */
function getHolidays(year: number): Date[] {
  const holidays: Date[] = [];
  
  // New Year's Day - January 1
  holidays.push(new Date(year, 0, 1));
  
  // Martin Luther King Jr. Day - Third Monday in January
  holidays.push(getNthWeekdayOfMonth(year, 0, 1, 3));
  
  // Presidents Day - Third Monday in February
  holidays.push(getNthWeekdayOfMonth(year, 1, 1, 3));
  
  // Memorial Day - Last Monday in May
  holidays.push(getLastWeekdayOfMonth(year, 4, 1));
  
  // Independence Day - July 4
  holidays.push(new Date(year, 6, 4));
  
  // Labor Day - First Monday in September
  holidays.push(getNthWeekdayOfMonth(year, 8, 1, 1));
  
  // Columbus Day - Second Monday in October
  holidays.push(getNthWeekdayOfMonth(year, 9, 1, 2));
  
  // Veterans Day - November 11
  holidays.push(new Date(year, 10, 11));
  
  // Thanksgiving - Fourth Thursday in November
  holidays.push(getNthWeekdayOfMonth(year, 10, 4, 4));
  
  // Christmas Day - December 25
  holidays.push(new Date(year, 11, 25));
  
  // Handle holidays that fall on weekends
  return holidays.map(holiday => {
    const day = holiday.getDay();
    if (day === 0) { // Sunday -> Monday
      return new Date(holiday.getFullYear(), holiday.getMonth(), holiday.getDate() + 1);
    } else if (day === 6) { // Saturday -> Friday
      return new Date(holiday.getFullYear(), holiday.getMonth(), holiday.getDate() - 1);
    }
    return holiday;
  });
}

/**
 * Get the nth occurrence of a weekday in a month
 * @param year - The year
 * @param month - The month (0-11)
 * @param dayOfWeek - The day of week (0=Sunday, 1=Monday, etc.)
 * @param n - Which occurrence (1st, 2nd, 3rd, 4th)
 */
function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  let dayOffset = dayOfWeek - firstDayOfWeek;
  if (dayOffset < 0) dayOffset += 7;
  
  const firstOccurrence = 1 + dayOffset;
  const nthOccurrence = firstOccurrence + (n - 1) * 7;
  
  return new Date(year, month, nthOccurrence);
}

/**
 * Get the last occurrence of a weekday in a month
 * @param year - The year
 * @param month - The month (0-11)
 * @param dayOfWeek - The day of week (0=Sunday, 1=Monday, etc.)
 */
function getLastWeekdayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  const lastDay = new Date(year, month + 1, 0); // Last day of month
  const lastDayOfWeek = lastDay.getDay();
  
  let dayOffset = lastDayOfWeek - dayOfWeek;
  if (dayOffset < 0) dayOffset += 7;
  
  const lastOccurrence = lastDay.getDate() - dayOffset;
  
  return new Date(year, month, lastOccurrence);
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDateForDB(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string from the database
 */
export function parseDateFromDB(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
} 