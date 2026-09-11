import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

const runNode = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

// A separate Node process loads the actual build without Vitest transforming it.
// Each test has its own server, ephemeral port, and in-memory user store.
async function againstBuild(assertions: string) {
  await runNode(process.execPath, ['--input-type=module', '--eval', `
    import assert from 'node:assert/strict';
    import { once } from 'node:events';
    import { createApp } from './dist/app.js';

    const server = createApp().listen(0, '127.0.0.1');
    try {
      await once(server, 'listening');
      const base = 'http://127.0.0.1:' + server.address().port;
      const send = (path, options) => fetch(base + path, options);
      ${assertions}
    } finally {
      server.closeAllConnections();
      await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }
  `], { cwd: projectRoot, timeout: 10_000 });
}

describe('compiled API in Node.js', () => {
  it('serves welcome and health responses', async () => {
    await againstBuild(`
      const welcome = await send('/');
      assert.equal(welcome.status, 200);
      assert.deepEqual(await welcome.json(), { message: 'Welcome to the API' });
      const health = await send('/health');
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), { status: 'ok' });
    `);
  }, 15_000);

  it('supports the complete user lifecycle', async () => {
    await againstBuild(`
      assert.deepEqual(await (await send('/users')).json(), []);
      const created = await send('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ' Ada ' }),
      });
      assert.equal(created.status, 201);
      const user = await created.json();
      assert.equal(user.name, 'Ada');
      const location = created.headers.get('location');
      assert.equal(location, '/users/' + user.id);
      const retrieved = await send(location);
      assert.equal(retrieved.status, 200);
      assert.deepEqual(await retrieved.json(), user);
      assert.deepEqual(await (await send('/users')).json(), [user]);
      const deleted = await send(location, { method: 'DELETE' });
      assert.equal(deleted.status, 204);
      assert.equal(await deleted.text(), '');
      assert.equal((await send(location)).status, 404);
      assert.deepEqual(await (await send('/users')).json(), []);
    `);
  }, 15_000);

  it('returns JSON errors for invalid requests and unknown routes', async () => {
    await againstBuild(`
      for (const [body, error] of [
        ['{"name":"  "}', 'Name must be a non-empty string'],
        ['{', 'Invalid JSON'],
      ]) {
        const response = await send('/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), { error });
      }
      const missing = await send('/missing');
      assert.equal(missing.status, 404);
      assert.deepEqual(await missing.json(), { error: 'Route not found' });
      assert.deepEqual(await (await send('/users')).json(), []);
    `);
  }, 15_000);
});
