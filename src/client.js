/**
 * Dynamic client generator using Proxy
 * Creates nested property chains that map to API routes
 * Example: sona.solend.deposit() → POST /solend/deposit
 * All routes use POST with JSON body (JSON-RPC style)
 */

/**
 * Build dynamic client with Proxy
 * @param {Function} executeRoute - Route executor function (ctx, pathArray, payload) => Promise
 * @returns {Proxy} Proxied function that builds route chains
 */
export function makeClient(executeRoute) {
  function build(path = []) {
    // Create function that executes the route
    const fn = async (...args) => {
      // Don't allow calling the root proxy - must access specific routes
      if (path.length === 0) {
        throw new Error('Sona: Cannot call client directly. Use sona.protocol.operation() instead.');
      }

      // Execute route with path and first argument as payload
      return await executeRoute(path, args[0]);
    };

    // Wrap in Proxy to allow nested property access
    return new Proxy(fn, {
      get(_, prop) {
        // Support await without triggering route
        if (prop === 'then') return undefined;

        // Build deeper route path
        return build([...path, String(prop)]);
      }
    });
  }

  return build([]);
}
