/**
 * Scroll a container or modal to the top
 *
 * @param {HTMLElement|string} container - The container element or CSS selector
 * @param {string|null} childSelector - Optional child selector to scroll within the container
 *
 * @example
 * // Example 1: Scroll using element reference and child selector
 * const modal = document.getElementById('myModal');
 * scrollToTop(modal, '.modal-content');
 *
 * @example
 * // Example 2: Scroll using CSS selector string
 * scrollToTop('#viewStudentModal', '.modal');
 *
 * @example
 * // Example 3: Scroll element directly (no child)
 * const container = document.querySelector('.scrollable-container');
 * scrollToTop(container);
 *
 * @example
 * // Example 4: Scroll using only CSS selector
 * scrollToTop('#mainContent');
 *
 * @example
 * // Example 5: In a class method
 * class MyModal {
 *   scrollToTop() {
 *     scrollToTop(this.modal, '.modal');
 *   }
 * }
 *
 * @example
 * // Example 6: Scroll table container
 * scrollToTop('.table-wrapper');
 *
 * @example
 * // Example 7: Scroll sidebar
 * scrollToTop(document.getElementById('sidebar'));
 */
export function scrollToTop(container, childSelector = null) {
  let element;

  // Handle string selector
  if (typeof container === "string") {
    element = document.querySelector(container);
  } else {
    element = container;
  }

  if (!element) {
    console.warn("scrollToTop: Container not found");
    return;
  }

  // If childSelector is provided, find the child element
  if (childSelector) {
    const childElement = element.querySelector(childSelector);
    if (childElement) {
      childElement.scrollTop = 0;
    } else {
      console.warn(`scrollToTop: Child element "${childSelector}" not found`);
    }
  } else {
    // Scroll the container itself
    element.scrollTop = 0;
  }
}
