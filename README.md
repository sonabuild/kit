# @sonabuild/kit

> Client SDK for Sona attested Solana transaction builders

A secure protocol toolkit for building and verifying attested Solana transactions using Trusted Execution Environments (TEEs). This SDK provides end-to-end encryption, integrity verification via Ed25519 signatures, and dynamic routing to protocol-specific transaction builders.

## Features

- **Attested Transaction Building**: Secure transaction creation inside TEE enclaves
- **End-to-End Encryption**: X25519 ECDH + XSalsa20-Poly1305 sealed box encryption (libsodium-compatible)
- **Integrity Verification**: Ed25519 signatures for transaction attestation
- **Dynamic Protocol Routing**: Proxy-based API client with automatic route discovery
- **Session Management**: Persistent encryption keys with automatic cache management
- **Performance Monitoring**: Built-in timing metrics for encryption, API calls, and server processing
- **Debug Logging**: Comprehensive debug output for troubleshooting

## Installation

```bash
npm install @sonabuild/kit
```

## Quick Start

```javascript
import { Sona } from '@sonabuild/kit';

// Create client (uses defaults: api.sona.build, 30s timeout)
const sona = new Sona({
  wallet: 'your-wallet-pubkey'
});

// Build attested transaction
const intent = await sona.solend.deposit({
  amount: 1000000,
  userPubkey: 'your-wallet-pubkey'
});

// Verify integrity signature
const isValid = await intent.verify();
console.log('Transaction verified:', isValid);

// Confirm transaction (sign and send)
const result = await intent.confirm(async (intents) => {
  // Your signing logic here
  const tx = intents[0].getTransaction(); // base64 serialized message
  // Sign and send...
});
```

## Architecture

### Core Components

```
src/
├── index.js          # Main Sona class and exports
├── client.js         # Dynamic Proxy-based API client
├── session.js        # Encryption session management
├── crypto.js         # X25519 + XSalsa20-Poly1305 sealed box encryption
├── intent.js         # Transaction intent with Ed25519 verification
├── internal-call.js  # Route executor with encryption & retry logic
├── meta.js           # API metadata caching
└── logger.js         # Debug logging utilities
```

### Encryption Flow

```
Client                                    Enclave
  │                                          │
  ├─── GET /session ──────────────────────► │
  │                                          │
  │ ◄──── encryptionPubKey, integrityPubKey ┤
  │                                          │
  ├─── Generate ephemeral X25519 keypair    │
  ├─── ECDH shared secret                   │
  ├─── Derive key via HSalsa20              │
  ├─── BLAKE2b nonce derivation             │
  ├─── XSalsa20-Poly1305 encryption         │
  │                                          │
  ├─── POST /protocol/action {ctB64} ─────► │
  │                                          │
  │                                  Decrypt │
  │                                  Build tx│
  │                                  Sign tx │
  │                                          │
  │ ◄──── serializedMessage + integritySig ─┤
  │                                          │
  ├─── Verify Ed25519 signature             │
  └─── Return Intent                        │
```

## API Reference

### `Sona` Class

#### Constructor

```javascript
// Minimal configuration
const sona = new Sona({ wallet: 'your-wallet-pubkey' });

// Advanced configuration
const sona = new Sona({
  baseUrl: 'https://api.sona.build',  // API base URL (default)
  apiKey: 'your-api-key',              // Optional API key
  wallet: 'your-wallet-pubkey',        // Wallet public key for context
  origin: 'https://app.sona.build',   // Origin for enclave validation (default)
  timeout: 30000,                       // Request timeout in ms (default)
  headers: {                           // Custom headers (optional)
    'x-app-version': '1.0.0'
  },
  debug: false                         // Enable debug logging (default: false)
});
```

