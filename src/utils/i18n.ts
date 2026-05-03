/**
 * Russian declension utilities.
 */

/**
 * Decline a countable noun in Russian.
 * @param count - Number of items
 * @param one - Form for 1 (аптечка)
 * @param few - Form for 2-4 (аптечки)
 * @param many - Form for 5+ (аптечек)
 */
export function decline(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count);
  const lastTwo = abs % 100;
  const lastOne = abs % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (lastOne === 1) return one;
  if (lastOne >= 2 && lastOne <= 4) return few;
  return many;
}

/**
 * Decline "аптечка" (medkit) in Russian.
 */
export function formatMedkits(count: number): string {
  return decline(count, 'аптечка', 'аптечки', 'аптечек');
}