/**
 * Order pickup code generator.
 * Generates human-friendly 6-character uppercase alphanumeric codes.
 * Excludes confusable characters (I, L, O, 0, 1) to avoid vocal ambiguity at market stalls.
 */

import crypto from 'node:crypto';

export const PICKUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generates a 6-character pickup code using crypto.randomInt.
 *
 * @returns {string}
 */
export function generatePickupCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += PICKUP_CODE_ALPHABET[crypto.randomInt(PICKUP_CODE_ALPHABET.length)];
  }
  return code;
}
