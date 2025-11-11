/**
 * Logger utility for Sona SDK
 * Provides debug logging when enabled
 */

let debugEnabled = false;

/**
 * Enable or disable debug logging
 * @param {boolean} enabled - Whether to enable debug logging
 */
export function setDebug(enabled) {
  debugEnabled = enabled;
}

/**
 * Check if debug logging is enabled
 * @returns {boolean}
 */
export function isDebugEnabled() {
  return debugEnabled;
}

/**
 * Log debug message if debug is enabled
 * @param {string} category - Category of the log (e.g., 'JWT', 'Session', 'Crypto')
 * @param {string} message - Log message
 * @param {Object} [data] - Optional data to log
 */
export function debug(category, message, data) {
  if (!debugEnabled) return;

  const timestamp = new Date().toISOString();
  const prefix = `[Sona:${category}]`;

  if (data !== undefined) {
    console.log(`${timestamp} ${prefix} ${message}`, data);
  } else {
    console.log(`${timestamp} ${prefix} ${message}`);
  }
}

/**
 * Log info message (always shown)
 * @param {string} message - Log message
 */
export function info(message) {
  console.log(`[Sona] ${message}`);
}

/**
 * Log warning message (always shown)
 * @param {string} message - Warning message
 */
export function warn(message) {
  console.warn(`[Sona] ${message}`);
}

/**
 * Log error message (always shown)
 * @param {string} message - Error message
 * @param {Error} [error] - Optional error object
 */
export function error(message, error) {
  if (error) {
    console.error(`[Sona] ${message}`, error);
  } else {
    console.error(`[Sona] ${message}`);
  }
}
