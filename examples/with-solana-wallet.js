/**
 * Complete Example - With Solana Wallet Integration
 *
 * This example shows the full flow: build, verify, sign, and send a transaction.
 *
 * Note: This is a conceptual example. Actual signing and sending depends on your
 * wallet setup. For browser wallets, use wallet adapters. For server-side, use
 * your preferred Solana library.
 */

import { Sona } from '@sonabuild/kit';

async function main() {
  // Your wallet public key
  const walletPubkey = process.env.WALLET_PUBKEY || 'your-wallet-pubkey-here';

  console.log('Wallet:', walletPubkey);

  // Create Sona client
  const sona = new Sona({
    wallet: walletPubkey,
    apiKey: process.env.SONA_API_KEY,
    debug: true // Enable debug logging
  });

  try {
    // Build attested transaction
    console.log('\n1. Building transaction...');
    const intent = await sona.solend.deposit({
      amount: 1000000,
      userPubkey: walletPubkey
    });

    // Verify integrity signature
    console.log('\n2. Verifying signature...');
    const isValid = await intent.verify();
    if (!isValid) {
      throw new Error('Transaction verification failed');
    }
    console.log('✓ Signature verified');

    // Get the base64 transaction
    const txBase64 = intent.getTransaction();
    console.log('\n3. Transaction ready to sign');
    console.log('Base64:', txBase64.slice(0, 50) + '...');

    // Sign and send transaction
    console.log('\n4. Signing and sending transaction...');
    const signature = await intent.confirm(async (intents) => {
      // Get the serialized transaction
      const txBase64 = intents[0].getTransaction();

      // Decode from base64
      const txBytes = Buffer.from(txBase64, 'base64');

      // TODO: Sign and send with your wallet/library of choice
      // Examples:
      // - Browser: Use wallet adapter (Phantom, Solflare, etc.)
      // - Node.js: Use keypair to sign, then send via RPC
      // - Hardware: Use Ledger/other hardware wallet

      console.log('  → Transaction bytes:', txBytes.length, 'bytes');
      console.log('  → Ready to sign and send');

      // Return transaction signature after sending
      return 'example-signature-here';
    });

    console.log('\n✓ Transaction confirmed:', signature);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

main();
