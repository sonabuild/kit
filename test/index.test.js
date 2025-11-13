import { strict as assert } from 'assert';
import { Sona, clearMetaCache, clearSessionCache, Intent, setDebug } from '../src/index.js';

describe('Index', () => {
  describe('exports', () => {
    it('should export Sona class', () => {
      assert.equal(typeof Sona, 'function');
    });

    it('should export clearMetaCache', () => {
      assert.equal(typeof clearMetaCache, 'function');
    });

    it('should export clearSessionCache', () => {
      assert.equal(typeof clearSessionCache, 'function');
    });

    it('should export Intent', () => {
      assert.equal(typeof Intent, 'function');
    });

    it('should export setDebug', () => {
      assert.equal(typeof setDebug, 'function');
    });
  });

  describe('Sona', () => {
    it('should require wallet parameter', () => {
      assert.throws(() => {
        new Sona();
      }, /wallet is required/);
    });

    it('should create instance with wallet', () => {
      const sona = new Sona({ wallet: 'wallet123' });
      assert.ok(sona);
      assert.equal(sona.context.wallet, 'wallet123');
    });

    it('should create instance with custom options', () => {
      const sona = new Sona({
        baseUrl: 'https://api.sona.build',
        apiKey: 'test-key',
        wallet: 'wallet123',
        origin: 'https://custom.origin',
        debug: false
      });
      assert.ok(sona);
      assert.equal(sona.context.wallet, 'wallet123');
      assert.equal(sona.origin, 'https://custom.origin');
    });

    it('should return proxy client with dynamic protocol access', () => {
      const sona = new Sona({ wallet: 'wallet123' });
      assert.equal(typeof sona, 'object');
      assert.ok(sona.wallet);
      assert.ok(sona.context);
      // Dynamic protocol access through proxy
      assert.equal(typeof sona.protocol, 'function');
      assert.equal(typeof sona.solend, 'function');
    });
  });
});
