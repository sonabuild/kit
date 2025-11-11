import { strict as assert } from 'assert';
import { Intent } from '../src/intent.js';

describe('Intent', () => {
  describe('constructor', () => {
    it('should create Intent with provided properties', () => {
      const data = {
        serializedMessageB64: 'message123',
        integritySigB64: 'sig123',
        integrityPubkeyB64: 'pubkey123'
      };

      const intent = new Intent(data);

      assert.equal(intent.serializedMessageB64, 'message123');
      assert.equal(intent.integritySigB64, 'sig123');
      assert.equal(intent.integrityPubkeyB64, 'pubkey123');
    });
  });

  describe('getTransaction', () => {
    it('should return serialized message', () => {
      const intent = new Intent({
        serializedMessageB64: 'message123'
      });

      assert.equal(intent.getTransaction(), 'message123');
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
        serializedMessageB64: 'bWVzc2FnZQ==',
        integritySigB64: 'c2lnbmF0dXJl',
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
