/**
 * Formats a given number as a currency string in Ghanaian Cedi (GH₵).
 *
 * - If the number has decimals, it includes them in the formatted output.
 * - If the number is a whole number, it omits the decimal places.
 * - Uses the GH₵ symbol instead of "GHS".
 *
 * @param {number} amount - The amount to be formatted.
 * @returns {string} - The formatted currency string.
 *
 * @example
 * fCurrency(1000); // "GH₵1,000"
 * fCurrency(1000.5); // "GH₵1,000.50"
 */
export function fCurrency(number) {
  const hasDecimals = number % 1 !== 0;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });

  return formatter.format(number).replace("GHS", "GH₵");
}
