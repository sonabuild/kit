/**
 * Session management for attested routes
 * Caches session JWT and pubkey with automatic refresh
 */

import { debug } from './logger.js';

let cache = null;

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Get encryption session
 * Keys are persistent until enclave restart, so we cache indefinitely
 * @param {string} baseUrl - API base URL
 * @param {string|null} apiKey - Optional API key
 * @param {number} [timeout=30000] - Request timeout in milliseconds
 * @returns {Promise<Object>} Session object with encryption key
 */
export async function getSession(baseUrl, apiKey, timeout = 30000) {
  if (cache) {
    debug('Session', 'Using cached session (persistent keys)');
    return cache;
  }

  debug('Session', `Fetching session from ${baseUrl}/session`);

  const res = await fetchWithTimeout(
    `${baseUrl}/session`,
    {
      method: 'GET',
      headers: {
        ...(apiKey ? { 'x-api-key': apiKey } : {})
      }
    },
    timeout
  );

  if (!res.ok) {
    debug('Session', `Session fetch failed with status ${res.status}`);
    throw new Error(`Sona: /session failed ${res.status}`);
  }

  cache = await res.json();

  debug('Session', 'Session fetched successfully', {
    encryptionPubKey: cache.encryptionPubKeyB64?.slice(0, 16) + '...',
    mode: cache.mode
  });

  return cache;
}

/**
 * Clear session cache (forces refresh on next call)
 */
export function clearSessionCache() {
  cache = null;
}
