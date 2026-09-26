/**
 * Comparator to sort stalls:
 *  1. Open today first
 *  2. lowStockCount descending (scarcity is interesting)
 *  3. Alphabetically by stallName
 *
 * Used uniformly across Today strip, Stalls index, and Market detail page.
 *
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
export function byOpenThenScarcity(a, b) {
  // 1. Open today first
  const aOpen = Boolean(a?.openToday);
  const bOpen = Boolean(b?.openToday);
  if (aOpen !== bOpen) {
    return aOpen ? -1 : 1;
  }

  // 2. lowStockCount descending (scarcity is interesting)
  const aLow = a?.lowStockCount || 0;
  const bLow = b?.lowStockCount || 0;
  if (aLow !== bLow) {
    return bLow - aLow;
  }

  // 3. Alphabetically by stallName
  const aName = a?.stallName || '';
  const bName = b?.stallName || '';
  return aName.localeCompare(bName);
}

export default byOpenThenScarcity;
