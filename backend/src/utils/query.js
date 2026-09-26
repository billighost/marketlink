/**
 * Query parameter parsing and validation utilities.
 * Handles limit, CSV, integer, enum parsing, and regex escaping for prefix queries.
 */

import { AppError } from './errors.js';

/**
 * Parses and bounds the pagination limit query parameter.
 * Default: 20, Max: 50. Throws 422 on non-integer or <= 0 values.
 *
 * @param {unknown} val
 * @param {number} [defaultVal=20]
 * @param {number} [maxVal=50]
 * @returns {number}
 */
export function parseLimit(val, defaultVal = 20, maxVal = 50) {
  if (val === undefined || val === null || val === '') {
    return defaultVal;
  }

  const str = String(val).trim();
  if (!/^\d+$/.test(str)) {
    throw AppError.unprocessable([{ field: 'limit', message: 'Limit must be a positive integer.' }]);
  }

  const num = parseInt(str, 10);
  if (num <= 0) {
    throw AppError.unprocessable([{ field: 'limit', message: 'Limit must be greater than 0.' }]);
  }

  return Math.min(num, maxVal);
}

/**
 * Parses a comma-separated values (CSV) parameter into an array of trimmed strings.
 *
 * @param {unknown} val
 * @param {number} [maxItems=10]
 * @param {string} [fieldName='csv']
 * @returns {string[]}
 */
export function parseCsv(val, maxItems = 10, fieldName = 'csv') {
  if (!val || typeof val !== 'string') {
    return [];
  }

  const items = val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (items.length > maxItems) {
    throw AppError.unprocessable([
      { field: fieldName, message: `Cannot specify more than ${maxItems} comma-separated items.` },
    ]);
  }

  return items;
}

/**
 * Parses and bounds an integer parameter.
 *
 * @param {unknown} val
 * @param {string} fieldName
 * @param {object} [opts]
 * @param {number} [opts.min]
 * @param {number} [opts.max]
 * @param {boolean} [opts.required=false]
 * @returns {number|undefined}
 */
export function parseIntParam(val, fieldName, { min, max, required = false } = {}) {
  if (val === undefined || val === null || val === '') {
    if (required) {
      throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} is required.` }]);
    }
    return undefined;
  }

  const str = String(val).trim();
  if (!/^-?\d+$/.test(str)) {
    throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} must be an integer.` }]);
  }

  const num = parseInt(str, 10);
  if (min !== undefined && num < min) {
    throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} must be at least ${min}.` }]);
  }
  if (max !== undefined && num > max) {
    throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} cannot exceed ${max}.` }]);
  }

  return num;
}

/**
 * Parses a float parameter (e.g. lat, lng, radiusKm).
 *
 * @param {unknown} val
 * @param {string} fieldName
 * @param {object} [opts]
 * @param {number} [opts.min]
 * @param {number} [opts.max]
 * @param {boolean} [opts.required=false]
 * @returns {number|undefined}
 */
export function parseFloatParam(val, fieldName, { min, max, required = false } = {}) {
  if (val === undefined || val === null || val === '') {
    if (required) {
      throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} is required.` }]);
    }
    return undefined;
  }

  const num = parseFloat(String(val).trim());
  if (Number.isNaN(num)) {
    throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} must be a valid number.` }]);
  }

  if (min !== undefined && num < min) {
    throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} must be at least ${min}.` }]);
  }
  if (max !== undefined && num > max) {
    throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} cannot exceed ${max}.` }]);
  }

  return num;
}

/**
 * Parses and validates an enumerated string parameter.
 *
 * @param {unknown} val
 * @param {string} fieldName
 * @param {string[]} allowedValues
 * @param {object} [opts]
 * @param {boolean} [opts.required=false]
 * @param {string} [opts.defaultVal]
 * @returns {string|undefined}
 */
export function parseEnum(val, fieldName, allowedValues, { required = false, defaultVal } = {}) {
  if (val === undefined || val === null || val === '') {
    if (defaultVal !== undefined) return defaultVal;
    if (required) {
      throw AppError.unprocessable([{ field: fieldName, message: `${fieldName} is required.` }]);
    }
    return undefined;
  }

  if (typeof val !== 'string' || !allowedValues.includes(val.trim())) {
    throw AppError.unprocessable([
      { field: fieldName, message: `Invalid ${fieldName}. Allowed values: ${allowedValues.join(', ')}` },
    ]);
  }

  return val.trim();
}

/**
 * Escapes user text for safe anchored prefix matching.
 * Converts to lowercase and escapes special regex characters.
 * D4 spec: str.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeForPrefix(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
