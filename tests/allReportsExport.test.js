import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import * as XLSX from 'xlsx';
import { createExportGate, mapExportItems, fetchExportArray } from '../src/exportTasks.js';

// Execute the page's actual export handler with synthetic data and in-memory
// downloads, without mounting the app or connecting to corporate services.
const source = readFileSync(new URL('../src/AllReports.jsx', import.meta.url), 'utf8');
const handler = source.slice(source.indexOf('  const handleExport ='), source.indexOf('\n  if (loading)'));
const stageHelper = source.match(/  const getStageValue = .*?\n  \};/s)[0];
const makeExport = (context) => new Function(...Object.keys(context), `${stageHelper}\n${handler}\nreturn handleExport;`)(...Object.values(context));

function setup(t, audits, { fail = false } = {}) {
  let active = 0;
  let peak = 0;
  const calls = [];
  const rosterChunks = [];
  const workbooks = [];
  const progress = [];
  const gate = createExportGate();
  t.mock.method(globalThis, 'fetch', async (url) => {
    active++;
    peak = Math.max(peak, active);
    calls.push(url);
    await delay(Number(url.split('/').at(-1)) % 3);
    active--;
    if (fail) return new Response('{"error":"busy"}', { status: 503 });
    const id = Number(url.split('/').at(-1));
    const data = url.includes('nonconformances')
      ? ['PEQ', 'ETQ', 12].flatMap((type) => [1, 2].map((responseNumber) => ({
        ncId: id * 10 + responseNumber, questionId: id, responseNumber, type,
        findingType: 1, severity: 1, question: `Question ${id}`, response: `Response ${responseNumber}`
      })))
      : [{ car: `CAR-${id}`, reviewer: `person-${id}`, effective: 0 }];
    return new Response(JSON.stringify(data));
  });
  const context = {
    sortedFilteredAudits: audits,
    runExport: (task) => gate.run(() => task((message) => progress.push(message))),
    mapExportItems, fetchExportArray,
    buildApiUrl: (path) => `/api/${path}`,
    getRosterByIds: async (ids) => {
      rosterChunks.push(ids);
      return ids.map((myId) => ({ myId, name: `Name ${myId}` }));
    },
    normalizeIdArray: (value) => Array.isArray(value) ? value : value == null ? [] : [value],
    formatRosterLabel: (row) => row.name,
    formatSingle: (id) => id || '', formatArray: (ids = []) => ids.join(', '),
    formatSiteArray: (ids = []) => ids.join(', '), formatDateForInput: (date) => date || '',
    getStageLabel: (audit) => String(audit.stage), formatNcIdentifier: (id) => `NCID - ${id}`,
    getFindingTypeLabel: String, getSeverityLabel: String, getStandardTypeLabel: String,
    getPreviousCarsEffectiveLabel: String,
    errorToast: (message) => { throw new Error(message); },
    XLSX: {
      ...XLSX,
      writeFile: (workbook) => {
        // Round-trip the generated file so invalid workbook data also fails.
        const bytes = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        workbooks.push(XLSX.read(bytes, { type: 'buffer' }));
      }
    }
  };
  for (const name of ['sectors', 'divisions', 'programs', 'businessUnits', 'operatingUnits', 'auditTypes', 'auditors', 'intExt', 'standards', 'functions', 'safetyEquipment', 'trainingRequirements', 'causes']) {
    context[`${name}List`] = [];
  }
  return { run: makeExport(context), calls, rosterChunks, workbooks, progress, peak: () => peak };
}

test('400-audit export preserves sheets, findings and names while suppressing repeated clicks', async (t) => {
  const audits = Array.from({ length: 400 }, (_, index) => ({
    scheduleId: index + 1, title: `Audit ${index + 1}`,
    stage: index % 2 ? -2 : 4, stageBeforeInactive: 4,
    famaIds: [`person-${index + 1}`], intervieweeIds: [`person-${index + 1}`]
  }));
  const run = setup(t, audits);
  await Promise.all(Array.from({ length: 20 }, () => run.run()));
  assert.equal(run.peak(), 3);
  assert.equal(run.calls.length, 800);
  assert.deepEqual(run.rosterChunks.map((chunk) => chunk.length), [100, 100, 100, 100]);
  assert.equal(run.workbooks.length, 1);
  const workbook = run.workbooks[0];
  assert.deepEqual(workbook.SheetNames, ['Schedule', 'Planning', 'Results', 'PEQs', 'ETQs', 'Standard Questions', 'CARs']);
  for (const name of ['Schedule', 'Planning', 'Results', 'CARs']) {
    assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets[name]).length, 400);
  }
  for (const name of ['PEQs', 'ETQs', 'Standard Questions']) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
    assert.equal(rows.length, 800);
    assert.deepEqual(rows.slice(0, 2).map((row) => row['Response #']), [1, 2]);
    assert.equal(rows.at(-1)['Schedule ID'], 400);
  }
  assert.equal(XLSX.utils.sheet_to_json(workbook.Sheets.Planning)[0]['Functional Area Managers/Auditees'], 'Name person-1');
  assert.ok(run.progress.includes('Loading audits 400 of 400…'));
});

test('fetch only data used by each stage, including cancelled prior-stage audits', async (t) => {
  const run = setup(t, [
    { scheduleId: 1, stage: 1 }, { scheduleId: 2, stage: 2 },
    { scheduleId: 3, stage: 3 }, { scheduleId: 4, stage: -2, stageBeforeInactive: 4 }
  ]);
  await run.run();
  assert.deepEqual(run.calls.sort(), ['/api/nonconformances/3', '/api/nonconformances/4', '/api/cars/4'].sort());
  assert.equal(XLSX.utils.sheet_to_json(run.workbooks[0].Sheets.Schedule).length, 4);
});

test('a failed request prevents a partial workbook download', async (t) => {
  const run = setup(t, Array.from({ length: 100 }, (_, i) => ({ scheduleId: i + 1, stage: 4 })), { fail: true });
  await assert.rejects(run.run(), /HTTP 503/);
  assert.equal(run.workbooks.length, 0);
  assert.equal(run.calls.length, 3);
});
