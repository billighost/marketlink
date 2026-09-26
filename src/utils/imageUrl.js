/**
 * Cloudinary image transformation helper.
 * Inserts dynamic optimization and sizing parameters right after /upload/.
 *
 * Variants:
 * - card:   f_auto,q_auto,c_fill,w_480,h_360
 * - detail: f_auto,q_auto,c_limit,w_1000
 * - thumb:  f_auto,q_auto,c_fill,w_160,h_160
 *
 * @param {string|null} url
 * @param {'card'|'detail'|'thumb'} [variant]
 * @returns {string|null}
 */
export function imageUrl(url, variant) {
  if (!url || typeof url !== 'string') return null;

  if (url.includes('/image/upload/')) {
    const transforms = {
      card: 'f_auto,q_auto,c_fill,w_480,h_360',
      detail: 'f_auto,q_auto,c_limit,w_1000',
      thumb: 'f_auto,q_auto,c_fill,w_160,h_160',
    };

    const transform = transforms[variant];
    if (transform) {
      return url.replace('/image/upload/', `/image/upload/${transform}/`);
    }
  }

  return url;
}
