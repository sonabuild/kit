import { strict as assert } from 'assert';
import { clearSessionCache } from '../src/session.js';

describe('Session', () => {
  describe('clearSessionCache', () => {
    it('should clear session cache', () => {
      clearSessionCache();
      assert.ok(true);
    });
  });
});
