/**
 * Checks for the mentee payment-page submission token.
 *
 * Run: npx tsx lib/forms/submission-token.test.ts
 *
 * The token is the only thing standing between an anonymous caller and the
 * eleven mentee applicants' names and email addresses, because the payment page
 * lookup cannot require a session — the applicant has no account yet. Until
 * 2026-09-06 that lookup took the raw primary key, and `?id=3` answered.
 *
 * A signature check that accepts anything is the classic way this goes wrong,
 * so the refusals are the point of this file: every assertion below hands the
 * verifier something it must reject, and only two hand it something valid.
 *
 * No database and no network — everything here is pure.
 */

process.env.AUTH_SECRET = 'test-secret-not-a-real-key';

import {
  buildMenteeSubmissionToken,
  verifyMenteeSubmissionToken,
} from './submission-token';

let failures = 0;

/** Records one assertion and keeps going, so one break does not hide the rest. */
function check(label: string, ok: boolean): void {
  console.log(`  ${ok ? 'ok' : 'FAIL'} - ${label}`);
  if (!ok) failures++;
}

console.log('Mentee submission tokens');

// --- The happy path, so the refusals below mean something -------------------

const token = buildMenteeSubmissionToken(3);
check('a token is issued for a real submission id', typeof token === 'string' && token.length > 0);
check('a valid token round-trips to its id', verifyMenteeSubmissionToken(token) === 3);
check(
  'a different id yields a different token',
  buildMenteeSubmissionToken(4) !== token && verifyMenteeSubmissionToken(buildMenteeSubmissionToken(4)) === 4
);

// --- Forgery: the enumeration the raw ?id= allowed ---------------------------

const [payload, signature] = (token as string).split('.');

check('the raw id is not itself a token', verifyMenteeSubmissionToken('3') === null);
check(
  'an unsigned payload is refused',
  verifyMenteeSubmissionToken(Buffer.from('5', 'utf8').toString('base64url')) === null
);
check(
  'a payload with an empty signature is refused',
  verifyMenteeSubmissionToken(`${Buffer.from('5', 'utf8').toString('base64url')}.`) === null
);
check(
  'a made-up signature of the right length is refused',
  verifyMenteeSubmissionToken(
    `${Buffer.from('5', 'utf8').toString('base64url')}.${Buffer.alloc(16, 0xab).toString('base64url')}`
  ) === null
);

// The dangerous one: keep a real signature, swap the id it was issued for.
check(
  'a valid signature replayed onto a neighbouring id is refused',
  verifyMenteeSubmissionToken(`${Buffer.from('4', 'utf8').toString('base64url')}.${signature}`) === null
);

// Flip one bit of the signature.
const tamperedSignature = Buffer.from(signature, 'base64url');
tamperedSignature[0] ^= 0x01;
check(
  'a one-bit change to the signature is refused',
  verifyMenteeSubmissionToken(`${payload}.${tamperedSignature.toString('base64url')}`) === null
);

// A truncated signature must not compare equal to its own prefix.
check(
  'a truncated signature is refused',
  verifyMenteeSubmissionToken(`${payload}.${Buffer.from(signature, 'base64url').subarray(0, 8).toString('base64url')}`) === null
);
check(
  'an over-long signature is refused',
  verifyMenteeSubmissionToken(
    `${payload}.${Buffer.concat([Buffer.from(signature, 'base64url'), Buffer.alloc(4)]).toString('base64url')}`
  ) === null
);

// --- Malformed input --------------------------------------------------------

check('a null token is refused', verifyMenteeSubmissionToken(null) === null);
check('an empty token is refused', verifyMenteeSubmissionToken('') === null);
check('a token with no separator is refused', verifyMenteeSubmissionToken('notatoken') === null);
check('a token that is only a separator is refused', verifyMenteeSubmissionToken('.') === null);
check(
  'a non-numeric payload is refused',
  verifyMenteeSubmissionToken(`${Buffer.from('abc', 'utf8').toString('base64url')}.${signature}`) === null
);
check(
  'a padded id is refused, so one row has exactly one token',
  verifyMenteeSubmissionToken(`${Buffer.from('003', 'utf8').toString('base64url')}.${signature}`) === null
);
check(
  'a negative id is refused',
  verifyMenteeSubmissionToken(`${Buffer.from('-3', 'utf8').toString('base64url')}.${signature}`) === null
);

// --- Issuing refuses what it cannot sign ------------------------------------

check('id 0 is not issued a token', buildMenteeSubmissionToken(0) === null);
check('a negative id is not issued a token', buildMenteeSubmissionToken(-1) === null);
check('a fractional id is not issued a token', buildMenteeSubmissionToken(1.5) === null);

// --- A rotated secret invalidates outstanding tokens ------------------------

process.env.AUTH_SECRET = 'a-different-secret';
check('a token signed with the old secret is refused after rotation', verifyMenteeSubmissionToken(token) === null);

// --- An unset secret must refuse, never fall open ---------------------------

process.env.AUTH_SECRET = '';
check('no token is issued when AUTH_SECRET is unset', buildMenteeSubmissionToken(3) === null);
check('no token verifies when AUTH_SECRET is unset', verifyMenteeSubmissionToken(token) === null);
process.env.AUTH_SECRET = 'test-secret-not-a-real-key';

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll mentee submission token checks passed');
