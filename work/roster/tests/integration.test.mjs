import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function loadBrowserScript(name, extras = {}) {
  const source = await readFile(new URL(name, root), 'utf8');
  const window = extras.window || {};
  const context = vm.createContext({ window, URL, Error, Object, Boolean, Number, String, Array, Map, Set, JSON, ...extras });
  vm.runInContext(source, context, { filename: name });
  return { context, window };
}

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  };
}

test('backend adapter uses frozen envelopes and session header', async () => {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return jsonResponse(200, { ok: true, revision: 3, published: true });
  };
  const { window } = await loadBrowserScript('sbs_roster_backend.js', { fetch });
  await window.ShiftRosterBackend.saveMonth('raw-token', '2026-09', { month: '2026-09' }, 2, true);
  assert.equal(calls[0].options.headers['x-roster-session'], 'raw-token');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    snapshot: { month: '2026-09' },
    expected_revision: 2,
    publish: true
  });
  await window.ShiftRosterBackend.saveSettings('raw-token', { publicLeaveCount: 8 });
  assert.deepEqual(JSON.parse(calls[1].options.body), { data: { publicLeaveCount: 8 } });
  await window.ShiftRosterBackend.replaceAll('raw-token', { schemaVersion: 3 });
  assert.deepEqual(JSON.parse(calls[2].options.body), { payload: { schemaVersion: 3 } });
});

test('backend adapter preserves 409 contract details without retrying', async () => {
  let count = 0;
  const fetch = async () => {
    count += 1;
    return jsonResponse(409, {
      ok: false,
      error: { code: 'revision_conflict', message: 'Month has a newer revision.', current_revision: 3 }
    });
  };
  const { window } = await loadBrowserScript('sbs_roster_backend.js', { fetch });
  await assert.rejects(
    window.ShiftRosterBackend.saveMonth('token', '2026-09', { month: '2026-09' }, 2, false),
    (error) => error.status === 409 && error.code === 'revision_conflict' && error.response.error.current_revision === 3
  );
  assert.equal(count, 1);
});

test('month save errors expose only safe request diagnostics', async () => {
  const fetch = async () => jsonResponse(500, {
    ok: false,
    error: { code: 'server_error', message: 'Roster backend error.' }
  });
  const { window } = await loadBrowserScript('sbs_roster_backend.js', { fetch });
  await assert.rejects(
    window.ShiftRosterBackend.saveMonth('secret-session', '2026-10', { month: '2026-10', people: { A: { displayName: 'private' } } }, 0, false),
    (error) => {
      assert.equal(error.status, 500);
      assert.equal(error.code, 'server_error');
      assert.deepEqual(JSON.parse(JSON.stringify(error.diagnostic)), {
        endpoint: 'https://kscbrnmhqugcwfohczve.supabase.co/functions/v1/roster-admin/months/2026-10',
        method: 'PUT',
        monthId: '2026-10',
        expectedRevision: 0,
        publish: false,
        snapshotMonth: '2026-10',
        status: 500
      });
      assert.doesNotMatch(JSON.stringify(error.diagnostic), /secret-session|private/);
      return true;
    }
  );
});

test('request serialization failures are identified before fetch', async () => {
  let called = false;
  const fetch = async () => {
    called = true;
    return jsonResponse(200, { ok: true });
  };
  const { window } = await loadBrowserScript('sbs_roster_backend.js', { fetch });
  const snapshot = { month: '2026-10' };
  snapshot.circular = snapshot;
  await assert.rejects(
    window.ShiftRosterBackend.saveMonth('secret-session', '2026-10', snapshot, 0, false),
    (error) => error.code === 'serialization_error' && error.diagnostic.monthId === '2026-10'
  );
  assert.equal(called, false);
});

test('public adapter selects only the sanitized projection', async () => {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return jsonResponse(200, [{
      month_id: '2026-09',
      display_month: '2026-09',
      people: { A: { displayName: 'A' } },
      roster_values: { '1-shift-0': 'A' },
      revision: 2,
      published_at: '2026-09-01T00:00:00Z'
    }]);
  };
  const { window } = await loadBrowserScript('sbs_roster_public.js', { fetch });
  const row = await window.ShiftRosterPublic.getMonth('2026-09');
  assert.deepEqual(Object.keys(row).sort(), ['displayMonth', 'monthId', 'people', 'publishedAt', 'revision', 'rosterValues'].sort());
  const decodedUrl = decodeURIComponent(calls[0].url);
  assert.match(decodedUrl, /select=month_id,display_month,people,roster_values,revision,published_at/);
  assert.doesNotMatch(decodedUrl, /bootstrap|employees|settings|snapshot/);
});

