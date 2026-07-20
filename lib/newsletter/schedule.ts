import { TZDate } from '@date-fns/tz';

/**
 * Newsletter scheduling in New Zealand time (Pacific/Auckland).
 *
 * Timing rules:
 * - Send moment: last Thursday of the issue month, 10:00 local Pacific/Auckland
 *   time (NZST UTC+12 / NZDT UTC+13, DST-correct).
 * - Draft day: the send day minus 2 calendar days (the Tuesday of that week).
 */

const TIME_ZONE = 'Pacific/Auckland';
const THURSDAY = 4;
const SEND_HOUR = 10;
const DRAFT_OFFSET_DAYS = 2;

/**
 * Returns the number of days in the given month, independent of time zone.
 *
 * @param year Four-digit year.
 * @param month Month, 1-12.
 */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Returns the UTC instant of the send moment: the last Thursday of the given
 * month at 10:00 Pacific/Auckland time.
 *
 * @param year Four-digit year.
 * @param month Month, 1-12.
 */
export function lastThursdaySendAt(year: number, month: number): Date {
  const lastDay = daysInMonth(year, month);
  for (let day = lastDay; day >= 1; day--) {
    const candidate = new TZDate(year, month - 1, day, SEND_HOUR, 0, 0, TIME_ZONE);
    if (candidate.getDay() === THURSDAY) {
      return new Date(candidate.getTime());
    }
  }
  throw new Error(`No Thursday found in ${year}-${month}`);
}

/**
 * Returns the draft-generation calendar day in NZ (send day minus 2), as
 * {year, month, day} in Pacific/Auckland.
 *
 * @param year Four-digit year.
 * @param month Month, 1-12.
 */
export function draftDayFor(
  year: number,
  month: number,
): { year: number; month: number; day: number } {
  const sendInstant = lastThursdaySendAt(year, month);
  const sendNz = new TZDate(sendInstant.getTime(), TIME_ZONE);
  const draftNz = new TZDate(
    year,
    month - 1,
    sendNz.getDate() - DRAFT_OFFSET_DAYS,
    SEND_HOUR,
    0,
    0,
    TIME_ZONE,
  );
  return {
    year: draftNz.getFullYear(),
    month: draftNz.getMonth() + 1,
    day: draftNz.getDate(),
  };
}

/**
 * Returns true if `nowUtc` falls on the draft day for its own NZ-calendar month.
 *
 * @param nowUtc The instant to test.
 */
export function isDraftDay(nowUtc: Date): boolean {
  const nz = new TZDate(nowUtc.getTime(), TIME_ZONE);
  const year = nz.getFullYear();
  const month = nz.getMonth() + 1;
  const day = nz.getDate();
  const draft = draftDayFor(year, month);
  return draft.year === year && draft.month === month && draft.day === day;
}

/**
 * Returns the "YYYY-MM" issue id for the month containing `nowUtc` in NZ time.
 *
 * @param nowUtc The instant to resolve.
 */
export function issueIdFor(nowUtc: Date): string {
  const nz = new TZDate(nowUtc.getTime(), TIME_ZONE);
  const year = nz.getFullYear();
  const month = nz.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}
