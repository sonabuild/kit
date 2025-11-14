/**
 * Custom Configuration Example
 *
 * This example shows various configuration options for production use.
 */

import { Sona, setDebug } from '@sonabuild/kit';

async function main() {
  // Example 1: Production configuration
  console.log('Example 1: Production setup\n');
  const prodSona = new Sona({
    baseUrl: 'https://api.sona.build',
    apiKey: process.env.SONA_API_KEY,
    wallet: process.env.WALLET_PUBKEY,
    timeout: 60000, // 60 seconds for slow operations
    headers: {
      'x-app-version': '1.0.0',
      'x-environment': 'production',
      'x-user-id': 'user-123'
    }
  });
  console.log('✓ Production client configured');
  console.log('  - 60s timeout');
  console.log('  - Custom headers included\n');

  // Example 2: Development/testing configuration
  console.log('Example 2: Development setup\n');
  const devSona = new Sona({
    baseUrl: 'http://localhost:8080', // Local API
    wallet: 'test-wallet-pubkey',
    debug: true, // Enable verbose logging
    timeout: 30000
  });
  console.log('✓ Development client configured');
  console.log('  - Debug logging enabled');
  console.log('  - Local API endpoint\n');

  // Example 3: Global debug control
  console.log('Example 3: Global debug control\n');
  setDebug(true);
  const sona1 = new Sona({ wallet: 'wallet1' });
  console.log('✓ Debug enabled globally');

  setDebug(false);
  const sona2 = new Sona({ wallet: 'wallet2' });
  console.log('✓ Debug disabled globally\n');

  // Example 4: Custom origin for enclave validation
  console.log('Example 4: Custom origin\n');
  const customOriginSona = new Sona({
    wallet: 'wallet-pubkey',
    origin: 'https://my-app.example.com' // Custom app origin
  });
  console.log('✓ Custom origin configured');
  console.log('  - Enclave will validate this origin\n');

  // Example 5: Minimal configuration
  console.log('Example 5: Minimal setup\n');
  const minimalSona = new Sona({
    wallet: 'wallet-pubkey'
  });
  console.log('✓ Minimal client configured');
  console.log('  - Uses all defaults');
  console.log('  - baseUrl: https://api.sona.build');
  console.log('  - timeout: 30000ms');
  console.log('  - origin: https://sona.build\n');
}

main();
