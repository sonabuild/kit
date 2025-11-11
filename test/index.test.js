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
    it('should create instance with default options', () => {
      const sona = new Sona();
      assert.ok(sona);
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
    });

    it('should return proxy client', () => {
      const sona = new Sona();
      assert.equal(typeof sona, 'function');
      assert.equal(typeof sona.protocol, 'function');
    });
  });
});
