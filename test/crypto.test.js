import { strict as assert } from 'assert';
import { encryptForEnclave } from '../src/crypto.js';

describe('Crypto', () => {
  describe('encryptForEnclave', () => {
    it('should encrypt payload and return base64 string', async () => {
      const payload = { test: 'data' };
      const publicKeyB64 = 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU=';

      const result = await encryptForEnclave(payload, publicKeyB64);

      assert.equal(typeof result, 'string');
      assert.ok(result.length > 0);
    });

    it('should produce different ciphertexts for same payload', async () => {
      const payload = { test: 'data' };
      const publicKeyB64 = 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU=';

      const result1 = await encryptForEnclave(payload, publicKeyB64);
      const result2 = await encryptForEnclave(payload, publicKeyB64);

      assert.notEqual(result1, result2);
    });
  });
});
