import { strict as assert } from 'assert';
import { Intent } from '../src/intent.js';

describe('Intent', () => {
  describe('constructor', () => {
    it('should create Intent with provided properties', () => {
      const data = {
        transaction: 'tx123',
        attestation: { signature: 'sig123', pcrs: {} },
        metadata: { protocol: 'test' },
        data: { result: 'success' },
        integrityPubkeyB64: 'pubkey123'
      };

      const intent = new Intent(data);

      assert.equal(intent.transaction, 'tx123');
      assert.deepEqual(intent.attestation, { signature: 'sig123', pcrs: {} });
      assert.deepEqual(intent.metadata, { protocol: 'test' });
      assert.deepEqual(intent.data, { result: 'success' });
      assert.equal(intent.integrityPubkeyB64, 'pubkey123');
    });
  });

  describe('getTransaction', () => {
    it('should return transaction', () => {
      const intent = new Intent({
        transaction: 'tx123'
      });

      assert.equal(intent.getTransaction(), 'tx123');
    });
  });

  describe('verify', () => {
    it('should return false when missing required fields', async () => {
      const intent = new Intent({});
      const result = await intent.verify();

      assert.equal(result, false);
    });

    it('should return false for invalid signature', async () => {
      const intent = new Intent({
        transaction: 'bWVzc2FnZQ==',
        attestation: { signature: 'c2lnbmF0dXJl', pcrs: {} },
        integrityPubkeyB64: 'cHVia2V5'
      });

      const result = await intent.verify();
      assert.equal(result, false);
    });
  });

  describe('confirm', () => {
    it('should throw when verification fails', async () => {
      const intent = new Intent({});
      const mockSendFn = async () => ({ success: true });

      await assert.rejects(
        async () => await intent.confirm(mockSendFn),
        /integrity verification failed/
      );
    });
  });
});
