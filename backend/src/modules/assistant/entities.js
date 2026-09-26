/**
 * Entity extraction for rule-based assistant.
 * Extracts day of week, market names, farmer names, and product keywords from user query strings.
 */

export const DAY_MAP = {
  monday: 'mon',
  mon: 'mon',
  tuesday: 'tue',
  tue: 'tue',
  wednesday: 'wed',
  wed: 'wed',
  thursday: 'thu',
  thu: 'thu',
  friday: 'fri',
  fri: 'fri',
  saturday: 'sat',
  sat: 'sat',
  sunday: 'sun',
  sun: 'sun',
};

export const DAY_NAMES = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/**
 * Extracts entities from raw user input.
 *
 * @param {string} text
 * @returns {{ day: string|null, cleanText: string, words: Array<string> }}
 */
export function extractEntities(text) {
  const clean = (text || '').toLowerCase().trim();
  const words = clean.split(/\s+/).filter(Boolean);

  let matchedDay = null;
  for (const [dayKey, code] of Object.entries(DAY_MAP)) {
    const regex = new RegExp(`\\b${dayKey}\\b`, 'i');
    if (regex.test(clean)) {
      matchedDay = code;
      break;
    }
  }

  return {
    day: matchedDay,
    cleanText: clean,
    words,
  };
}