test('frontend sources keep credentials and remote metadata out of v3 snapshots', async () => {
  const backend = await readFile(new URL('sbs_roster_backend.js', root), 'utf8');
  const integration = await readFile(new URL('sbs_roster_integration.js', root), 'utf8');
  const roster = await readFile(new URL('sbs_roster.js', root), 'utf8');
  assert.doesNotMatch(`${backend}\n${integration}`, /service[_-]?role|password pepper|bcrypt hash/i);
  const snapshotBody = roster.slice(roster.indexOf('function buildCurrentMonthSnapshot'), roster.indexOf('function persistCurrentMonth'));
  assert.doesNotMatch(snapshotBody, /revision|published|session/i);
  assert.match(integration, /sessionStorage\.setItem\(SESSION_KEY/);
  assert.doesNotMatch(integration, /localStorage\.setItem\([^)]*SESSION/i);
});

test('public mode removes private control surfaces instead of relying on CSS', async () => {
  const integration = await readFile(new URL('sbs_roster_integration.js', root), 'utf8');
  for (const selector of ['.management-menu', '.roster-secondary-row', 'settingsViewTab', 'rulesViewTab', 'settingsView', 'rulesView']) {
    assert.match(integration, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(integration, /\.remove\(\)/);
});

test('public roster is hydrated for viewing while mutation interactions are blocked', async () => {
  const integration = await readFile(new URL('sbs_roster_integration.js', root), 'utf8');
  const roster = await readFile(new URL('sbs_roster.js', root), 'utf8');

  const publicInitializer = integration.slice(integration.indexOf('async function loadPublicMonth'), integration.indexOf('function makeRemoteBackup'));
  assert.match(publicInitializer, /ShiftRosterPublic\.getMonth\(monthId\)/);
  assert.match(publicInitializer, /ShiftRosterApp\.loadSnapshot\(year, month, emptyPublicSnapshot\(monthId, row\)\)/);
  assert.match(publicInitializer, /ShiftRosterApp\.initialize\(\{[\s\S]*?mode: 'public',[\s\S]*?snapshot:/);

  assert.match(roster, /rosterReadOnly = mode === 'public'/);
  assert.match(roster, /const rosterMutationEvents = \[[^\]]*'beforeinput'[^\]]*'click'[^\]]*'dblclick'[^\]]*'contextmenu'[^\]]*'keydown'[^\]]*\]/);
  assert.match(roster, /table\?\.addEventListener\(eventName, blockReadOnlyRosterMutation, true\)/);
  assert.match(roster, /function blockReadOnlyRosterMutation\(event\) \{\s*if \(!rosterReadOnly\) return;\s*event\.preventDefault\(\);\s*event\.stopImmediatePropagation\(\);/);
  assert.match(roster, /for \(const table of \[scheduleTable, lowerTable\]\) \{\s*table\?\.querySelectorAll\('input, button, \[contenteditable="true"\]'\)/);
});

test('editor and standalone roster mutation interactions remain enabled', async () => {
  const roster = await readFile(new URL('sbs_roster.js', root), 'utf8');
  assert.match(roster, /if \(!rosterReadOnly\) return;/);
  assert.match(roster, /rosterReadOnly = mode === 'public'/);
  assert.doesNotMatch(roster, /rosterReadOnly = mode === 'editor'/);
  assert.match(roster, /ShiftRosterApp\.initialize\(\{ mode: 'standalone' \}\)/);
});

test('mode navigation is native and does not depend on DOMContentLoaded handlers', async () => {
  const html = await readFile(new URL('sbs_roster.html', root), 'utf8');
  const integration = await readFile(new URL('sbs_roster_integration.js', root), 'utf8');
  assert.match(html, /<a data-roster-mode="standalone" href="sbs_roster\.html">/);
  assert.match(html, /<a data-roster-mode="public" href="\?mode=public">/);
  assert.match(html, /<a data-roster-mode="editor" href="\?mode=editor">/);
  assert.doesNotMatch(integration, /location\.assign/);
  assert.doesNotMatch(integration, /\[data-roster-mode\][\s\S]{0,250}addEventListener\('click'/);
});

test('standalone keeps legacy initialization and month navigation ownership', async () => {
  const roster = await readFile(new URL('sbs_roster.js', root), 'utf8');
  const integration = await readFile(new URL('sbs_roster_integration.js', root), 'utf8');
  assert.match(roster, /getMode\?\.\(\) !== 'standalone'/);
  assert.match(roster, /!window\.ShiftRosterIntegration \|\| window\.ShiftRosterIntegration\.getMode\?\.\(\) === 'standalone'/);
  const standaloneBranch = integration.slice(integration.indexOf("else if (mode === 'editor')"), integration.indexOf('window.ShiftRosterIntegration ='));
  assert.doesNotMatch(standaloneBranch, /ShiftRosterApp\.initialize|ShiftRosterApp\.saveCurrentMonth/);
});

test('editor bootstrap defaults to next month instead of the latest remote month', async () => {
  const integration = await readFile(new URL('sbs_roster_integration.js', root), 'utf8');
  const helperSource = integration.match(/function getDefaultNextMonthId\(date = new Date\(\)\) \{[\s\S]*?\n  \}/)?.[0];
  assert.ok(helperSource, 'next-month helper must exist');
  const getDefaultNextMonthId = vm.runInNewContext(`(() => { ${helperSource}; return getDefaultNextMonthId; })()`, { Date, String });

  const remoteMonths = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02'];
  assert.equal(getDefaultNextMonthId(new Date(2026, 8, 15)), '2026-10');
  assert.notEqual(getDefaultNextMonthId(new Date(2026, 8, 15)), remoteMonths.at(-1));
  assert.equal(getDefaultNextMonthId(new Date(2026, 11, 15)), '2027-01');

  const applyBootstrap = integration.slice(integration.indexOf('function applyBootstrap'), integration.indexOf('async function bootstrapEditor'));
  assert.match(applyBootstrap, /const initialId = getDefaultNextMonthId\(\)/);
  assert.doesNotMatch(applyBootstrap, /revisions\.keys\(\)|sort\(\)\.reverse\(\)/);
  assert.match(applyBootstrap, /currentPublished = revisions\.get\(initialId\)\?\.published === true/);
  assert.match(applyBootstrap, /revisions\.get\(initialId\)\?\.revision \|\| 0/);

  const remoteMonthsWithoutNext = ['2026-09', '2026-11', '2027-02'];
  assert.equal(getDefaultNextMonthId(new Date(2026, 8, 15)), '2026-10');
  assert.equal(remoteMonthsWithoutNext.includes('2026-10'), false);
});

test('complete rule check remains wired', async () => {
  const roster = await readFile(new URL('sbs_roster.js', root), 'utf8');
  assert.match(roster, /ruleCheckButton\.addEventListener\('click', startRuleCheck\)/);
  assert.match(roster, /ShiftRosterRules\.collectIssuesByKind\(buildRuleModel\(\), kind\)/);
});

test('standalone print pre-opens a window then reuses the PNG rendering source', async () => {
  const roster = await readFile(new URL('sbs_roster.js', root), 'utf8');
  const exporter = await readFile(new URL('sbs_roster_export.js', root), 'utf8');
  assert.match(roster, /printButton\.addEventListener\('click', \(\) => \{\s*requestOutputTimeAction\(printWithOutputTimestamp\);\s*\}\);/);
  const printFlow = roster.slice(
    roster.indexOf('function printWithOutputTimestamp'),
    roster.indexOf('function setSpecialDatesMode')
  );
  assert.ok(printFlow.indexOf('openPrintWindow') < printFlow.indexOf('await window.ShiftRosterExport.createPngBlob'));
  assert.match(printFlow, /await window\.ShiftRosterExport\.printBlob\(blob, printWindow\)/);
  assert.doesNotMatch(printFlow, /window\.print\(\)/);
  assert.match(exporter, /async function createPngBlob\(\) \{\s*const canvas = await drawRosterToCanvas\(\);/);
  assert.match(exporter, /image\.addEventListener\('load', startPrint/);
  assert.match(exporter, /reader\.readAsDataURL\(blob\)/);
  assert.match(exporter, /const dataUrl = await blobToDataUrl\(blob\)/);
  assert.doesNotMatch(exporter, /printWindow\.addEventListener\('pagehide'/);
  assert.match(exporter, /printWindow\.addEventListener\('afterprint', \(\) => finishLater\(\)/);
  assert.match(exporter, /finishLater\(600000\)/);
  assert.match(exporter, /const finishLater = \(delay = 120000\)/);
  const printBlobFlow = exporter.slice(exporter.indexOf('async function printBlob'), exporter.indexOf('let currentPreviewUrl'));
  assert.doesNotMatch(printBlobFlow, /createObjectURL|revokeObjectURL/);
  assert.match(exporter, /max-height: 198mm/);
  assert.match(exporter, /if \(currentPreviewBlob\) downloadBlob\(currentPreviewBlob\)/);
});

test('remote working store never overwrites standalone localStorage', async () => {
  const values = new Map();
  const localStorage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const window = { localStorage, crypto: { randomUUID: () => '00000000-0000-0000-0000-000000000001' } };
  await loadBrowserScript('sbs_roster_storage.js', { window, Date, Math });
  window.ShiftRosterStorage.saveSettings({ publicLeaveCount: 9 });
  window.ShiftRosterStorage.setMode('editor');
  window.ShiftRosterStorage.hydrateRemote({
    format: 'elitehotel-shift-roster-v3',
    schemaVersion: 3,
    settings: {
      publicLeaveCount: 7,
      maxConsecutiveWorkDays: 6,
      minTurnaroundHours: 12,
      normalNightRange: '22~06'
    },
    employees: {},
    months: {},
    specialDays: {}
  });
  assert.equal(window.ShiftRosterStorage.getSettings().publicLeaveCount, 7);
  window.ShiftRosterStorage.setMode('standalone');
  assert.equal(window.ShiftRosterStorage.getSettings().publicLeaveCount, 9);
});
