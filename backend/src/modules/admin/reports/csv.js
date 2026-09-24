/**
 * CSV streaming and sanitization engine.
 * Implements D7 streaming cursor exports with UTF-8 BOM, backpressure drain handling,
 * and formula-injection escaping.
 */

import { once } from 'node:events';

/**
 * Escapes a cell value for CSV output.
 * Prevents CSV formula injection by prepending a single quote to cells beginning with
 * =, +, -, @, \t, or \r.
 * Wraps values containing commas, quotes, or newlines in double quotes, escaping existing quotes.
 *
 * @param {any} value
 * @returns {string}
 */
export function escapeCell(value) {
  if (value === null || value === undefined) return '';

  let str = String(value);

  // Formula injection defense (D7)
  const firstChar = str.charAt(0);
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
    str = `'${str}`;
  }

  // Quote wrapping
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of cell values into a single CRLF-terminated CSV row string.
 *
 * @param {Array<any>} cells
 * @returns {string}
 */
export function formatCsvRow(cells) {
  return cells.map(escapeCell).join(',') + '\r\n';
}

/**
 * Streams database cursor results to HTTP response as a CSV attachment.
 * Handles UTF-8 BOM, backpressure, and client abort.
 *
 * @param {import('express').Response} res
 * @param {import('express').Request} req
 * @param {string} filename
 * @param {Array<string>} headers
 * @param {AsyncIterable<any>} cursor
 * @param {(doc: any) => Array<any>} rowFormatter
 * @returns {Promise<number>} - Count of rows streamed
 */
export async function streamCsv(res, req, filename, headers, cursor, rowFormatter) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');

  // 1. Write UTF-8 BOM for Excel compatibility
  res.write('\uFEFF');

  // 2. Write CSV header row
  res.write(formatCsvRow(headers));

  let clientClosed = false;
  const onClose = () => {
    clientClosed = true;
    if (cursor && typeof cursor.close === 'function') {
      cursor.close().catch(() => {});
    }
  };
  req.on('close', onClose);

  let rowCount = 0;

  try {
    for await (const doc of cursor) {
      if (clientClosed) break;

      const cells = rowFormatter(doc);
      const row = formatCsvRow(cells);

      if (!res.write(row)) {
        await once(res, 'drain');
      }
      rowCount++;
    }
  } finally {
    req.off('close', onClose);
  }

  res.end();
  return rowCount;
}
