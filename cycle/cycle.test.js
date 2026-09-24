"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("./cycle.js");

function period(data, start, end = null, id = start) { return C.upsertPeriod(data, { id, start, end }); }

test("empty first launch has no records or prediction", () => {
  const data = C.emptyData();
  assert.equal(C.validate(data).ok, true);
  assert.equal(C.cycleStats(data).nextPeriod, null);
});

test("open period can later receive an end, including leap and cross-month dates", () => {
  let data = period(C.emptyData(), "2024-02-29", null, "leap");
  data = C.upsertPeriod(data, { id: "leap", start: "2024-02-29", end: "2024-03-03" });
  assert.equal(data.periods[0].end, "2024-03-03");
  data = period(data, "2024-12-30", "2025-01-02", "year");
  assert.equal(data.periods.length, 2);
});

test("rejects invalid, reversed, duplicate, overlapping, and following an open period", () => {
  assert.throws(() => period(C.emptyData(), "2023-02-29"), /不合法/);
  assert.throws(() => period(C.emptyData(), "2025-03-05", "2025-03-01"), /早於/);
  let data = period(C.emptyData(), "2025-01-01", "2025-01-05", "a");
  assert.throws(() => period(data, "2025-01-05", "2025-01-07", "b"), /重複或重疊/);
  data = period(C.emptyData(), "2025-02-01", null, "open");
  assert.throws(() => period(data, "2025-03-01", null, "later"), /進行中/);
});

test("editing and deleting periods preserves unrelated daily entries", () => {
  let data = C.saveDaily(C.emptyData(), "2025-01-02", { flow: "少量", pain: "輕微", note: "test" });
  data = period(data, "2025-01-01", "2025-01-03", "a");
  data = C.upsertPeriod(data, { id: "a", start: "2025-01-01", end: "2025-01-04" });
  data = C.removePeriod(data, "a");
  assert.deepEqual(data.daily["2025-01-02"], { flow: "少量", pain: "輕微", note: "test" });
});

test("averages start intervals and manual cycle affects prediction only", () => {
  let data = period(C.emptyData(), "2025-01-01", "2025-01-05", "a");
  data = period(data, "2025-01-30", "2025-02-03", "b");
  data = period(data, "2025-03-02", "2025-03-06", "c");
  assert.equal(C.cycleStats(data).average, 30);
  const starts = data.periods.map(p => p.start);
  data.settings.manualCycleLength = 35;
  assert.equal(C.cycleStats(data).nextPeriod, "2025-04-06");
  assert.deepEqual(data.periods.map(p => p.start), starts);
});

test("local adapter persists and invalid import is atomic", async () => {
  const memory = { value: null, getItem() { return this.value; }, setItem(k, v) { this.value = v; } };
  const adapter = new C.LocalStorageAdapter(memory);
  const saved = await adapter.save(period(C.emptyData(), "2025-06-01", "2025-06-04"));
  assert.deepEqual((await adapter.load()).periods, saved.periods);
  const before = memory.value;
  assert.throws(() => C.parseBackup('{"schemaVersion":1,"periods":[{"id":"x","start":"bad"}],"daily":{},"settings":{}}'), /不合法/);
  assert.equal(memory.value, before);
  assert.equal(C.parseBackup(C.exportBackup(saved)).periods.length, 1);
});
