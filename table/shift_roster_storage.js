(() => {
  'use strict';

  const NAMESPACE = 'elitehotel:shift_roster:v2';
  const SCHEMA_VERSION = 2;
  const FORMAT = 'elitehotel-shift-roster-v2';
  const META_KEY = `${NAMESPACE}:meta`;
  const SETTINGS_KEY = `${NAMESPACE}:settings`;
  const EMPLOYEES_KEY = `${NAMESPACE}:employees`;
  const MONTH_PREFIX = `${NAMESPACE}:month:`;

  const memoryStore = new Map();
  let persistent = true;

  function testLocalStorage() {
    const probe = `${NAMESPACE}:__probe__`;
    try {
      window.localStorage.setItem(probe, '1');
      const ok = window.localStorage.getItem(probe) === '1';
      window.localStorage.removeItem(probe);
      return ok;
    } catch (_error) {
      return false;
    }
  }

  persistent = testLocalStorage();

  function backendGet(key) {
    if (persistent) {
      try {
        return window.localStorage.getItem(key);
      } catch (_error) {
        persistent = false;
      }
    }
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  }

  function backendSet(key, value) {
    const text = String(value);
    if (persistent) {
      try {
        window.localStorage.setItem(key, text);
        return;
      } catch (_error) {
        persistent = false;
      }
    }
    memoryStore.set(key, text);
  }

  function backendRemove(key) {
    if (persistent) {
      try {
        window.localStorage.removeItem(key);
      } catch (_error) {
        persistent = false;
      }
    }
    memoryStore.delete(key);
  }

  function backendKeys() {
    if (persistent) {
      try {
        const keys = [];
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (key) keys.push(key);
        }
        return keys;
      } catch (_error) {
        persistent = false;
      }
    }
    return [...memoryStore.keys()];
  }

  function safeParse(text, fallback = null) {
    if (typeof text !== 'string' || !text.trim()) return fallback;
    try {
      return JSON.parse(text.replace(/^\uFEFF/, ''));
    } catch (_error) {
      return fallback;
    }
  }

  function readObject(key, fallback = {}) {
    const parsed = safeParse(backendGet(key), null);
    return isPlainObject(parsed) ? parsed : structuredCloneSafe(fallback);
  }

  function writeObject(key, value) {
    backendSet(key, JSON.stringify(value));
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function structuredCloneSafe(value) {
    return safeParse(JSON.stringify(value), value);
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function makeMonthId(year, month) {
    return `${Number(year)}-${pad2(Number(month))}`;
  }

  function parseMonthId(monthId) {
    const match = String(monthId || '').match(/^(\d{4})-(0[1-9]|1[0-2])$/);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]) };
  }

  function makeMonthKey(year, month) {
    return `${MONTH_PREFIX}${makeMonthId(year, month)}`;
  }

  function getPreviousYearMonth(year, month) {
    const date = new Date(Number(year), Number(month) - 2, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  }

  function getNextYearMonth(year, month) {
    const date = new Date(Number(year), Number(month), 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  }

  function emptyMonth(year, month) {
    return {
      month: makeMonthId(year, month),
      people: {},
      specialLeaveValues: ['', '', '', '', '', ''],
      rosterValues: {},
      blockedVacationOverrides: {},
      specialShiftCells: [],
      nightShiftOverrides: {},
      leaveTypeValues: {},
      leaveNoteValues: {},
      manualNotes: {},
      extraLeaves: {},
      annualGrantDecisions: {},
      specialShiftTimes: {},
      nightShiftTimes: {},
      meetingDays: [],
      meetingNoteValues: {}
    };
  }

  function clonePeople(people) {
    const result = {};
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const person = people?.[letter];
      if (!isPlainObject(person)) continue;
      const displayName = typeof person.displayName === 'string' ? person.displayName : '';
      const employeeId = typeof person.employeeId === 'string' ? person.employeeId : '';
      const shiftGroups = Array.isArray(person.shiftGroups)
        ? person.shiftGroups.filter((item) => ['early', 'middle', 'night'].includes(item))
        : [];
      const normalizedGroups = letter === 'A'
        ? (displayName || employeeId || shiftGroups.length ? ['early', 'middle', 'night'] : [])
        : [...new Set(shiftGroups)].slice(0, 1);
      if (!displayName && !employeeId && !normalizedGroups.length) continue;
      result[letter] = { employeeId, displayName, shiftGroups: normalizedGroups };
    }
    return result;
  }

  function createMonthFromPrevious(year, month) {
    const result = emptyMonth(year, month);
    const previous = getPreviousYearMonth(year, month);
    const previousMonth = getMonth(previous.year, previous.month);
    if (previousMonth) {
      result.people = clonePeople(previousMonth.people);
      return result;
    }

    // 第一次導入時若往回補前月，允許從已存在的下一月帶回人員身分與班別設定。
    const next = getNextYearMonth(year, month);
    const nextMonth = getMonth(next.year, next.month);
    if (nextMonth) result.people = clonePeople(nextMonth.people);
    return result;
  }

  function getMonth(year, month) {
    const parsed = safeParse(backendGet(makeMonthKey(year, month)), null);
    return isPlainObject(parsed) ? parsed : null;
  }

  function ensureMonth(year, month) {
    const existing = getMonth(year, month);
    if (existing) return existing;
    const created = createMonthFromPrevious(year, month);
    saveMonth(created);
    return created;
  }

  function saveMonth(monthData) {
    if (!isPlainObject(monthData) || !parseMonthId(monthData.month)) {
      throw new Error('月份資料格式不正確');
    }
    backendSet(`${MONTH_PREFIX}${monthData.month}`, JSON.stringify(monthData));
  }

  function listMonthIds() {
    return backendKeys()
      .filter((key) => key.startsWith(MONTH_PREFIX))
      .map((key) => key.slice(MONTH_PREFIX.length))
      .filter((id) => parseMonthId(id))
      .sort();
  }

  function getMeta() {
    let meta = readObject(META_KEY, {});
    if (meta.schemaVersion !== SCHEMA_VERSION) {
      meta = {
        schemaVersion: SCHEMA_VERSION,
        createdAt: meta.createdAt || new Date().toISOString()
      };
      writeObject(META_KEY, meta);
    }
    return meta;
  }

  function getSettings(defaults = {}) {
    const saved = readObject(SETTINGS_KEY, {});
    return { ...structuredCloneSafe(defaults), ...saved };
  }

  function saveSettings(settings) {
    writeObject(SETTINGS_KEY, settings || {});
  }

  function getEmployees() {
    return readObject(EMPLOYEES_KEY, {});
  }

  function saveEmployees(employees) {
    writeObject(EMPLOYEES_KEY, employees || {});
  }

  function normalizeEmployeeName(value) {
    return String(value || '').normalize('NFC').replace(/\s+/gu, '');
  }

  function makeEmployeeId() {
    if (window.crypto?.randomUUID) {
      return `emp_${window.crypto.randomUUID().replace(/-/g, '')}`;
    }
    const random = Math.random().toString(36).slice(2, 10);
    return `emp_${Date.now().toString(36)}_${random}`;
  }

  function resolveEmployee(displayName, currentEmployeeId = '') {
    const normalized = normalizeEmployeeName(displayName);
    if (!normalized) return '';

    const employees = getEmployees();
    const current = currentEmployeeId && employees[currentEmployeeId];
    if (current && normalizeEmployeeName(current.name) === normalized) {
      current.active = true;
      current.updatedAt = new Date().toISOString();
      saveEmployees(employees);
      return currentEmployeeId;
    }

    const knownId = Object.keys(employees).find((employeeId) => {
      return normalizeEmployeeName(employees[employeeId]?.name) === normalized;
    });
    if (knownId) {
      employees[knownId].active = true;
      employees[knownId].updatedAt = new Date().toISOString();
      saveEmployees(employees);
      return knownId;
    }

    const employeeId = makeEmployeeId();
    const now = new Date().toISOString();
    employees[employeeId] = {
      name: normalized,
      active: true,
      createdAt: now,
      updatedAt: now
    };
    saveEmployees(employees);
    return employeeId;
  }

  function removeMonthsBefore(cutoffMonthId) {
    if (!parseMonthId(cutoffMonthId)) throw new Error('清除截止月份格式不正確');
    const removed = [];
    for (const monthId of listMonthIds()) {
      if (monthId >= cutoffMonthId) continue;
      backendRemove(`${MONTH_PREFIX}${monthId}`);
      removed.push(monthId);
    }
    return removed;
  }

  function exportPayload() {
    const months = {};
    for (const monthId of listMonthIds()) {
      const parsed = safeParse(backendGet(`${MONTH_PREFIX}${monthId}`), null);
      if (isPlainObject(parsed)) months[monthId] = parsed;
    }
    const meta = getMeta();
    return {
      format: FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      meta,
      settings: getSettings({}),
      employees: getEmployees(),
      months
    };
  }


  function validatePerson(person, letter) {
    if (!isPlainObject(person)) return false;
    if (typeof person.employeeId !== 'string' || typeof person.displayName !== 'string') return false;
    if (!Array.isArray(person.shiftGroups)) return false;
    const groups = [...new Set(person.shiftGroups)];
    if (!groups.every((item) => ['early', 'middle', 'night'].includes(item))) return false;
    if (letter === 'A') return groups.length === 0 || groups.length === 3;
    return groups.length <= 1;
  }

  function isValidTimeRangeText(value) {
    return typeof value === 'string' && /^\d{1,2}(?::\d{2})?~\d{1,2}(?::\d{2})?$/.test(value.replace(/\s+/g, ''));
  }

  function validateMonth(monthId, data) {
    const parsedId = parseMonthId(monthId);
    if (!parsedId || !isPlainObject(data) || data.month !== monthId) return false;
    if (!isPlainObject(data.people)) return false;
    for (const [letter, person] of Object.entries(data.people)) {
      if (!/^[A-F]$/.test(letter) || !validatePerson(person, letter)) return false;
    }
    if (!Array.isArray(data.specialLeaveValues) || data.specialLeaveValues.length > 6 || !data.specialLeaveValues.every((item) => typeof item === 'string' && /^\d{0,2}$/.test(item))) return false;

    if (!isPlainObject(data.rosterValues)) return false;
    for (const [key, value] of Object.entries(data.rosterValues)) {
      if (!/^\d{1,2}-(?:shift-[0-4]|vacation-[01])$/.test(key) || !/^[A-F]?$/.test(String(value))) return false;
    }

    if (!isPlainObject(data.blockedVacationOverrides)) return false;
    for (const [key, value] of Object.entries(data.blockedVacationOverrides)) {
      if (!/^\d{1,2}$/.test(key) || typeof value !== 'boolean') return false;
    }

    if (!Array.isArray(data.specialShiftCells) || !data.specialShiftCells.every((item) => /^\d{1,2}-shift-[0-4]$/.test(String(item)))) return false;

    if (!isPlainObject(data.nightShiftOverrides)) return false;
    for (const [key, value] of Object.entries(data.nightShiftOverrides)) {
      if (!/^\d{1,2}-night-[0-4]$/.test(key) || typeof value !== 'boolean') return false;
    }

    const validLeaveTypes = new Set(['public', 'annual', 'leave', 'personal', 'bereavement', 'other', 'exceptionPublic']);
    if (!isPlainObject(data.leaveTypeValues)) return false;
    for (const [key, value] of Object.entries(data.leaveTypeValues)) {
      if (!/^\d{1,2}-vacation-[01]$/.test(key) || !validLeaveTypes.has(String(value))) return false;
    }

    if (data.leaveNoteValues !== undefined) {
      if (!isPlainObject(data.leaveNoteValues)) return false;
      for (const [key, value] of Object.entries(data.leaveNoteValues)) {
        if (!/^\d{1,2}-vacation-[01]$/.test(key) || typeof value !== 'string' || Array.from(value).length > 4) return false;
      }
    }

    if (data.manualNotes !== undefined) {
      if (!isPlainObject(data.manualNotes)) return false;
      for (const [key, value] of Object.entries(data.manualNotes)) {
        if (!/^\d{1,2}$/.test(key) || typeof value !== 'string' || Array.from(value).length > 10) return false;
      }
    }

    if (data.extraLeaves !== undefined) {
      if (!isPlainObject(data.extraLeaves)) return false;
      for (const [key, value] of Object.entries(data.extraLeaves)) {
        if (!/^\d{1,2}$/.test(key) || !isPlainObject(value)) return false;
        if (!/^[A-F]$/.test(String(value.letter || ''))) return false;
        if (!validLeaveTypes.has(String(value.type || 'public'))) return false;
        if (typeof (value.note ?? '') !== 'string' || Array.from(value.note || '').length > 4) return false;
      }
    }

    if (data.annualGrantDecisions !== undefined) {
      if (!isPlainObject(data.annualGrantDecisions)) return false;
      for (const [employeeId, decision] of Object.entries(data.annualGrantDecisions)) {
        if (!/^emp_[A-Za-z0-9_]+$/.test(employeeId) || !isPlainObject(decision)) return false;
        if (!['accumulate', 'reset'].includes(String(decision.mode || ''))) return false;
        if (!Number.isFinite(Number(decision.days)) || Number(decision.days) < 0 || Number(decision.days) > 99) return false;
        if (!Number.isInteger(Number(decision.day)) || Number(decision.day) < 1 || Number(decision.day) > 31) return false;
      }
    }

    if (!isPlainObject(data.specialShiftTimes)) return false;
    for (const [key, value] of Object.entries(data.specialShiftTimes)) {
      if (!/^\d{1,2}-shift-[0-4]$/.test(key) || !isValidTimeRangeText(value)) return false;
    }

    if (!isPlainObject(data.nightShiftTimes)) return false;
    for (const [key, value] of Object.entries(data.nightShiftTimes)) {
      if (!/^\d{1,2}-night-[0-4]$/.test(key) || !isValidTimeRangeText(value)) return false;
    }

    const daysInMonth = new Date(parsedId.year, parsedId.month, 0).getDate();
    if (!Array.isArray(data.meetingDays) || !data.meetingDays.every((item) => Number.isInteger(item) && item >= 1 && item <= daysInMonth)) return false;
    if (data.meetingNoteValues !== undefined) {
      if (!isPlainObject(data.meetingNoteValues)) return false;
      for (const [key, value] of Object.entries(data.meetingNoteValues)) {
        if (!/^\d{1,2}$/.test(key) || typeof value !== 'string' || Array.from(value).length > 10) return false;
      }
    }
    return true;
  }

  function validateBackup(payload) {
    if (!isPlainObject(payload)) return { ok: false, error: 'JSON 最外層格式不正確。' };
    if (payload.format !== FORMAT) return { ok: false, error: '這不是 EliteHotel 班表備份檔。' };
    if (payload.schemaVersion !== SCHEMA_VERSION) return { ok: false, error: `備份版本不支援（需要版本 ${SCHEMA_VERSION}）。` };
    if (!isPlainObject(payload.settings)) return { ok: false, error: 'settings 格式不正確。' };
    if (!isPlainObject(payload.employees)) return { ok: false, error: 'employees 格式不正確。' };
    if (!isPlainObject(payload.months)) return { ok: false, error: 'months 格式不正確。' };

    const settings = payload.settings;
    if (!Number.isInteger(Number(settings.publicLeaveCount)) || Number(settings.publicLeaveCount) < 1 || Number(settings.publicLeaveCount) > 31) return { ok: false, error: '每月公休設定格式不正確。' };
    if (!Number.isInteger(Number(settings.maxConsecutiveWorkDays)) || Number(settings.maxConsecutiveWorkDays) < 1 || Number(settings.maxConsecutiveWorkDays) > 31) return { ok: false, error: '連續上班設定格式不正確。' };
    if (!Number.isFinite(Number(settings.minTurnaroundHours)) || Number(settings.minTurnaroundHours) < 0 || Number(settings.minTurnaroundHours) > 24) return { ok: false, error: '轉班間隔設定格式不正確。' };
    if (!isValidTimeRangeText(settings.normalNightRange)) return { ok: false, error: '灰底預設時間格式不正確。' };
    if (settings.shiftRanges !== undefined) {
      if (!Array.isArray(settings.shiftRanges) || settings.shiftRanges.length !== 5 || !settings.shiftRanges.every(isValidTimeRangeText)) {
        return { ok: false, error: '班別時間設定格式不正確。' };
      }
    }
    if (settings.blockedWeekdays !== undefined && (!Array.isArray(settings.blockedWeekdays) || !settings.blockedWeekdays.every((item) => Number.isInteger(Number(item)) && Number(item) >= 0 && Number(item) <= 6))) return { ok: false, error: '預設禁休星期格式不正確。' };
    if (settings.blockedLeaveTypes !== undefined && (!Array.isArray(settings.blockedLeaveTypes) || !settings.blockedLeaveTypes.every((item) => ['public', 'annual'].includes(String(item))))) return { ok: false, error: '禁休假別設定格式不正確。' };
    if (settings.meetingDefaultText !== undefined && (typeof settings.meetingDefaultText !== 'string' || Array.from(settings.meetingDefaultText).length > 10)) return { ok: false, error: '開會預設備註格式不正確。' };
    if (settings.annualLeaveRules !== undefined) {
      if (!isPlainObject(settings.annualLeaveRules)) return { ok: false, error: '特休級距設定格式不正確。' };
      for (const value of Object.values(settings.annualLeaveRules)) {
        if (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 99) return { ok: false, error: '特休級距設定格式不正確。' };
      }
    }

    for (const [employeeId, employee] of Object.entries(payload.employees)) {
      if (!/^emp_[A-Za-z0-9_]+$/.test(employeeId) || !isPlainObject(employee) || typeof employee.name !== 'string') {
        return { ok: false, error: `員工資料 ${employeeId} 格式不正確。` };
      }
      if (employee.hireDate !== undefined && employee.hireDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(String(employee.hireDate))) {
        return { ok: false, error: `員工資料 ${employeeId} 的到職日格式不正確。` };
      }
    }

    for (const [monthId, data] of Object.entries(payload.months)) {
      if (!validateMonth(monthId, data)) return { ok: false, error: `月份 ${monthId} 的資料格式不正確。` };
      for (const person of Object.values(data.people || {})) {
        if (person.employeeId && !payload.employees[person.employeeId]) {
          return { ok: false, error: `月份 ${monthId} 參照了不存在的員工 ID。` };
        }
      }
    }

    return { ok: true, value: payload };
  }

  function snapshotNamespace() {
    const snapshot = {};
    for (const key of backendKeys()) {
      if (!key.startsWith(`${NAMESPACE}:`)) continue;
      snapshot[key] = backendGet(key);
    }
    return snapshot;
  }

  function clearNamespace() {
    for (const key of backendKeys()) {
      if (key.startsWith(`${NAMESPACE}:`)) backendRemove(key);
    }
  }

  function restoreSnapshot(snapshot) {
    clearNamespace();
    for (const [key, value] of Object.entries(snapshot || {})) {
      if (typeof value === 'string') backendSet(key, value);
    }
  }

  function replaceAll(payload) {
    const validation = validateBackup(payload);
    if (!validation.ok) throw new Error(validation.error);

    const before = snapshotNamespace();
    try {
      clearNamespace();
      const meta = isPlainObject(payload.meta) ? payload.meta : {};
      writeObject(META_KEY, {
        ...meta,
        schemaVersion: SCHEMA_VERSION,
        createdAt: meta.createdAt || new Date().toISOString(),
        importedAt: new Date().toISOString()
      });
      writeObject(SETTINGS_KEY, payload.settings);
      writeObject(EMPLOYEES_KEY, payload.employees);
      for (const [monthId, monthData] of Object.entries(payload.months)) {
        backendSet(`${MONTH_PREFIX}${monthId}`, JSON.stringify(monthData));
      }
      return true;
    } catch (error) {
      restoreSnapshot(before);
      throw error;
    }
  }

  getMeta();

  window.ShiftRosterStorage = Object.freeze({
    isPersistent: () => persistent,
    makeMonthId,
    parseMonthId,
    getPreviousYearMonth,
    getMonth,
    ensureMonth,
    saveMonth,
    getSettings,
    saveSettings,
    getEmployees,
    saveEmployees,
    resolveEmployee,
    removeMonthsBefore,
    exportPayload,
    validateBackup,
    replaceAll
  });
})();
