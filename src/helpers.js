/**
 * Helper functions for route execution
 * Pure utility functions for building requests and processing responses
 */

import { getMeta, getRouteInfo } from './meta.js';
import { getSession } from './session.js';
import { encryptForEnclave } from './crypto.js';
import { Intent } from './intent.js';

/**
 * Fetch and validate route metadata
 * @param {Object} ctx - Context
 * @param {Array<string>} pathArray - Route path segments
 * @returns {Promise<Object>} Route metadata
 */
export async function fetchRouteMetadata(ctx, pathArray) {
  const meta = await getMeta(ctx.baseUrl, ctx.apiKey, ctx.timeout);
  const route = getRouteInfo(meta, pathArray);

  if (!route) {
    const routeKey = pathArray.join('/');
    console.warn(`[Sona] Protocol ${routeKey.replace(/\//g, '.')} not available for this API key`);
    return null;
  }

  return route;
}

/**
 * Generate unique request ID
 * @returns {string} Request ID
 */
export function generateRequestId() {
  return crypto.randomUUID();
}

/**
 * Build request headers
 * @param {Object} ctx - Context
 * @param {string} [requestId] - Optional request ID
 * @returns {Object} Headers object
 */
export function buildHeaders(ctx, requestId) {
  return {
    'content-type': 'application/json',
    ...(ctx.apiKey ? { 'x-api-key': ctx.apiKey } : {}),
    ...(requestId ? { 'x-request-id': requestId } : {}),
    ...ctx.headers
  };
}

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options, timeout) {
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
 * Handle 404 response
 * @param {string} routeKey - Route key
 * @returns {null}
 */
export function handle404(routeKey) {
  console.warn(`[Sona] Protocol ${routeKey} not supported`);
  return null;
}

/**
 * Execute plain (non-attested) route
 * @param {Object} ctx - Context
 * @param {string} routeKey - Route key
 * @param {Object} params - User params
 * @param {Object} timings - Timing object to track performance
 * @returns {Promise<any>} Response data
 */
export async function executePlainRoute(ctx, routeKey, params, timings) {
  const body = {
    context: ctx.context,
    params: params || {}   // User params
  };

  const requestId = generateRequestId();

  const fetchStart = performance.now();
  const res = await fetchWithTimeout(
    `${ctx.baseUrl}/${routeKey}`,
    {
      method: 'POST',
      headers: buildHeaders(ctx, requestId),
      body: JSON.stringify(body)
    },
    ctx.timeout
  );
  timings.api = performance.now() - fetchStart;

  if (res.status === 404) {
    return handle404(routeKey);
  }

  if (!res.ok) {
    throw new Error(`Sona: API error ${res.status}`);
  }

  const parseStart = performance.now();
  const result = await res.json();

  timings.parse = performance.now() - parseStart;

  return result.data;
}

/**
 * Create payload to encrypt for attested route
 * @param {Object} ctx - Context
 * @param {Object} params - User params
 * @returns {Object} Payload to encrypt (envelope + context + params)
 */
export function createEncryptedPayload(ctx, params) {
  return {
    envelope: {
      t: Date.now(),
      rid: crypto.randomUUID(),
      origin: ctx.context.origin
    },
    context: ctx.context,  // { wallet, origin }
    params: params || {}   // User params
  };
}

/**
 * Build request body for attested route
 * @param {string} encrypted - Base64 encrypted payload
 * @param {Object} ctx - Context
 * @param {Object} params - User params
 * @param {boolean} includeAttestation - Whether to include attestation in response
 * @returns {Object} Request body
 */
export function buildAttestedRequestBody(encrypted, ctx, params, includeAttestation = true) {
  return {
    encrypted,
    hint: {
      context: ctx.context,
      params: params || {}
    },
    includeAttestation
  };
}

/**
 * Extract server metrics from response headers
 * @param {Response} res - Fetch response
 * @returns {Object} Server metrics
 */
export function extractServerMetrics(res) {
  return {
    server_context_ms: parseFloat(res.headers.get('X-Sona-Server-Context-Ms') || '0'),
    server_enclave_ms: parseFloat(res.headers.get('X-Sona-Server-Enclave-Ms') || '0'),
    server_total_ms: parseFloat(res.headers.get('X-Sona-Server-Total-Ms') || '0')
  };
}

/**
 * Process attested route response
 * @param {Object} data - Response data from enclave
 * @param {Object} session - Session with integrity key
 * @param {Object} timings - Timing object
 * @returns {Intent} Intent wrapper for attested response
 */
export function processAttestedResponse(data, session, timings) {
  if (data.error === 'stale ciphertext') {
    throw new Error('stale ciphertext');
  }

  return new Intent({
    transaction: data.transaction,
    attestation: data.attestation,
    metadata: data.metadata,
    data: data.data,
    integrityPubkeyB64: session.integrityPubkeyB64
  }, timings);
}

/**
 * Execute attested route with encryption
 * @param {Object} ctx - Context
 * @param {string} routeKey - Route key
 * @param {Object} params - User params
 * @param {Object} timings - Timing object to track performance
 * @param {Object} options - Additional options
 * @returns {Promise<Intent|Object>} Intent or response data
 */
export async function executeAttestedRoute(ctx, routeKey, params, timings, options = {}) {
  const sessionStart = performance.now();
  const session = await getSession(ctx.baseUrl, ctx.apiKey, ctx.timeout);
  timings.session = performance.now() - sessionStart;

  // Payload to encrypt (envelope + context + params)
  const payloadToEncrypt = createEncryptedPayload(ctx, params);

  const encryptStart = performance.now();
  const encrypted = await encryptForEnclave(payloadToEncrypt, session.encryptionPubKeyB64);
  timings.encrypt = performance.now() - encryptStart;

  const includeAttestation = options.includeAttestation !== false;
  const requestBody = buildAttestedRequestBody(encrypted, ctx, params, includeAttestation);

  const requestId = generateRequestId();

  const apiStart = performance.now();
  const res = await fetchWithTimeout(
    `${ctx.baseUrl}/${routeKey}`,
    {
      method: 'POST',
      headers: buildHeaders(ctx, requestId),
      body: JSON.stringify(requestBody)
    },
    ctx.timeout
  );
  timings.api = performance.now() - apiStart;

  if (res.status === 404) {
    return handle404(routeKey);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sona: Attested API error ${res.status} ${text}`);
  }

  // Parse response
  const parseStart = performance.now();
  const data = await res.json();
  timings.parse = performance.now() - parseStart;

  // Extract server metrics
  const serverMetrics = extractServerMetrics(res);

  // Calculate client-side API overhead
  if (serverMetrics.server_total_ms > 0) {
    timings.api_overhead_ms = Math.round((timings.api - serverMetrics.server_total_ms) * 100) / 100;
  }

  // Store server metrics for logging
  timings.serverMetrics = serverMetrics;

  return processAttestedResponse(data, session, timings);
}
