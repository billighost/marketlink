/**
 * Lightweight input validation helpers.
 * Gathers field errors and throws 422 VALIDATION_FAILED with structured details.
 */

import { AppError } from './errors.js';
import { isValidObjectId } from './ids.js';

// Standard RFC-compliant email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Rejects any fields in obj that are not in the allowed list.
 * Throws 422 VALIDATION_FAILED if extra fields are present.
 *
 * @param {Record<string, unknown>} obj
 * @param {string[]} allowedFields
 */
export function rejectUnknownFields(obj, allowedFields) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw AppError.badRequest('Request body must be a JSON object.');
  }

  const allowedSet = new Set(allowedFields);
  const unknown = Object.keys(obj).filter((k) => !allowedSet.has(k));
  if (unknown.length > 0) {
    throw AppError.unprocessable(
      unknown.map((f) => ({ field: f, message: `Unknown field '${f}' is not allowed.` })),
      `Unknown field${unknown.length > 1 ? 's' : ''} not permitted.`
    );
  }
}

/**
 * Validates a string field.
 *
 * @param {unknown} val
 * @param {string} fieldName
 * @param {Array<{ field: string, message: string }>} details
 * @param {object} [opts]
 * @param {boolean} [opts.required=true]
 * @param {number} [opts.min=1]
 * @param {number} [opts.max=255]
 * @returns {string|undefined}
 */
export function validateString(val, fieldName, details, { required = true, min = 1, max = 255 } = {}) {
  if (val === undefined || val === null || val === '') {
    if (required) {
      details.push({ field: fieldName, message: `${fieldName} is required.` });
    }
    return undefined;
  }

  if (typeof val !== 'string') {
    details.push({ field: fieldName, message: `${fieldName} must be a text string.` });
    return undefined;
  }

  const trimmed = val.trim();
  if (required && trimmed.length < min) {
    details.push({ field: fieldName, message: `${fieldName} must be at least ${min} character${min === 1 ? '' : 's'}.` });
    return undefined;
  }

  if (trimmed.length > max) {
    details.push({ field: fieldName, message: `${fieldName} cannot exceed ${max} characters.` });
    return undefined;
  }

  return trimmed;
}

/**
 * Validates an email address.
 * Normalizes by trimming and lower-casing.
 *
 * @param {unknown} val
 * @param {string} fieldName
 * @param {Array<{ field: string, message: string }>} details
 * @param {boolean} [required=true]
 * @returns {string|undefined}
 */
export function validateEmail(val, fieldName, details, required = true) {
  if (val === undefined || val === null || val === '') {
    if (required) {
      details.push({ field: fieldName, message: 'Email address is required.' });
    }
    return undefined;
  }

  if (typeof val !== 'string') {
    details.push({ field: fieldName, message: 'Email must be a text string.' });
    return undefined;
  }

  const normalized = val.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized) || normalized.length > 255) {
    details.push({ field: fieldName, message: 'Please enter a valid email address.' });
    return undefined;
  }

  return normalized;
}

/**
 * Validates password rules:
 * - At least 8 characters
 * - At least one letter and one number
 * - Maximum 72 bytes (bcrypt limit)
 *
 * @param {unknown} val
 * @param {string} fieldName
 * @param {Array<{ field: string, message: string }>} details
 * @param {boolean} [required=true]
 * @returns {string|undefined}
 */
export function validatePassword(val, fieldName, details, required = true) {
  if (val === undefined || val === null || val === '') {
    if (required) {
      details.push({ field: fieldName, message: 'Password is required.' });
    }
    return undefined;
  }

  if (typeof val !== 'string') {
    details.push({ field: fieldName, message: 'Password must be a string.' });
    return undefined;
  }

  const byteLength = Buffer.byteLength(val, 'utf8');
  if (byteLength > 72) {
    details.push({ field: fieldName, message: 'Password cannot exceed 72 bytes.' });
    return undefined;
  }

  if (val.length < 8) {
    details.push({ field: fieldName, message: 'Password must be at least 8 characters long.' });
    return undefined;
  }

  const hasLetter = /[a-zA-Z]/.test(val);
  const hasDigit = /[0-9]/.test(val);
  if (!hasLetter || !hasDigit) {
    details.push({ field: fieldName, message: 'Password must contain at least one letter and one number.' });
    return undefined;
  }

  return val;
}

/**
 * Validates enum values.
 *
 * @param {unknown} val
 * @param {string[]} allowedList
 * @param {string} fieldName
 * @param {Array<{ field: string, message: string }>} details
 * @param {boolean} [required=true]
 * @returns {string|undefined}
 */
export function validateEnum(val, allowedList, fieldName, details, required = true) {
  if (val === undefined || val === null || val === '') {
    if (required) {
      details.push({ field: fieldName, message: `${fieldName} is required.` });
    }
    return undefined;
  }

  if (!allowedList.includes(val)) {
    details.push({
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedList.join(', ')}.`,
    });
    return undefined;
  }

  return val;
}

/**
 * Validates an ObjectId string.
 *
 * @param {unknown} val
 * @param {string} fieldName
 * @param {Array<{ field: string, message: string }>} details
 * @param {boolean} [required=true]
 * @returns {string|undefined}
 */
export function validateObjectIdStr(val, fieldName, details, required = true) {
  if (val === undefined || val === null || val === '') {
    if (required) {
      details.push({ field: fieldName, message: `${fieldName} is required.` });
    }
    return undefined;
  }

  if (!isValidObjectId(val)) {
    details.push({ field: fieldName, message: `${fieldName} must be a valid 24-character hexadecimal identifier.` });
    return undefined;
  }

  return val;
}

/**
 * Validates a boolean value.
 *
 * @param {unknown} val
 * @param {string} fieldName
 * @param {Array<{ field: string, message: string }>} details
 * @param {boolean} [required=true]
 * @returns {boolean|undefined}
 */
export function validateBoolean(val, fieldName, details, required = true) {
  if (val === undefined || val === null) {
    if (required) {
      details.push({ field: fieldName, message: `${fieldName} is required.` });
    }
    return undefined;
  }

  if (typeof val !== 'boolean') {
    details.push({ field: fieldName, message: `${fieldName} must be a boolean.` });
    return undefined;
  }

  return val;
}

/**
 * Asserts that the details array is empty. Throws 422 if not.
 *
 * @param {Array<{ field: string, message: string }>} details
 * @param {string} [customMessage]
 */
export function assertValid(details, customMessage) {
  if (details.length > 0) {
    throw AppError.unprocessable(details, customMessage);
  }
}
