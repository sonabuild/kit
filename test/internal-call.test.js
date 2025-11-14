import { strict as assert } from 'assert';
import { _callRoute } from '../src/internal-call.js';
import { clearSessionCache } from '../src/session.js';
import { clearMetaCache } from '../src/meta.js';

describe('Internal Call', () => {
  afterEach(() => {
    clearSessionCache();
    clearMetaCache();
  });

  describe('_callRoute', () => {
    it('should be a function', () => {
      assert.equal(typeof _callRoute, 'function');
    });

    it('should accept context, path array, and payload', () => {
      const ctx = {
        baseUrl: 'http://localhost:8080',
        apiKey: 'test-key',
        wallet: 'wallet123',
        origin: 'https://sona.build'
      };
      const pathArray = ['test', 'route'];
      const payload = { test: 'data' };

      assert.doesNotThrow(() => {
        _callRoute(ctx, pathArray, payload);
      });
    });
  });
});
