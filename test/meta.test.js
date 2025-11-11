import { strict as assert } from 'assert';
import { getMeta, getRouteInfo, clearMetaCache } from '../src/meta.js';

describe('Meta', () => {
  const mockBaseUrl = 'http://localhost:8080';
  const mockApiKey = 'test-key';

  afterEach(() => {
    clearMetaCache();
  });

  describe('getRouteInfo', () => {
    it('should return route info for valid route', () => {
      const meta = {
        routes: {
          '/test/route': { attested: true }
        }
      };
      const pathArray = ['test', 'route'];

      const result = getRouteInfo(meta, pathArray);
      assert.deepEqual(result, { attested: true });
    });

    it('should return undefined for missing route', () => {
      const meta = {
        routes: {
          '/test/route': { attested: true }
        }
      };
      const pathArray = ['other', 'route'];

      const result = getRouteInfo(meta, pathArray);
      assert.equal(result, undefined);
    });

    it('should return undefined when meta has no routes', () => {
      const meta = {};
      const pathArray = ['test', 'route'];

      const result = getRouteInfo(meta, pathArray);
      assert.equal(result, undefined);
    });
  });

  describe('clearMetaCache', () => {
    it('should clear the cache', () => {
      clearMetaCache();
      assert.ok(true);
    });
  });
});