Options:
- `wallet` (string, optional): Wallet public key for context
- `baseUrl` (string): API base URL (default: 'https://api.sona.build')
- `apiKey` (string, optional): API authentication key
- `origin` (string, optional): Origin for enclave validation (default: window.location.origin or 'https://app.sona.build')
- `timeout` (number): Request timeout in milliseconds (default: 30000)
- `headers` (object, optional): Custom headers to include in all requests
- `debug` (boolean): Enable debug logging (default: false)

#### Dynamic Routing

The client uses JavaScript Proxy to create dynamic method chains:

```javascript
// Pattern: sona.{protocol}.{action}(payload)
await sona.solend.deposit({ amount: 1000000 })
await sona.marinade.stake({ amount: 5000000 })
await sona.jupiter.swap({ inputMint: 'SOL', outputMint: 'USDC', amount: 100 })
```

Routes are auto-discovered from `/meta` endpoint and validated at runtime.

#### Methods

- `dispose()`: Cleanup method (currently no-op as keys are persistent)

### `Intent` Class

Represents an attested transaction with integrity verification.

#### Properties

- `serializedMessageB64` (string): Base64-encoded Solana transaction
- `integritySigB64` (string): Base64-encoded Ed25519 signature
- `integrityPubkeyB64` (string): Base64-encoded Ed25519 public key

#### Methods

```javascript
await intent.verify()
```
Verifies Ed25519 signature over the serialized transaction. Returns `boolean`.

```javascript
await intent.confirm(sendFn)
```
Verifies integrity then calls `sendFn([intent])` to sign and send the transaction.

```javascript
intent.getTransaction()
```
Returns the base64-encoded serialized transaction for signing.

### Utility Functions

```javascript
import { clearMetaCache, clearSessionCache, setDebug } from '@sonabuild/kit';

clearMetaCache();     // Force refresh of route metadata
clearSessionCache();  // Force refresh of encryption session
setDebug(true);       // Enable debug logging
```

## Route Types

### Attested Routes

Routes with `attested: true` in metadata use full encryption flow:

1. Fetch encryption session (cached)
2. Encrypt payload with X25519 sealed box
3. Send encrypted request with `ctB64` + `paramsHint`
4. Receive signed transaction + integrity signature
5. Return `Intent` object for verification

### Plain Routes

Routes with `attested: false` send plain JSON POST requests with optional wallet context.

## Session Management

Sessions contain:
- `encryptionPubKeyB64`: X25519 public key for sealed box encryption
- `integrityPubkeyB64`: Ed25519 public key for signature verification
- `mode`: Enclave mode indicator

Sessions are cached indefinitely (keys are persistent until enclave restart). Use `clearSessionCache()` to force refresh.

## Error Handling

The SDK automatically retries on "stale ciphertext" errors by clearing the session cache and refetching keys.

```javascript
try {
  const intent = await sona.protocol.action(payload);
} catch (error) {
  if (error.message.includes('stale ciphertext')) {
    // Automatic retry with fresh session
  }
  console.error('Request failed:', error.message);
}
```

## Performance Monitoring

When `debug: true`, the SDK logs detailed performance metrics:

```
[Sona:Perf] Request completed in 245.67ms {
  route: 'solend/deposit',
  total_ms: 245.67,
  meta: 1.23,
  session: 0.45,
  encrypt: 2.34,
  api: 240.12,
  parse: 1.53,
  server_context_ms: 45.67,
  server_enclave_ms: 180.23,
  server_total_ms: 225.9,
  api_overhead_ms: 14.22
}
```

Breakdown shows:
- **meta**: Route metadata fetch time
- **session**: Session key fetch time
- **encrypt**: Client-side encryption time
- **api**: Total API request time
- **parse**: Response parsing time
- **server_context_ms**: Server-side context preparation
- **server_enclave_ms**: Time spent in enclave
- **server_total_ms**: Total server processing time
- **api_overhead_ms**: Network + API overhead

## Cryptography

### Encryption (Sealed Box)

Compatible with libsodium's `crypto_box_seal()`:

