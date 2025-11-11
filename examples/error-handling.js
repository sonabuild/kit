/**
 * Error Handling Example
 *
 * This example shows how to handle common errors when using the SDK.
 */

import { Sona } from '@sonabuild/kit';

async function main() {
  const sona = new Sona({
    wallet: 'your-wallet-pubkey-here',
    timeout: 10000 // 10 second timeout
  });

  // Example 1: Handle route not available
  try {
    await sona.nonexistent.route({ data: 'test' });
  } catch (error) {
    if (error.message.includes('not available')) {
      console.log('✓ Caught route not available error');
      console.log('  Tip: Check /meta endpoint for available routes\n');
    }
  }

  // Example 2: Handle timeout
  try {
    const slowSona = new Sona({
      wallet: 'your-wallet-pubkey-here',
      timeout: 1 // Very short timeout for demo
    });
    await slowSona.solend.deposit({ amount: 1000000 });
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.log('✓ Caught timeout error');
      console.log('  Tip: Increase timeout option or check network\n');
    }
  }

  // Example 3: Handle verification failure
  try {
    // Simulate invalid intent
    const fakeIntent = {
      serializedMessageB64: 'invalid',
      integritySigB64: 'invalid',
      integrityPubkeyB64: 'invalid',
      verify: async function() { return false; },
      confirm: async function(sendFn) {
        if (!await this.verify()) {
          throw new Error('Integrity verification failed');
        }
        return sendFn([this]);
      }
    };

    await fakeIntent.confirm(async () => {});
  } catch (error) {
    if (error.message.includes('verification failed')) {
      console.log('✓ Caught verification failure');
      console.log('  Tip: Never sign unverified transactions\n');
    }
  }

  // Example 4: Stale ciphertext (handled automatically)
  console.log('✓ Stale ciphertext errors are retried automatically');
  console.log('  The SDK clears session cache and retries once\n');

  // Example 5: Using debug mode for troubleshooting
  console.log('✓ Enable debug mode for detailed logging:');
  console.log('  const sona = new Sona({ wallet: "...", debug: true });');
}

main();
