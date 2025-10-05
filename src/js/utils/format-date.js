/**
 * Format a date string to a more readable format in "en-GB" locale.
 * The format used is "day month year", e.g., "25 December 2023".
 * 
 * @param {*} dateString 
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", options);
}

/**
 * Format a date string to a shorter readable format in "en-US" locale.
 * The format used is "month day, year", e.g., "Dec 25, 2023".
 * 
 * @param {*} dateString
 * @returns {string} Formatted date string
 */
 export function formatDateShortMonth(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

/**
 * Format a date-time string to a more readable format in "en-GB" locale.
 * The format used is "day month year, hour:minute:second AM/PM", e.g., "25 December 2023, 10:30:45 AM".
 * 
 * @param {*} dateString
 * @returns {string} Formatted date-time string
 */
export function formatDateTime(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", options);
}

