import { TZDate } from '@date-fns/tz';

/**
 * Newsletter scheduling in New Zealand time (Pacific/Auckland).
 *
 * Timing rule: the send moment is the last Thursday of the issue month, 10:00
 * local Pacific/Auckland time (NZST UTC+12 / NZDT UTC+13, DST-correct). It is
 * the slot of record an operator honours by hand — nothing is queued against
 * it.
 *
 * There is no draft day any more. `draftDayFor`/`isDraftDay` computed the
 * Tuesday before the send and gated a Vercel cron; both went when the
 * newsletter stopped being generated in the cloud.
 */

const TIME_ZONE = 'Pacific/Auckland';
const THURSDAY = 4;
const SEND_HOUR = 10;

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
