/**
 * URI and secret masking helper.
 * Strictly masks database credentials and cloud secrets in logs and diagnostic outputs.
 */

/**
 * Masks database connection string credentials:
 * e.g. mongodb+srv://user:secret@cluster.net/db -> mongodb+srv://user:****@cluster.net/db
 *
 * @param {string} uri
 * @returns {string}
 */
export function maskUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/:([^:@]+)@/, ':****@');
}

/**
 * Masks Cloudinary secrets:
 *
 * @param {string} secret
 * @returns {string}
 */
export function maskSecret(secret) {
  if (!secret || typeof secret !== 'string') return '****';
  if (secret.length <= 4) return '****';
  return secret.slice(0, 2) + '****' + secret.slice(-2);
}
