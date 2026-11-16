import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createExportGate, mapExportItems, fetchExportArray } from '../src/exportTasks.js';

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

test('rapid clicks and a new page share one lock; success allows a later export', async () => {
  const gate = createExportGate();
  const pending = deferred();
  const states = [];
  let calls = 0;
  const unsubscribe = gate.subscribe(() => states.push(gate.isBusy()));
  const first = gate.run(async () => { calls++; await pending.promise; });
  assert.equal(gate.isBusy(), true);
  await Promise.all(Array.from({ length: 30 }, () => gate.run(() => { calls++; })));
  assert.equal(calls, 1);
  // Unmounting a page unsubscribes its view, not the active task.
  unsubscribe();
  const nextPageStates = [];
  gate.subscribe(() => nextPageStates.push(gate.isBusy()));
  await gate.run(() => { calls++; });
  assert.equal(calls, 1);
  pending.resolve();
  await first;
  assert.deepEqual(states, [true]);
  assert.deepEqual(nextPageStates, [false]);
  await gate.run(() => { calls++; });
  assert.equal(calls, 2);
});

test('synchronous and asynchronous errors release the lock', async () => {
  const gate = createExportGate();
  for (const task of [() => { throw new Error('failed'); }, async () => { throw new Error('failed'); }]) {
    await assert.rejects(gate.run(task), /failed/);
    assert.equal(gate.isBusy(), false);
  }
  assert.equal(await gate.run(() => 'retried'), 'retried');
});

test('large exports stay at three active requests and preserve input order', async () => {
  let active = 0;
  let peak = 0;
  const progress = [];
  const items = Array.from({ length: 400 }, (_, i) => i);
  const output = await mapExportItems(items, async (id) => {
    active++;
    peak = Math.max(peak, active);
    await delay(id % 3);
    active--;
    return `audit-${id}`;
  }, { onProgress: (done, total) => progress.push([done, total]) });
  assert.equal(peak, 3);
  assert.equal(active, 0);
  assert.deepEqual(output, items.map((id) => `audit-${id}`));
  assert.deepEqual(progress.at(-1), [400, 400]);
});

test('failure stops new items and drains active work before a retry can start', async () => {
  const gate = createExportGate();
  const pending = deferred();
  const started = [];
  const run = gate.run(() => mapExportItems([0, 1, 2, 3, 4, 5], async (id) => {
    started.push(id);
    if (id === 0) throw new Error('HTTP 503');
    await pending.promise;
    return id;
  }));
  const rejected = assert.rejects(run, /HTTP 503/);
  await delay(0);
  assert.deepEqual(started, [0, 1, 2]);
  assert.equal(gate.isBusy(), true);
  let retried = false;
  await gate.run(() => { retried = true; });
  assert.equal(retried, false);
  pending.resolve();
  await rejected;
  assert.equal(gate.isBusy(), false);
  assert.deepEqual(started, [0, 1, 2]);
  await gate.run(() => { retried = true; });
  assert.equal(retried, true);
});

test('empty exports, custom concurrency, and invalid limits', async () => {
  assert.deepEqual(await mapExportItems([], () => assert.fail('unexpected request')), []);
  assert.deepEqual(await mapExportItems([1, 2], async (x) => x, { concurrency: 1 }), [1, 2]);
  await assert.rejects(mapExportItems([1], () => 1, { concurrency: 0 }), /concurrency/);
});

test('HTTP failures, login HTML, and error objects cannot become export rows', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch');
  fetch.mock.mockImplementation(async () => new Response('{"error":"busy"}', { status: 503 }));
  await assert.rejects(fetchExportArray('/findings'), /HTTP 503/);
  fetch.mock.mockImplementation(async () => new Response('<html>Sign in</html>'));
  await assert.rejects(fetchExportArray('/findings'), SyntaxError);
  fetch.mock.mockImplementation(async () => new Response('{"error":"not an array"}'));
  await assert.rejects(fetchExportArray('/findings'), /unexpected export data/);
  fetch.mock.mockImplementation(async () => new Response('[{"ncId":1}]'));
  assert.deepEqual(await fetchExportArray('/findings'), [{ ncId: 1 }]);
});
