import { strict as assert } from 'assert';
import { setDebug, isDebugEnabled, debug } from '../src/logger.js';

describe('Logger', () => {
  afterEach(() => {
    setDebug(false);
  });

  describe('setDebug', () => {
    it('should enable debug logging', () => {
      setDebug(true);
      assert.equal(isDebugEnabled(), true);
    });

    it('should disable debug logging', () => {
      setDebug(false);
      assert.equal(isDebugEnabled(), false);
    });
  });

  describe('isDebugEnabled', () => {
    it('should return false by default', () => {
      assert.equal(isDebugEnabled(), false);
    });

    it('should return true when debug is enabled', () => {
      setDebug(true);
      assert.equal(isDebugEnabled(), true);
    });
  });

  describe('debug', () => {
    it('should not throw when debug is disabled', () => {
      setDebug(false);
      assert.doesNotThrow(() => {
        debug('Test', 'message');
      });
    });

    it('should not throw when debug is enabled', () => {
      setDebug(true);
      assert.doesNotThrow(() => {
        debug('Test', 'message', { data: 'value' });
      });
    });
  });
});