1. **Ephemeral keypair**: Generate random X25519 keypair
2. **ECDH**: Compute shared secret with recipient's public key
3. **Key derivation**: HSalsa20 with "expand 32-byte k" sigma constant
4. **Nonce derivation**: BLAKE2b(ephemeralPubkey || recipientPubkey)
5. **Encryption**: XSalsa20-Poly1305 AEAD
6. **Output**: ephemeralPubkey (32 bytes) || ciphertext || MAC (16 bytes)

### Verification (Ed25519)

Integrity signatures use standard Ed25519 with SHA-512:

```javascript
const isValid = await ed.verify(signature, message, publicKey);
```

## Testing

```bash
npm test
```

Tests include:
- **Encryption**: Verifies sealed box encryption format
- **Signature verification**: Tests Ed25519 integrity checks
- **Route execution**: Tests both attested and plain routes
- **Configuration validation**: Tests all config options
- **Session management**: Tests caching and refresh
- **Error handling**: Tests timeout and retry logic

## Dependencies

Production:
- `@noble/ciphers` (^1.0.0): XSalsa20-Poly1305, HSalsa20
- `@noble/curves` (^1.7.0): X25519 ECDH
- `@noble/ed25519` (^2.0.0): Ed25519 signatures
- `@noble/hashes` (^1.3.0): BLAKE2b, SHA-512

Dev:
- `mocha` (^10.2.0): Test runner
- `chai` (^4.3.10): Assertions

## Browser Support

The SDK is designed for both Node.js and modern browsers:

- Uses `fetch` API (polyfill required for Node < 18)
- Includes browser-compatible base64 encoding/decoding
- Pure JavaScript cryptography (no native dependencies)

## Configuration Validation

The SDK validates all configuration options at construction time:

- **Type Validation**: All options are validated for correct types
- **URL Validation**: baseUrl must start with http:// or https://
- **HTTPS Warning**: Non-localhost HTTP connections trigger a warning
- **Timeout Validation**: timeout must be a positive number
- **Headers Validation**: headers must be a plain object

Invalid configuration will throw descriptive errors immediately.

## Request Features

### Timeout Control

All requests have configurable timeouts (default: 30 seconds):

```javascript
const sona = new Sona({
  timeout: 10000  // 10 second timeout
});
```

### Custom Headers

Include custom headers in all requests:

```javascript
const sona = new Sona({
  headers: {
    'x-app-version': '1.0.0',
    'x-environment': 'production'
  }
});
```

### Request ID Tracking

All requests automatically include a unique `x-request-id` header for tracing requests through the system. This helps with debugging and correlating client logs with server logs.

## Security Considerations

1. **API Key Protection**: Never expose API keys in client-side code
2. **Wallet Context**: Only send wallet public keys, never private keys
3. **Intent Verification**: Always verify integrity before signing transactions
4. **Origin Validation**: Enclave validates request origin (configurable via `origin` option)
5. **Timing Attacks**: All crypto operations use constant-time implementations
6. **HTTPS Enforcement**: SDK warns when using HTTP connections to non-localhost hosts
7. **Browser Compatibility**: All crypto operations are browser-compatible without Buffer polyfills

## Development

### Build

```bash
# No build step required - pure ES modules
npm run test
```

### Debug Mode

Enable comprehensive logging:

```javascript
import { Sona, setDebug } from '@sonabuild/kit';

setDebug(true); // Or pass debug: true to constructor

const sona = new Sona({
  baseUrl: 'http://localhost:8080',
  debug: true
});
```

Debug categories:
- `[Sona:Session]`: Session fetch and caching
- `[Sona:Crypto]`: Encryption operations
- `[Sona:Request]`: API requests
- `[Sona:Attestation]`: Signature verification
- `[Sona:Perf]`: Performance metrics

## License

See package.json for license information.

## Contributing

This is an internal protocol toolkit. For issues or questions, contact the Sona development team.
