import assert from 'node:assert';
import { TZDate } from '@date-fns/tz';
import {
  lastThursdaySendAt,
  draftDayFor,
  isDraftDay,
  issueIdFor,
} from './schedule';

const TIME_ZONE = 'Pacific/Auckland';
const THURSDAY = 4;

/** Returns the number of days in the given month (1-12), time-zone independent. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

let passed = 0;
function check(label: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok - ${label}`);
}

// 1. Known values, independently verified via an Intl brute-force scan.
console.log('1. Known send instants (NZST and NZDT):');
check('July 2026 send = 2026-07-29T22:00:00Z (NZST, UTC+12)', () => {
  assert.strictEqual(
    lastThursdaySendAt(2026, 7).toISOString(),
    '2026-07-29T22:00:00.000Z',
  );
});
check('December 2026 send = 2026-12-30T21:00:00Z (NZDT, UTC+13)', () => {
  assert.strictEqual(
    lastThursdaySendAt(2026, 12).toISOString(),
    '2026-12-30T21:00:00.000Z',
  );
});

// 2. DST boundary months.
console.log('2. DST boundary months:');
check('April 2027 last Thursday is 2027-04-29, NZST (UTC+12)', () => {
  const send = lastThursdaySendAt(2027, 4);
  // NZDT->NZST switch is early April 2027; the last Thursday (29th) is NZST.
  assert.strictEqual(send.toISOString(), '2027-04-28T22:00:00.000Z');
  const nz = new TZDate(send.getTime(), TIME_ZONE);
  assert.strictEqual(nz.getDate(), 29);
  assert.strictEqual(nz.getHours(), 10);
});
check('September 2026 last Thursday is 2026-09-24, NZST (UTC+12)', () => {
  const send = lastThursdaySendAt(2026, 9);
  // NZST->NZDT switch is late Sept 2026; the last Thursday (24th) precedes it.
  assert.strictEqual(send.toISOString(), '2026-09-23T22:00:00.000Z');
  const nz = new TZDate(send.getTime(), TIME_ZONE);
  assert.strictEqual(nz.getDate(), 24);
  assert.strictEqual(nz.getHours(), 10);
});

// 3. Month-end weekday matrix across all of 2026.
console.log('3. Month-end matrix (every month of 2026):');
check('each month: send is a Thursday in the last 7 days; draft is 2 days earlier, same month', () => {
  for (let month = 1; month <= 12; month++) {
    const send = lastThursdaySendAt(2026, month);
    const nz = new TZDate(send.getTime(), TIME_ZONE);
    const lastDay = daysInMonth(2026, month);

    assert.strictEqual(nz.getDay(), THURSDAY, `month ${month}: not Thursday`);
    assert.strictEqual(nz.getMonth() + 1, month, `month ${month}: wrong month`);
    assert.strictEqual(nz.getHours(), 10, `month ${month}: not 10:00 NZ`);
    assert.ok(
      nz.getDate() > lastDay - 7 && nz.getDate() <= lastDay,
      `month ${month}: send day ${nz.getDate()} not in last 7 days (dim=${lastDay})`,
    );

    const draft = draftDayFor(2026, month);
    assert.strictEqual(draft.year, 2026, `month ${month}: draft year`);
    assert.strictEqual(draft.month, month, `month ${month}: draft not same month`);
    assert.strictEqual(
      draft.day,
      nz.getDate() - 2,
      `month ${month}: draft not send-minus-2`,
    );
  }
});

// 4. isDraftDay around the July 2026 draft day.
// July 2026 send day = 30 (Thu); draft day = 28 (Tue).
// Tuesday 08:30 NZ (NZST UTC+12) on 2026-07-28 == 2026-07-27T20:30:00Z (Monday in UTC).
console.log('4. isDraftDay:');
check('true on Tuesday 08:30 NZ draft day (UTC date != NZ date)', () => {
  const instant = new Date('2026-07-27T20:30:00.000Z');
  const nz = new TZDate(instant.getTime(), TIME_ZONE);
  assert.strictEqual(nz.getDate(), 28); // NZ says 28th
  assert.strictEqual(instant.getUTCDate(), 27); // UTC says 27th
  assert.strictEqual(isDraftDay(instant), true);
});
check('false on the Tuesday one week earlier (2026-07-21 NZ)', () => {
  assert.strictEqual(
    isDraftDay(new Date('2026-07-20T20:30:00.000Z')),
    false,
  );
});
check('false on the Wednesday after the draft day (2026-07-29 NZ)', () => {
  assert.strictEqual(
    isDraftDay(new Date('2026-07-28T20:30:00.000Z')),
    false,
  );
});

// 5. issueIdFor around midnight NZ vs UTC.
console.log('5. issueIdFor across the NZ/UTC date line:');
check('2026-07-31T13:00:00Z is already Aug 1 in NZ -> "2026-08"', () => {
  assert.strictEqual(issueIdFor(new Date('2026-07-31T13:00:00.000Z')), '2026-08');
});
check('2026-07-31T11:00:00Z is still July 31 in NZ -> "2026-07"', () => {
  assert.strictEqual(issueIdFor(new Date('2026-07-31T11:00:00.000Z')), '2026-07');
});

console.log(`\nAll ${passed} checks passed.`);
