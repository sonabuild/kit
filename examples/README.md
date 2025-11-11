# @sonabuild/kit Examples

Simple Node.js examples showing how to use the Sona SDK.

## Prerequisites

```bash
npm install @sonabuild/kit
```

## Examples

### [basic.js](./basic.js)
Minimal example showing how to build and verify an attested transaction.

```bash
node examples/basic.js
```

### [discover-routes.js](./discover-routes.js)
Shows how to fetch and display available routes from the `/meta` endpoint.

```bash
node examples/discover-routes.js
```

Optional: Set API key for route discovery
```bash
SONA_API_KEY=your-key node examples/discover-routes.js
```

### [with-solana-wallet.js](./with-solana-wallet.js)
Complete example showing the full flow: build, verify, sign, and send a transaction. Shows how to integrate with your wallet of choice.

```bash
SONA_API_KEY=your-key WALLET_PUBKEY=your-pubkey node examples/with-solana-wallet.js
```

### [error-handling.js](./error-handling.js)
Demonstrates common error scenarios and how to handle them.

```bash
node examples/error-handling.js
```

### [custom-config.js](./custom-config.js)
Shows various configuration options for different environments (production, development, testing).

```bash
node examples/custom-config.js
```

## Environment Variables

- `SONA_API_KEY` - Your Sona API key (optional for most routes)
- `WALLET_PUBKEY` - Your Solana wallet public key

## Running Examples

All examples use ES modules (`type: "module"` in package.json).

If you get an error about ES modules, make sure you're using Node.js 14+ and the examples have `.js` extension (not `.mjs`).

## Common Patterns

### Discovering Available Routes

```javascript
const response = await fetch('https://api.sona.build/meta');
const meta = await response.json();
console.log(meta.routes);
```

### Building an Attested Transaction

```javascript
const sona = new Sona({ wallet: 'your-wallet-pubkey' });
const intent = await sona.protocol.action({ ... });
```

### Verifying and Signing

```javascript
if (await intent.verify()) {
  const signature = await intent.confirm(async (intents) => {
    // Sign and send transaction
  });
}
```

## Learn More

- [Main README](../README.md) - Full SDK documentation
- [llms.txt](../llms.txt) - Comprehensive API reference
