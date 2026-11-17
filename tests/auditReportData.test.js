import assert from 'node:assert/strict';
import test from 'node:test';
import {
    loadReportAudits, loadReportPage, loadReportRiskRatings,
    requestReportJson, REPORT_REFERENCE_KEYS
} from '../src/assets/data/auditReportData.js';

const summary = (scheduleId, stage = 4) => ({ scheduleId, stage, title: `Audit ${scheduleId}` });
const detail = (scheduleId, stage = 4) => ({
    ...summary(scheduleId, stage), siteIds: [], businessUnitIds: [],
    operatingUnitIds: [], programIds: [], additionalAuditorIds: [],
    expectedStartDate: '2026-09-01'
});
const references = Object.fromEntries(REPORT_REFERENCE_KEYS.map((key) => [key, []]));
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
function mockServer(t, overrides = {}) {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        calls.push({ url, options });
        if (url in overrides) return overrides[url](options);
        if (url === '/api/report-audits') return json([summary(7), summary(8, -2), summary(9, -3)]);
        if (url === '/api/audits/7?report=true') return json(detail(7));
        if (url === '/api/reference-data?profile=audit') return json(references);
        if (url === '/api/current-user') return json({ myId: 'test-user', auditorId: 1 });
        throw new Error(`Unexpected request: ${url}`);
    });
    return calls;
}
const pendingUntilAborted = ({ signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
});

test('default report excludes cancelled/archived audits before selecting and hydrating the newest eligible record', async (t) => {
    const calls = mockServer(t);
    const audits = await loadReportAudits();
    assert.deepEqual(audits, [detail(7)]);
    assert.deepEqual(calls.map(({ url }) => url), ['/api/report-audits', '/api/audits/7?report=true']);
});

test('explicit route ID is authoritative even if the browser URL changes during a request', async (t) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hash: '#/audit/99' } } });
    t.after(() => {
        if (previous) Object.defineProperty(globalThis, 'window', previous);
        else delete globalThis.window;
    });
    const calls = mockServer(t, {
        '/api/report-audits': () => json([summary(6), summary(7)]),
        '/api/audits/6?report=true': () => json(detail(6))
    });
    const audits = await loadReportAudits('6');
    assert.deepEqual(audits.find((audit) => audit.scheduleId === 6), detail(6));
    assert.ok(calls.some(({ url }) => url === '/api/audits/6?report=true'));
    assert.ok(!calls.some(({ url }) => url.includes('/99')));
});

test('failed details reject visibly; retry fetches full details instead of reusing a failed summary', async (t) => {
    let attempts = 0;
    mockServer(t, {
        '/api/audits/7?report=true': () => ++attempts === 1 ? json({ error: 'busy' }, 503) : json(detail(7))
    });
    await assert.rejects(loadReportAudits(), /audit details.*503/);
    assert.deepEqual(await loadReportAudits(), [detail(7)]);
    assert.equal(attempts, 2);
});

test('malformed, mismatched, or incomplete detail responses never reach the report renderer', async (t) => {
    const invalid = [[], {}, summary(7), detail(6), detail(7, -2), { ...detail(7), siteIds: null }];
    const calls = mockServer(t, { '/api/audits/7?report=true': () => json(invalid.shift()) });
    for (let i = 0; i < 6; i++) await assert.rejects(loadReportAudits());
    assert.equal(calls.length, 12);
});

test('legitimate empty lists remain empty, while explicit missing/cancelled IDs fail', async (t) => {
    mockServer(t, { '/api/report-audits': () => json([summary(8, -2), summary(9, -3)]) });
    assert.deepEqual(await loadReportAudits(), []);
    await assert.rejects(loadReportAudits(8), /unavailable/);
    await assert.rejects(loadReportAudits(999), /unavailable/);
});

test('authorization failures do not fall back to summaries or another audit', async (t) => {
    const calls = mockServer(t, { '/api/audits/7?report=true': () => json({ error: 'denied' }, 403) });
    await assert.rejects(loadReportAudits(7), /permission/);
    assert.equal(calls.length, 2);
});

test('main report completes without requesting/waiting for risk ratings', async (t) => {
    const calls = mockServer(t);
    const page = await loadReportPage();
    assert.deepEqual(page.audits, [detail(7)]);
    assert.deepEqual(page.references, references);
    assert.equal(page.user.myId, 'test-user');
    assert.equal(calls.length, 4);
    assert.ok(calls.every(({ url }) => !url.includes('risk-ratings')));
});

test('missing lookup data or failed identity loads show errors instead of an empty report', async (t) => {
    const fetch = t.mock.method(globalThis, 'fetch');
    fetch.mock.mockImplementation(async (url) => {
        if (url === '/api/report-audits') return json([]);
        if (url === '/api/current-user') return json({ myId: null });
        return json({});
    });
    await assert.rejects(loadReportPage(), /reference data/);
    fetch.mock.mockImplementation(async (url) => {
        if (url === '/api/report-audits') return json([]);
        if (url === '/api/current-user') return json({}, 500);
        return json(references);
    });
    await assert.rejects(loadReportPage(), /user information.*500/);
});

test('risk ratings are requested for exactly the supplied audit year', async (t) => {
    const calls = mockServer(t, { '/api/risk-ratings?year=2026': () => json([{ year: 2026 }]) });
    assert.deepEqual(await loadReportRiskRatings(2026), [{ year: 2026 }]);
    assert.deepEqual(calls.map(({ url }) => url), ['/api/risk-ratings?year=2026']);
    await assert.rejects(loadReportRiskRatings(undefined), /audit year/);
});

test('slow requests and slow JSON bodies time out with a retryable message', async (t) => {
    const fetch = t.mock.method(globalThis, 'fetch', pendingFetch);
    function pendingFetch(url, options) { return pendingUntilAborted(options); }
    await assert.rejects(requestReportJson('report-audits', { timeoutMs: 5, label: 'the audit list' }), /audit list timed out/);
    fetch.mock.mockImplementation(async (url, options) => ({ ok: true, json: () => pendingUntilAborted(options) }));
    await assert.rejects(requestReportJson('report-audits', { timeoutMs: 5 }), /timed out/);
});

test('navigation cancellation aborts outstanding requests and does not issue detail requests afterward', async (t) => {
    const calls = mockServer(t, { '/api/report-audits': pendingUntilAborted });
    const controller = new AbortController();
    const loading = loadReportPage(null, { signal: controller.signal });
    controller.abort();
    await assert.rejects(loading, { name: 'AbortError' });
    assert.ok(calls.every(({ options }) => options.signal.aborted));
    assert.ok(!calls.some(({ url }) => url.startsWith('/api/audits/')));
});

test('HTML login responses and error objects are reported as failures', async (t) => {
    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('<html>Sign in</html>'));
    await assert.rejects(requestReportJson('report-audits'), /invalid/);
    fetch.mock.mockImplementation(async () => json({ success: false, error: 'failed' }));
    await assert.rejects(requestReportJson('report-audits'), /Unable to load/);
});
