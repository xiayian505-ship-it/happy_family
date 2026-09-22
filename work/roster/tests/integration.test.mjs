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

test('complete rule check remains wired', async () => {
  const roster = await readFile(new URL('sbs_roster.js', root), 'utf8');
  assert.match(roster, /ruleCheckButton\.addEventListener\('click', startRuleCheck\)/);
  assert.match(roster, /ShiftRosterRules\.collectIssuesByKind\(buildRuleModel\(\), kind\)/);
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
