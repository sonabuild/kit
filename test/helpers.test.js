import { strict as assert } from 'assert';
import {
  buildHeaders,
  handle404,
  createEncryptedPayload,
  buildAttestedRequestBody,
  extractServerMetrics,
  processAttestedResponse
} from '../src/helpers.js';

describe('Helpers', () => {
  describe('buildHeaders', () => {
    it('should build headers without API key', () => {
      const ctx = { baseUrl: 'http://localhost', apiKey: null };
      const headers = buildHeaders(ctx);

      assert.deepEqual(headers, {
        'content-type': 'application/json'
      });
    });

    it('should build headers with API key', () => {
      const ctx = { baseUrl: 'http://localhost', apiKey: 'test-key' };
      const headers = buildHeaders(ctx);

      assert.deepEqual(headers, {
        'content-type': 'application/json',
        'x-api-key': 'test-key'
      });
    });
  });

  describe('handle404', () => {
    it('should return null', () => {
      const result = handle404('test/route');
      assert.equal(result, null);
    });
  });

  describe('createEncryptedPayload', () => {
    it('should create payload with envelope, context, and params', () => {
      const ctx = { context: { wallet: 'ABC123', origin: 'https://app.sona.build' } };
      const params = { amount: 100 };

      const payload = createEncryptedPayload(ctx, params);

      assert.ok(payload.envelope);
      assert.ok(payload.envelope.t);
      assert.ok(payload.envelope.rid);
      assert.equal(payload.envelope.origin, 'https://app.sona.build');
      assert.deepEqual(payload.context, { wallet: 'ABC123', origin: 'https://app.sona.build' });
      assert.deepEqual(payload.params, { amount: 100 });
    });

    it('should generate unique request IDs', () => {
      const ctx = { context: { wallet: 'ABC123', origin: 'https://app.sona.build' } };
      const payload1 = createEncryptedPayload(ctx, {});
      const payload2 = createEncryptedPayload(ctx, {});

      assert.notEqual(payload1.envelope.rid, payload2.envelope.rid);
    });
  });

  describe('buildAttestedRequestBody', () => {
    it('should build request body with encrypted payload and hint', () => {
      const ctx = { context: { wallet: 'ABC123', origin: 'https://app.sona.build' } };
      const params = { amount: 100 };
      const body = buildAttestedRequestBody('encrypted123', ctx, params);

      assert.equal(body.encrypted, 'encrypted123');
      assert.deepEqual(body.hint.context, { wallet: 'ABC123', origin: 'https://app.sona.build' });
      assert.deepEqual(body.hint.params, { amount: 100 });
      assert.equal(body.includeAttestation, true);
    });

    it('should include attestation flag when true by default', () => {
      const ctx = { context: { wallet: 'ABC123', origin: 'https://app.sona.build' } };
      const body = buildAttestedRequestBody('encrypted123', ctx, {});

      assert.equal(body.includeAttestation, true);
    });

    it('should allow disabling attestation', () => {
      const ctx = { context: { wallet: 'ABC123', origin: 'https://app.sona.build' } };
      const body = buildAttestedRequestBody('encrypted123', ctx, {}, false);

      assert.equal(body.includeAttestation, false);
    });
  });

  describe('extractServerMetrics', () => {
    it('should extract server metrics from headers', () => {
      const mockRes = {
        headers: {
          get: (key) => {
            const headers = {
              'X-Sona-Server-Context-Ms': '10.5',
              'X-Sona-Server-Enclave-Ms': '20.3',
              'X-Sona-Server-Total-Ms': '30.8'
            };
            return headers[key] || null;
          }
        }
      };

      const metrics = extractServerMetrics(mockRes);

      assert.deepEqual(metrics, {
        server_context_ms: 10.5,
        server_enclave_ms: 20.3,
        server_total_ms: 30.8
      });
    });

    it('should return zeros for missing headers', () => {
      const mockRes = {
        headers: {
          get: () => null
        }
      };

      const metrics = extractServerMetrics(mockRes);

      assert.deepEqual(metrics, {
        server_context_ms: 0,
        server_enclave_ms: 0,
        server_total_ms: 0
      });
    });
  });

  describe('processAttestedResponse', () => {
    it('should throw on stale ciphertext error', () => {
      const data = { error: 'stale ciphertext' };
      const session = { integrityPubkeyB64: 'pubkey123' };

      assert.throws(
        () => processAttestedResponse(data, session),
        /stale ciphertext/
      );
    });

    it('should return Intent when signature present', () => {
      const data = {
        serializedMessageB64: 'message123',
        integritySigB64: 'sig123'
      };
      const session = { integrityPubkeyB64: 'pubkey123' };

      const result = processAttestedResponse(data, session);

      assert.equal(result.constructor.name, 'Intent');
      assert.equal(result.integrityPubkeyB64, 'pubkey123');
    });

    it('should return Intent even without signature', () => {
      const data = { transaction: 'tx123', data: { result: 'success' } };
      const session = { integrityPubkeyB64: 'pubkey123' };

      const result = processAttestedResponse(data, session);

      assert.equal(result.constructor.name, 'Intent');
      assert.equal(result.transaction, 'tx123');
      assert.deepEqual(result.data, { result: 'success' });
    });
  });
});
