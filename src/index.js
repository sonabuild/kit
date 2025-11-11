/**
 * @sonabuild/kit
 * Client SDK for Sona attested Solana transactions
 */

import { makeClient } from './client.js';
import { _callRoute } from './internal-call.js';
import { setDebug } from './logger.js';
import { getSession } from './session.js';

const DEFAULT_ORIGIN = 'https://app.sona.build';
const DEFAULT_BASE_URL = 'https://api.sona.build';
const DEFAULT_TIMEOUT = 30000;

/**
 * Validate configuration options
 * @param {Object} opts - Configuration options
 * @throws {Error} If configuration is invalid
 */
function validateConfig(opts) {
  if (opts.baseUrl !== undefined && typeof opts.baseUrl !== 'string') {
    throw new Error('baseUrl must be a string');
  }

  if (opts.baseUrl && !opts.baseUrl.startsWith('http://') && !opts.baseUrl.startsWith('https://')) {
    throw new Error('baseUrl must start with http:// or https://');
  }

  if (opts.baseUrl && opts.baseUrl.startsWith('http://') && !opts.baseUrl.includes('localhost')) {
    console.warn('[Sona] Warning: Using insecure HTTP connection. Use HTTPS in production.');
  }

  if (opts.apiKey !== undefined && typeof opts.apiKey !== 'string') {
    throw new Error('apiKey must be a string');
  }

  if (opts.wallet !== undefined && typeof opts.wallet !== 'string') {
    throw new Error('wallet must be a string');
  }

  if (opts.origin !== undefined && typeof opts.origin !== 'string') {
    throw new Error('origin must be a string');
  }

  if (opts.timeout !== undefined && (typeof opts.timeout !== 'number' || opts.timeout <= 0)) {
    throw new Error('timeout must be a positive number');
  }

  if (opts.debug !== undefined && typeof opts.debug !== 'boolean') {
    throw new Error('debug must be a boolean');
  }

  if (opts.headers !== undefined && (typeof opts.headers !== 'object' || Array.isArray(opts.headers))) {
    throw new Error('headers must be an object');
  }
}

/**
 * Sona client
 * Provides dynamic routing to API endpoints with automatic encryption
 */
export class Sona {
  /**
   * Create Sona client
   * @param {Object} opts - Configuration options
   * @param {string} [opts.baseUrl='https://api.sona.build'] - API base URL
   * @param {string} [opts.apiKey] - Optional API key
   * @param {string} [opts.wallet] - Wallet public key
   * @param {string} [opts.origin] - Origin for enclave validation (defaults to window.location.origin or 'https://app.sona.build')
   * @param {number} [opts.timeout=30000] - Request timeout in milliseconds
   * @param {Object} [opts.headers] - Custom headers to include in all requests
   * @param {boolean} [opts.debug=false] - Enable debug logging
   */
  constructor(opts = {}) {
    validateConfig(opts);

    this.baseUrl = opts.baseUrl || DEFAULT_BASE_URL;
    this.apiKey = opts.apiKey || null;
    this.wallet = opts.wallet || null;
    this.origin = opts.origin || (typeof window !== 'undefined' ? window.location.origin : DEFAULT_ORIGIN);
    this.timeout = opts.timeout !== undefined ? opts.timeout : DEFAULT_TIMEOUT;
    this.headers = opts.headers || {};

    setDebug(!!opts.debug);

    // Build context object for route execution
    const ctx = {
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      wallet: this.wallet,
      origin: this.origin,
      timeout: this.timeout,
      headers: this.headers
    };

    const executeRoute = (pathArray, payload) => _callRoute(ctx, pathArray, payload);

    this._startSessionRefetch();

    return makeClient(executeRoute);
  }

  async _startSessionRefetch() {
    try {
      await getSession(this.baseUrl, this.apiKey, this.timeout);
    } catch (error) {
      console.warn(`[Sona] Failed to prefetch session: ${error.message}`);
    }
  }

}

// Export helper functions
export { clearMetaCache } from './meta.js';
export { clearSessionCache } from './session.js';
export { Intent } from './intent.js';
export { setDebug } from './logger.js';
