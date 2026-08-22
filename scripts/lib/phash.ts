/**
 * Perceptual hashing for photographs, shared by every script that has to ask
 * "have I already seen this picture?".
 *
 * Extracted from `scripts/build-event-archive.mts`, which owned the only copy.
 * A second consumer arrived with the wall-tile builder and a third with the
 * 2026 hackathon triage; three hand-copied difference hashes would drift, and
 * the drift is silent — two scripts would simply disagree about what a
 * duplicate is, with nothing failing to say so.
 *
 * THE THRESHOLD IS NOT PART OF THE ALGORITHM. Callers pick their own, because
 * the right distance depends entirely on what produced the two files:
 *
 *   <= 6   the same photograph re-encoded (a Google Photos rendition of a file
 *          we already hold). This is what `build-event-archive.mts` uses.
 *   <= 10  frames from one burst by one photographer standing in one place.
 *          Useful for GROUPING a burst so a human picks the best of it; using
 *          it to delete would silently drop distinct pitches shot from one seat.
 *   >= 7   the bar a NEW image must clear to be considered distinct from an
 *          existing pool, e.g. before joining the deck wall.
 */
import sharp from "sharp";

/**
 * 64-bit difference hash: compare each pixel with its right-hand neighbour on a
 * 9x8 greyscale reduction. Robust to the re-encoding and rescaling that make
 * album renditions of one photo differ byte-for-byte.
 */
export async function dHash(file: string): Promise<bigint> {
  const raw = await sharp(file)
    .greyscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer();
  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = raw[y * 9 + x];
      const right = raw[y * 9 + x + 1];
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash;
}

/** Number of differing bits between two hashes — 0 is identical, 64 is opposite. */
export function hammingDistance(a: bigint, b: bigint): number {
  let diff = a ^ b;
  let count = 0;
  while (diff) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}
