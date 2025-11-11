/**
 * Intent class for transaction verification and confirmation
 * Validates Ed25519 signatures from enclave
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { debug } from './logger.js';

// Configure SHA-512 for ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

// Browser-compatible base64 decoding
const base64ToUint8Array = (base64) => {
  if (typeof Buffer !== 'undefined') {
    // Node.js
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  } else {
    // Browser
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
};

export class Intent {
  constructor(obj) {
    Object.assign(this, obj);
  }

  /**
   * Verify Ed25519 integrity signature
   * @returns {Promise<boolean>} True if signature is valid
   */
  async verify() {
    debug('Attestation', 'Starting attestation verification');

    if (!this.serializedMessageB64 || !this.integritySigB64 || !this.integrityPubkeyB64) {
      debug('Attestation', 'Verification failed: missing required fields');
      console.warn('[Sona] Intent missing required fields for verification');
      return false;
    }

    debug('Attestation', 'All required fields present', {
      hasMessage: !!this.serializedMessageB64,
      hasSignature: !!this.integritySigB64,
      hasPublicKey: !!this.integrityPubkeyB64
    });

    try {
      debug('Attestation', 'Decoding base64 components');
      const msg = base64ToUint8Array(this.serializedMessageB64);
      const sig = base64ToUint8Array(this.integritySigB64);
      const pub = base64ToUint8Array(this.integrityPubkeyB64);

      debug('Attestation', 'Decoded sizes', {
        messageBytes: msg.length,
        signatureBytes: sig.length,
        publicKeyBytes: pub.length
      });

      debug('Attestation', 'Verifying Ed25519 signature with @noble/ed25519');
      debug('Attestation', `Message (first 32 bytes): ${Array.from(msg.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('')}...`);
      debug('Attestation', `Signature: ${Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('')}`);
      debug('Attestation', `Public Key: ${Array.from(pub).map(b => b.toString(16).padStart(2, '0')).join('')}`);

      const isValid = await ed.verify(sig, msg, pub);

      if (isValid) {
        debug('Attestation', 'Signature verification SUCCESS');
      } else {
        debug('Attestation', 'Signature verification FAILED');
      }

      return isValid;
    } catch (e) {
      debug('Attestation', `Verification error: ${e.message}`);
      console.error('[Sona] Signature verification error:', e);
      return false;
    }
  }

  /**
   * Confirm transaction by signing and sending
   * @param {Function} sendFn - Function to sign and send transaction
   * @returns {Promise<any>} Result from sendFn
   */
  async confirm(sendFn) {
    const isValid = await this.verify();
    if (!isValid) {
      throw new Error('Sona: integrity verification failed');
    }
    return sendFn([this]);
  }

  /**
   * Get serialized transaction for signing
   * @returns {string} Base64-encoded transaction
   */
  getTransaction() {
    return this.serializedMessageB64;
  }
}
