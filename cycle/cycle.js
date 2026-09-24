(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CycleCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = "slowly-cycle:v1";
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const FLOWS = ["", "少量", "中等", "大量"];
  const PAINS = ["", "無", "輕微", "中等", "嚴重"];

  function todayISO(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }
  function isDate(value) {
    if (!ISO_DATE.test(value || "")) return false;
    const [y, m, d] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(y, m - 1, d));
    return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
  }
  function dayNumber(value) {
    const [y, m, d] = value.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  }
  function addDays(value, amount) {
    const date = new Date((dayNumber(value) + amount) * 86400000);
    return date.toISOString().slice(0, 10);
  }
  function makeId() {
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }
  function emptyData() {
    return { schemaVersion: SCHEMA_VERSION, periods: [], daily: {}, settings: { manualCycleLength: null }, updatedAt: new Date().toISOString() };
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function validate(data) {
    const errors = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, errors: ["備份必須是 JSON 物件。"] };
    if (data.schemaVersion !== SCHEMA_VERSION) errors.push("不支援的備份版本。");
    if (!Array.isArray(data.periods)) errors.push("periods 必須是陣列。");
    if (!data.daily || typeof data.daily !== "object" || Array.isArray(data.daily)) errors.push("daily 必須是物件。");
    if (!data.settings || typeof data.settings !== "object") errors.push("settings 必須是物件。");
    const periods = Array.isArray(data.periods) ? data.periods : [];
    const ids = new Set();
    periods.forEach((p, i) => {
      if (!p || typeof p.id !== "string" || !p.id) errors.push(`第 ${i + 1} 筆月經紀錄缺少 id。`);
      else if (ids.has(p.id)) errors.push("月經紀錄 id 不可重複。"); else ids.add(p.id);
      if (!isDate(p && p.start)) errors.push(`第 ${i + 1} 筆開始日期不合法。`);
      if (p && p.end !== null && p.end !== undefined && !isDate(p.end)) errors.push(`第 ${i + 1} 筆結束日期不合法。`);
      if (p && p.end && isDate(p.start) && dayNumber(p.end) < dayNumber(p.start)) errors.push(`第 ${i + 1} 筆結束日期早於開始日期。`);
    });
    const sorted = periods.filter(p => isDate(p.start) && (!p.end || isDate(p.end))).slice().sort((a, b) => a.start.localeCompare(b.start));
    let occupiedUntil = null;
    for (const period of sorted) {
      if (occupiedUntil === Infinity || (occupiedUntil !== null && dayNumber(period.start) <= occupiedUntil)) errors.push("月經紀錄不可重複或重疊；請先結束進行中的紀錄。");
      occupiedUntil = period.end ? Math.max(occupiedUntil ?? -Infinity, dayNumber(period.end)) : Infinity;
    }
    const daily = data.daily && typeof data.daily === "object" ? data.daily : {};
    Object.entries(daily).forEach(([date, entry]) => {
      if (!isDate(date)) errors.push(`每日紀錄日期不合法：${date}`);
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) errors.push(`每日紀錄格式不合法：${date}`);
      else {
        if (!FLOWS.includes(entry.flow || "")) errors.push(`經血量選項不合法：${date}`);
        if (!PAINS.includes(entry.pain || "")) errors.push(`疼痛程度選項不合法：${date}`);
        if (typeof (entry.note || "") !== "string" || (entry.note || "").length > 1000) errors.push(`備註格式不合法：${date}`);
      }
    });
    const manual = data.settings && data.settings.manualCycleLength;
    if (manual !== null && manual !== undefined && (!Number.isInteger(manual) || manual < 15 || manual > 90)) errors.push("手動週期長度須為 15–90 天整數。");
    return { ok: errors.length === 0, errors };
  }
  function normalized(data) {
    const result = clone(data);
    result.periods = result.periods.map(p => ({ id: p.id, start: p.start, end: p.end || null })).sort((a, b) => a.start.localeCompare(b.start));
    Object.keys(result.daily).forEach(date => {
      const item = result.daily[date];
      result.daily[date] = { flow: item.flow || "", pain: item.pain || "", note: (item.note || "").trim() };
      if (!result.daily[date].flow && !result.daily[date].pain && !result.daily[date].note) delete result.daily[date];
    });
    result.settings = { manualCycleLength: result.settings.manualCycleLength ?? null };
    result.updatedAt = new Date().toISOString();
    return result;
  }
  function upsertPeriod(data, period) {
    const next = clone(data);
    const item = { id: period.id || makeId(), start: period.start, end: period.end || null };
    const index = next.periods.findIndex(p => p.id === item.id);
    if (index >= 0) next.periods[index] = item; else next.periods.push(item);
    const checked = validate(next);
    if (!checked.ok) throw new Error(checked.errors.join("\n"));
    return normalized(next);
  }
  function removePeriod(data, id) {
    const next = clone(data); next.periods = next.periods.filter(p => p.id !== id); return normalized(next);
  }
  function saveDaily(data, date, entry) {
    if (!isDate(date)) throw new Error("日期不合法。");
    const next = clone(data);
    const item = { flow: entry.flow || "", pain: entry.pain || "", note: (entry.note || "").trim() };
    if (!FLOWS.includes(item.flow) || !PAINS.includes(item.pain) || item.note.length > 1000) throw new Error("身體紀錄格式不合法。");
    if (item.flow || item.pain || item.note) next.daily[date] = item; else delete next.daily[date];
    return normalized(next);
  }
  function cycleStats(data) {
    const starts = data.periods.map(p => p.start).filter(isDate).sort();
    const intervals = starts.slice(1).map((date, i) => dayNumber(date) - dayNumber(starts[i])).filter(n => n >= 15 && n <= 90);
    const average = intervals.length ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : null;
    const spread = intervals.length > 1 ? Math.max(...intervals) - Math.min(...intervals) : null;
    const chosen = data.settings.manualCycleLength || average;
    const latest = starts.at(-1);
    const nextPeriod = latest && chosen ? addDays(latest, chosen) : null;
    const ovulation = nextPeriod ? addDays(nextPeriod, -14) : null;
    return { intervals, average, chosen, source: data.settings.manualCycleLength ? "manual" : "average", nextPeriod, ovulation, fertileStart: ovulation ? addDays(ovulation, -5) : null, fertileEnd: ovulation ? addDays(ovulation, 1) : null, irregular: spread !== null && spread > 7, insufficient: intervals.length < 2 };
  }
  class LocalStorageAdapter {
    constructor(storage, key = STORAGE_KEY) { this.storage = storage; this.key = key; }
    async load() {
      const raw = this.storage.getItem(this.key);
      if (!raw) return emptyData();
      const parsed = JSON.parse(raw); const checked = validate(parsed);
      if (!checked.ok) throw new Error("本機資料無法讀取：" + checked.errors.join(" "));
      return normalized(parsed);
    }
    async save(data) {
      const checked = validate(data); if (!checked.ok) throw new Error(checked.errors.join("\n"));
      const next = normalized(data); this.storage.setItem(this.key, JSON.stringify(next)); return next;
    }
  }
  function parseBackup(text) {
    let parsed; try { parsed = JSON.parse(text); } catch (_) { throw new Error("不是有效的 JSON 檔案。"); }
    const checked = validate(parsed); if (!checked.ok) throw new Error(checked.errors.join("\n"));
    return normalized(parsed);
  }
  function exportBackup(data) { return JSON.stringify(normalized(data), null, 2); }
  return { SCHEMA_VERSION, STORAGE_KEY, FLOWS, PAINS, todayISO, isDate, addDays, dayNumber, emptyData, validate, normalized, upsertPeriod, removePeriod, saveDaily, cycleStats, LocalStorageAdapter, parseBackup, exportBackup };
});
