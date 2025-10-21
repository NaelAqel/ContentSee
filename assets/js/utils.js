/* ==========================================================================
   UTILS.JS — Helper Functions for Gallery
   ========================================================================== */

/**
 * Debounce function — delays execution of func until wait ms have passed
 * Useful for search input to avoid too many updates
 */
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Fuzzy match for a single word (Levenshtein distance ≤ 1)
 * Returns true if str is close to target
 */
export function fuzzyMatch(str, target) {
  if (!str || !target) return false;
  str = str.toLowerCase();
  target = target.toLowerCase();

  if (str === target) return true;
  if (Math.abs(str.length - target.length) > 1) return false;

  // Simple distance ≤ 1 check
  let mismatches = 0;
  let i = 0, j = 0;

  while (i < str.length && j < target.length) {
    if (str[i] !== target[j]) {
      mismatches++;
      if (mismatches > 1) return false;
      if (str.length > target.length) i++;
      else if (str.length < target.length) j++;
      else { i++; j++; }
    } else {
      i++; j++;
    }
  }

  // Account for trailing char
  if (i < str.length || j < target.length) mismatches++;
  return mismatches <= 1;
}

/**
 * Flatten array of strings or arrays into single array
 */
export function flattenArray(arr) {
  return arr.reduce((acc, val) => acc.concat(val), []);
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  return obj == null || (typeof obj === "object" && Object.keys(obj).length === 0);
}
