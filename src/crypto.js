/**
 * Encryption helper for sealed-box encryption
 * Uses @noble libraries for X25519 + XSalsa20-Poly1305
 * Compatible with libsodium crypto_box_seal
 */

import { x25519 } from '@noble/curves/ed25519';
import { xsalsa20poly1305, hsalsa } from '@noble/ciphers/salsa';
import { blake2b } from '@noble/hashes/blake2b';
import { randomBytes } from '@noble/hashes/utils';
import { debug } from './logger.js';

// NaCl/libsodium constants for HSalsa20
const sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]); // "expand 32-byte k"

/**
 * Derive encryption key from ECDH shared secret (crypto_box_beforenm equivalent)
 * @param {Uint8Array} sharedSecret - X25519 ECDH output (32 bytes)
 * @returns {Uint8Array} Derived key (32 bytes)
 */
function cryptoBoxBeforenm(sharedSecret) {
  // Convert inputs to Uint32Array for hsalsa
  const s = new Uint32Array(4); // sigma constant
  const k = new Uint32Array(8); // shared secret key
  const i = new Uint32Array(4); // zero input
  const o = new Uint32Array(8); // output key

  // Load sigma constant
  for (let j = 0; j < 4; j++) {
    s[j] = sigma[j * 4] | (sigma[j * 4 + 1] << 8) | (sigma[j * 4 + 2] << 16) | (sigma[j * 4 + 3] << 24);
  }

  // Load shared secret
  for (let j = 0; j < 8; j++) {
    k[j] = sharedSecret[j * 4] | (sharedSecret[j * 4 + 1] << 8) | (sharedSecret[j * 4 + 2] << 16) | (sharedSecret[j * 4 + 3] << 24);
  }

  // Input is zero (i array is already zero)

  // Run HSalsa20
  hsalsa(s, k, i, o);

  // Convert output back to Uint8Array
  const key = new Uint8Array(32);
  for (let j = 0; j < 8; j++) {
    key[j * 4] = o[j] & 0xff;
    key[j * 4 + 1] = (o[j] >>> 8) & 0xff;
    key[j * 4 + 2] = (o[j] >>> 16) & 0xff;
    key[j * 4 + 3] = (o[j] >>> 24) & 0xff;
  }

  return key;
}

/**
 * Equivalent to sodium.crypto_box_seal()
 * Compatible with libsodium's sealed box format
 * @param {Uint8Array} msg
 * @param {Uint8Array} recipientPubKey (32 bytes)
 * @returns {Uint8Array} 32-byte ephemeral pubkey + ciphertext
 */
function cryptoBoxSealCompatible(msg, recipientPubKey) {
  // 1. Ephemeral keypair
  const ephPriv = randomBytes(32);
  const ephPub = x25519.getPublicKey(ephPriv);

  // 2. Shared secret via X25519 ECDH
  const shared = x25519.scalarMult(ephPriv, recipientPubKey);

  // 3. Derive encryption key using HSalsa20 (crypto_box_beforenm)
  const key = cryptoBoxBeforenm(shared);

  // 4. Derive nonce from BLAKE2b(ephemeralPubKey || recipientPubKey)
  // This matches libsodium's crypto_box_seal nonce derivation
  const nonceInput = new Uint8Array(64); // 32 + 32 bytes
  nonceInput.set(ephPub, 0);
  nonceInput.set(recipientPubKey, 32);
  const nonce = blake2b(nonceInput, { dkLen: 24 }); // XSalsa20 uses 24-byte nonce

  // 5. Encrypt with XSalsa20-Poly1305 (same as libsodium)
  const cipher = xsalsa20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(msg);

  // 6. Prepend ephemeral public key
  const out = new Uint8Array(ephPub.length + ciphertext.length);
  out.set(ephPub);
  out.set(ciphertext, ephPub.length);

  return out;
}

/**
 * Browser-compatible base64 encoding
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} Base64 string
 */
function bytesToBase64(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  } else {
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  }
}

/**
 * Browser-compatible base64 decoding
 * @param {string} base64 - Base64 string
 * @returns {Uint8Array} Decoded bytes
 */
function base64ToBytes(base64) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  } else {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Encrypt payload for enclave using sealed box
 * @param {Object} payload - Payload to encrypt
 * @param {string} sessionPubKeyB64 - Base64-encoded session public key
 * @returns {Promise<string>} Base64-encoded ciphertext
 */
export async function encryptForEnclave(payload, sessionPubKeyB64) {
  debug('Crypto', 'Starting payload encryption for enclave');
  debug('Crypto', `Payload size: ${JSON.stringify(payload).length} bytes`);

  const msg = new TextEncoder().encode(JSON.stringify(payload));
  debug('Crypto', 'Decoding session public key from base64');
  const recipientPubKey = base64ToBytes(sessionPubKeyB64);

  debug('Crypto', 'Creating X25519 sealed box');
  const sealed = cryptoBoxSealCompatible(msg, recipientPubKey);

  const ctB64 = bytesToBase64(sealed);
  debug('Crypto', `Encryption complete (ciphertext: ${ctB64.length} bytes)`);

  return ctB64;
}
