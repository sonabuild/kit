import { strict as assert } from 'assert';
import {
  buildHeaders,
  handle404,
  createEnvelope,
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

  describe('createEnvelope', () => {
    it('should create envelope with required fields', () => {
      const ctx = { origin: 'https://app.sona.build' };
      const payload = { test: 'data' };

      const envelope = createEnvelope(ctx, payload);

      assert.ok(envelope.t);
      assert.ok(envelope.rid);
      assert.equal(envelope.origin, 'https://app.sona.build');
      assert.deepEqual(envelope.payload, { test: 'data' });
    });

    it('should generate unique request IDs', () => {
      const ctx = { origin: 'https://app.sona.build' };
      const envelope1 = createEnvelope(ctx, {});
      const envelope2 = createEnvelope(ctx, {});

      assert.notEqual(envelope1.rid, envelope2.rid);
    });
  });

  describe('buildAttestedRequestBody', () => {
    it('should build basic request body', () => {
      const body = buildAttestedRequestBody('encrypted123', { test: 'data' });

      assert.deepEqual(body, {
        ctB64: 'encrypted123',
        paramsHint: { test: 'data' }
      });
    });

    it('should include attestation flag when specified', () => {
      const body = buildAttestedRequestBody('encrypted123', {
        test: 'data',
        includeAttestation: false
      });

      assert.equal(body.includeAttestation, false);
    });

    it('should not include attestation flag when undefined', () => {
      const body = buildAttestedRequestBody('encrypted123', { test: 'data' });

      assert.equal(body.includeAttestation, undefined);
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

    it('should return raw data when no signature', () => {
      const data = { result: 'success' };
      const session = { integrityPubkeyB64: 'pubkey123' };

      const result = processAttestedResponse(data, session);

      assert.deepEqual(result, { result: 'success' });
    });
  });
});
