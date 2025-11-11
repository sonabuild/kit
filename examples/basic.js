/**
 * Basic Example - Simple transaction building
 *
 * This example shows the minimal setup needed to build an attested transaction.
 */

import { Sona } from '@sonabuild/kit';

async function main() {
  // Create Sona client with minimal configuration
  const sona = new Sona({
    wallet: 'your-wallet-pubkey-here'
  });

  try {
    // Build an attested transaction
    // Replace with actual protocol/action from /meta endpoint
    const intent = await sona.solend.deposit({
      amount: 1000000, // 1 SOL in lamports
      userPubkey: 'your-wallet-pubkey-here'
    });

    // Verify the integrity signature
    const isValid = await intent.verify();
    console.log('Transaction verified:', isValid);

    // Get the base64 transaction
    const txBase64 = intent.getTransaction();
    console.log('Transaction ready to sign:', txBase64.slice(0, 50) + '...');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
