import { strict as assert } from 'assert';
import { makeClient } from '../src/client.js';

describe('Client', () => {
  describe('makeClient', () => {
    it('should return a proxy function', () => {
      const mockExecutor = async () => ({ success: true });
      const client = makeClient(mockExecutor);

      assert.equal(typeof client, 'function');
    });

    it('should build nested property chains', () => {
      const mockExecutor = async () => ({ success: true });
      const client = makeClient(mockExecutor);

      assert.equal(typeof client.protocol, 'function');
      assert.equal(typeof client.protocol.action, 'function');
    });

    it('should throw when calling root proxy', async () => {
      const mockExecutor = async () => ({ success: true });
      const client = makeClient(mockExecutor);

      await assert.rejects(
        async () => await client(),
        /Cannot call client directly/
      );
    });

    it('should call executor with correct path and payload', async () => {
      let capturedPath = null;
      let capturedPayload = null;

      const mockExecutor = async (path, payload) => {
        capturedPath = path;
        capturedPayload = payload;
        return { success: true };
      };

      const client = makeClient(mockExecutor);
      const result = await client.protocol.action({ test: 'data' });

      assert.deepEqual(capturedPath, ['protocol', 'action']);
      assert.deepEqual(capturedPayload, { test: 'data' });
      assert.deepEqual(result, { success: true });
    });

    it('should handle await properly', async () => {
      const mockExecutor = async () => ({ success: true });
      const client = makeClient(mockExecutor);

      const result = await client.protocol.action();
      assert.deepEqual(result, { success: true });
    });
  });
});
