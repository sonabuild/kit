/**
 * Unified route executor
 * Handles both plain and attested routes with encryption
 */

import { clearSessionCache } from './session.js';
import { debug, isDebugEnabled } from './logger.js';
import {
  fetchRouteMetadata,
  executePlainRoute,
  executeAttestedRoute
} from './helpers.js';

/**
 * Execute route call with automatic retry on stale ciphertext
 * @param {Object} ctx - Context with baseUrl, apiKey, wallet, origin
 * @param {Array<string>} pathArray - Route path segments
 * @param {Object} payload - Request payload
 * @returns {Promise<any>} Response data or Intent
 */
export async function _callRoute(ctx, pathArray, payload = {}) {
  try {
    return await _callRouteInternal(ctx, pathArray, payload);
  } catch (error) {
    if (error.message && error.message.includes('stale ciphertext')) {
      debug('Session', 'Stale ciphertext detected, clearing session cache and retrying');
      clearSessionCache();
      return await _callRouteInternal(ctx, pathArray, payload);
    }
    throw error;
  }
}

/**
 * Internal route call implementation
 * @param {Object} ctx - Context with baseUrl, apiKey, wallet, origin
 * @param {Array<string>} pathArray - Route path segments
 * @param {Object} payload - Request payload
 * @returns {Promise<any>} Response data or Intent
 */
async function _callRouteInternal(ctx, pathArray, payload = {}) {
  const routeKey = pathArray.join('/');
  const perfStart = performance.now();
  const timings = {};

  debug('Request', `Starting ${routeKey} request`);

  const metaStart = performance.now();
  const route = await fetchRouteMetadata(ctx, pathArray);
  timings.meta = performance.now() - metaStart;

  if (!route) {
    return null;
  }

  debug('Request', `Route type: ${route.attested ? 'attested' : 'plain'}`);

  const result = route.attested
    ? await executeAttestedRoute(ctx, routeKey, payload, timings)
    : await executePlainRoute(ctx, routeKey, payload, timings);

  timings.total = performance.now() - perfStart;

  logPerformanceMetrics(routeKey, timings, timings.serverMetrics, perfStart);

  return result;
}

/**
 * Log performance metrics in Stripe-quality format
 * @param {string} route - Route key
 * @param {Object} timings - Timing breakdown
 * @param {Object} serverMetrics - Server-side metrics
 * @param {number} perfStart - Performance start time
 */
function logPerformanceMetrics(route, timings, serverMetrics = {}, perfStart) {
  if (!isDebugEnabled()) return;

  const metrics = {
    route,
    total_ms: Math.round(timings.total || (performance.now() - perfStart)),
    ...timings,
    ...serverMetrics
  };

  delete metrics.serverMetrics;

  Object.keys(metrics).forEach(key => {
    if (key !== 'route' && typeof metrics[key] === 'number') {
      metrics[key] = Math.round(metrics[key] * 100) / 100;
    }
  });

  const total = metrics.total_ms;
  const breakdown = {};
  Object.keys(timings).forEach(key => {
    if (key !== 'total' && key !== 'serverMetrics' && typeof timings[key] === 'number') {
      const pct = ((timings[key] / total) * 100).toFixed(1);
      breakdown[key] = `${pct}%`;
    }
  });

  debug('Perf', `Request completed in ${total}ms`, metrics);
  debug('Perf', 'Client time breakdown', breakdown);

  if (serverMetrics && serverMetrics.server_total_ms > 0) {
    const serverBreakdown = {
      context: `${((serverMetrics.server_context_ms / serverMetrics.server_total_ms) * 100).toFixed(1)}%`,
      enclave: `${((serverMetrics.server_enclave_ms / serverMetrics.server_total_ms) * 100).toFixed(1)}%`
    };
    debug('Perf', 'Server time breakdown', serverBreakdown);

    if (timings.api_overhead_ms) {
      debug('Perf', `Network + API overhead: ${timings.api_overhead_ms}ms (${((timings.api_overhead_ms / timings.api) * 100).toFixed(1)}% of API time)`);
    }
  }

  if (total > 1000) {
    console.warn(`[Sona:Perf] Slow request detected (${total}ms)`);
  }
}
