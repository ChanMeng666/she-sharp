/**
 * CSV serialization for admin exports.
 *
 * The quoting follows RFC 4180: a field is wrapped in double quotes and any
 * quote inside it is doubled. Strings are always quoted (Excel and Sheets both
 * read that identically to a bare field), which is what the previous inline
 * implementation did, so exports of the current payloads are byte-for-byte
 * unchanged. What did change: values that are not strings — arrays, plain
 * objects and Date instances — used to be written raw, so anything containing a
 * comma silently split into extra columns and corrupted every row after it.
 * Those are now quoted too.
 */

/** Wraps a field in quotes, doubling any quote inside it (RFC 4180). */
function quoteField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Quotes a header only when it would otherwise break the row. */
function serializeHeader(header: string): string {
  return /[",\r\n]/.test(header) ? quoteField(header) : header;
}

/** Serializes one cell, preserving the previous formatting of each type. */
function serializeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return quoteField(value);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return quoteField(value.toISOString());
  if (Array.isArray(value)) return quoteField(value.join(','));
  return quoteField(JSON.stringify(value));
}

/**
 * Turns a list of records into a CSV document.
 *
 * @param rows Records to serialize; an empty list yields an empty string.
 * @param columns Column order. Defaults to the keys of the first row, so
 *   heterogeneous rows only export the first row's columns — pass the union
 *   explicitly when the rows differ.
 */
export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return '';

  const headers = columns ?? Object.keys(rows[0]);
  const lines = [headers.map(serializeHeader).join(',')];

  for (const row of rows) {
    lines.push(headers.map((header) => serializeValue(row[header])).join(','));
  }

  return lines.join('\n');
}

/**
 * Hands CSV text to the browser as a file download. Browser-only — it touches
 * `document` and `URL.createObjectURL`.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
