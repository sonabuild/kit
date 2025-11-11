/**
 * Metadata handling for route discovery
 * Caches /meta response to determine which routes are available
 */

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
 * Fetch metadata from API
 * @param {string} baseUrl - API base URL
 * @param {string|null} apiKey - Optional API key
 * @param {number} [timeout=30000] - Request timeout in milliseconds
 * @returns {Promise<Object>} Metadata object with routes
 */
export async function getMeta(baseUrl, apiKey, timeout = 30000) {
  if (cache) return cache;

  const res = await fetchWithTimeout(
    `${baseUrl}/meta`,
    {
      headers: apiKey ? { 'x-api-key': apiKey } : {}
    },
    timeout
  );

  if (!res.ok) {
    throw new Error(`Sona: /meta failed ${res.status}`);
  }

  cache = await res.json();
  return cache;
}

/**
 * Get route information from metadata
 * @param {Object} meta - Metadata object
 * @param {Array<string>} pathArray - Route path segments
 * @returns {Object|null} Route info or null if not found
 */
export function getRouteInfo(meta, pathArray) {
  // Meta routes have leading slashes, add it for lookup
  const key = '/' + pathArray.join('/');
  return meta.routes && meta.routes[key];
}

/**
 * Clear cached metadata
 */
export function clearMetaCache() {
  cache = null;
}
