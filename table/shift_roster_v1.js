'use strict';

const rosterViewTab = document.getElementById('rosterViewTab');
const rulesViewTab = document.getElementById('rulesViewTab');
const rosterView = document.getElementById('rosterView');
const rulesView = document.getElementById('rulesView');
const editRuleSettingsButton = document.getElementById('editRuleSettingsButton');
const ruleSettingsEditor = document.getElementById('ruleSettingsEditor');
const rulePublicLeaveText = document.getElementById('rulePublicLeaveText');
const ruleConsecutiveText = document.getElementById('ruleConsecutiveText');
const ruleTurnaroundText = document.getElementById('ruleTurnaroundText');
const ruleNightText = document.getElementById('ruleNightText');
const rulePublicLeaveSettingInput = document.getElementById('rulePublicLeaveInput');
const ruleConsecutiveInput = document.getElementById('ruleConsecutiveInput');
const ruleTurnaroundInput = document.getElementById('ruleTurnaroundInput');
const ruleNightStartInput = document.getElementById('ruleNightStartInput');
const ruleNightEndInput = document.getElementById('ruleNightEndInput');
const ruleSettingsCancel = document.getElementById('ruleSettingsCancel');
const ruleSettingsApply = document.getElementById('ruleSettingsApply');

const yearInput = document.getElementById('yearInput');
const monthSelect = document.getElementById('monthSelect');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const printButton = document.getElementById('printButton');
const blockModeButton = document.getElementById('blockModeButton');
const specialModeButton = document.getElementById('specialModeButton');
const nightModeButton = document.getElementById('nightModeButton');
const leaveTypeModeButton = document.getElementById('leaveTypeModeButton');
const meetingModeButton = document.getElementById('meetingModeButton');
const shiftConfigButton = document.getElementById('shiftConfigButton');
const leaveCheckButton = document.getElementById('leaveCheckButton');
const ruleCheckButton = document.getElementById('ruleCheckButton');
const clearMonthButton = document.getElementById('clearMonthButton');

const scheduleTable = document.getElementById('scheduleTable');
const lowerTable = document.getElementById('lowerTable');
const summaryGrid = document.getElementById('summaryGrid');
const titleYear = document.getElementById('titleYear');
const titleMonth = document.getElementById('titleMonth');
const outputTimestamp = document.getElementById('outputTimestamp');
const publicLeaveInput = document.getElementById('publicLeaveInput');

const rowFillBar = document.getElementById('rowFillBar');
const rowFillTitle = document.getElementById('rowFillTitle');
const rowFillQuickLetters = document.getElementById('rowFillQuickLetters');
const rowFillClearRow = document.getElementById('rowFillClearRow');
const rowFillClose = document.getElementById('rowFillClose');

const batchLeaveDialog = document.getElementById('batchLeaveDialog');
const batchLeaveMessage = document.getElementById('batchLeaveMessage');
const batchLeaveCount = document.getElementById('batchLeaveCount');
const batchLeaveHint = document.getElementById('batchLeaveHint');
const batchLeaveDates = document.getElementById('batchLeaveDates');
const batchLeaveApply = document.getElementById('batchLeaveApply');
const batchLeaveCancel = document.getElementById('batchLeaveCancel');
const batchLeaveResultDialog = document.getElementById('batchLeaveResultDialog');
const batchLeaveResultMessage = document.getElementById('batchLeaveResultMessage');
const batchLeaveResultClose = document.getElementById('batchLeaveResultClose');

const shiftConfigPanel = document.getElementById('shiftConfigPanel');
const shiftConfigGrid = document.getElementById('shiftConfigGrid');
const shiftConfigClose = document.getElementById('shiftConfigClose');

const conflictDialog = document.getElementById('conflictDialog');
const conflictDialogMessage = document.getElementById('conflictDialogMessage');
const conflictChooseSchedule = document.getElementById('conflictChooseSchedule');
const conflictChooseVacation = document.getElementById('conflictChooseVacation');

const blockedLeaveDialog = document.getElementById('blockedLeaveDialog');
const blockedLeaveMessage = document.getElementById('blockedLeaveMessage');
const blockedLeaveException = document.getElementById('blockedLeaveException');
const blockedLeaveFormal = document.getElementById('blockedLeaveFormal');
const blockedLeaveBack = document.getElementById('blockedLeaveBack');

const leaveTypeDialog = document.getElementById('leaveTypeDialog');
const leaveTypeMessage = document.getElementById('leaveTypeMessage');
const leaveTypeChoices = document.getElementById('leaveTypeChoices');
const leaveTypeCancel = document.getElementById('leaveTypeCancel');

const specialTimeDialog = document.getElementById('specialTimeDialog');
const specialTimeMessage = document.getElementById('specialTimeMessage');
const specialTimeStartInput = document.getElementById('specialTimeStartInput');
const specialTimeEndInput = document.getElementById('specialTimeEndInput');
const specialTimeApply = document.getElementById('specialTimeApply');
const specialTimeRemove = document.getElementById('specialTimeRemove');
const specialTimeBack = document.getElementById('specialTimeBack');

const nightTimeDialog = document.getElementById('nightTimeDialog');
const nightTimeMessage = document.getElementById('nightTimeMessage');
const nightTimeStartInput = document.getElementById('nightTimeStartInput');
const nightTimeEndInput = document.getElementById('nightTimeEndInput');
const nightTimeApply = document.getElementById('nightTimeApply');
const nightTimeRemove = document.getElementById('nightTimeRemove');
const nightTimeBack = document.getElementById('nightTimeBack');

const leaveCheckDialog = document.getElementById('leaveCheckDialog');
const leaveCheckMessage = document.getElementById('leaveCheckMessage');
const leaveCheckCorrect = document.getElementById('leaveCheckCorrect');
const leaveCheckIncorrect = document.getElementById('leaveCheckIncorrect');
const leaveCheckActions = document.getElementById('leaveCheckActions');

const ruleCheckDialog = document.getElementById('ruleCheckDialog');
const ruleCheckMessage = document.getElementById('ruleCheckMessage');
const ruleCheckException = document.getElementById('ruleCheckException');
const ruleCheckBack = document.getElementById('ruleCheckBack');
const ruleCheckActions = document.getElementById('ruleCheckActions');

const clearMonthDialog = document.getElementById('clearMonthDialog');
const clearMonthDialogMessage = document.getElementById('clearMonthDialogMessage');
const clearMonthCancel = document.getElementById('clearMonthCancel');
const clearMonthConfirm = document.getElementById('clearMonthConfirm');

const outputTimeDialog = document.getElementById('outputTimeDialog');
const outputTimeYes = document.getElementById('outputTimeYes');
const outputTimeNo = document.getElementById('outputTimeNo');

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const shifts = [
  { label: '07 ~ 15', groupLabel: '早' },
  { label: '15 ~ 23', groupLabel: '中' },
  { label: '16 ~ 24', groupLabel: '中' },
  { label: '23 ~ 07', groupLabel: '夜' },
  { label: '00 ~ 08', groupLabel: '夜' }
];

const LEAVE_TYPE_LABELS = Object.freeze({
  public: '公休',
  annual: '特休',
  leave: '請假',
  personal: '請假',
  bereavement: '請假',
  other: '請假',
  exceptionPublic: '例外排休'
});
const FORMAL_LEAVE_TYPES = new Set(['leave', 'personal', 'bereavement', 'other']);

const storage = window.ShiftRosterStorage || null;
const DEFAULT_SETTINGS = Object.freeze({
  publicLeaveCount: 8,
  maxConsecutiveWorkDays: 6,
  minTurnaroundHours: 12,
  normalNightRange: '22~06'
});

// ===== 畫面工作狀態：月份切換時由本機資料層載入／保存。 =====
const names = Array(6).fill('');
const employeeIds = Array(6).fill('');
const specialLeaveValues = Array(6).fill('');
let publicLeaveCount = '8';
let maxConsecutiveWorkDays = 6;
let minTurnaroundHours = 12;
let normalNightRange = '22~06';
const rosterValues = new Map();
const blockedVacationOverrides = new Map();
const specialShiftCells = new Set();
const nightShiftOverrides = new Map();
const leaveTypeValues = new Map();
const specialShiftTimes = new Map();
const nightShiftTimes = new Map();
const meetingDays = new Set();
const personnelShiftValues = new Map();

let blockModeEnabled = false;
let specialModeEnabled = false;
let nightModeEnabled = false;
let leaveTypeModeEnabled = false;
let meetingModeEnabled = false;
let selectedRowFillShiftIndex = null;
let conflictChoiceResolver = null;
let blockedLeaveResolver = null;
let leaveTypeResolver = null;
let outputTimeResolver = null;
let specialTimeContext = null;
let nightTimeContext = null;
let leaveCheckItems = [];
let leaveCheckIndex = 0;
let leaveCheckCompleteMode = false;
let ruleCheckItems = [];
let ruleCheckIndex = 0;
let ruleCheckCompleteMode = false;

const BATCH_PUBLIC_LEAVE_MAX = 8;
let batchLeaveLetter = null;
let batchLeaveSelectedDays = new Set();
let batchLeaveFailedDays = [];

for (let month = 1; month <= 12; month += 1) {
  const option = document.createElement('option');
  option.value = month;
  option.textContent = `${month} 月`;
  monthSelect.appendChild(option);
}

function setMainView(view) {
  const showRules = view === 'rules';
  rosterView.hidden = showRules;
  rulesView.hidden = !showRules;
  rosterViewTab.classList.toggle('is-active', !showRules);
  rulesViewTab.classList.toggle('is-active', showRules);
  rosterViewTab.setAttribute('aria-selected', String(!showRules));
  rulesViewTab.setAttribute('aria-selected', String(showRules));
  if (showRules) {
    closeRowFillPanel();
    closeShiftConfigPanel();
    renderRuleSettingsPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function formatRuleNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) ? String(number) : String(number).replace(/\.0+$/, '');
}

function renderRuleSettingsPage() {
  const publicLeave = publicLeaveCount || '8';
  rulePublicLeaveText.textContent = publicLeave;
  ruleConsecutiveText.textContent = String(maxConsecutiveWorkDays);
  ruleTurnaroundText.textContent = formatRuleNumber(minTurnaroundHours);
  ruleNightText.textContent = normalNightRange;

  document.querySelectorAll('[data-rule-public-leave]').forEach((node) => { node.textContent = publicLeave; });
  document.querySelectorAll('[data-rule-consecutive]').forEach((node) => { node.textContent = String(maxConsecutiveWorkDays); });
  document.querySelectorAll('[data-rule-turnaround]').forEach((node) => { node.textContent = formatRuleNumber(minTurnaroundHours); });
  document.querySelectorAll('[data-rule-night]').forEach((node) => { node.textContent = normalNightRange; });
}

function openRuleSettingsEditor() {
  rulePublicLeaveSettingInput.value = publicLeaveCount || '8';
  ruleConsecutiveInput.value = String(maxConsecutiveWorkDays);
  ruleTurnaroundInput.value = formatRuleNumber(minTurnaroundHours);
  fillHourPair(ruleNightStartInput, ruleNightEndInput, normalNightRange);
  ruleSettingsEditor.hidden = false;
  editRuleSettingsButton.hidden = true;
  requestAnimationFrame(() => rulePublicLeaveSettingInput.focus());
}

function closeRuleSettingsEditor() {
  ruleSettingsEditor.hidden = true;
  editRuleSettingsButton.hidden = false;
}

function applyRuleSettings() {
  const nextPublicLeave = Number.parseInt(rulePublicLeaveSettingInput.value, 10);
  const nextConsecutive = Number.parseInt(ruleConsecutiveInput.value, 10);
  const nextTurnaround = Number(ruleTurnaroundInput.value);
  const nextNight = buildHourRange(ruleNightStartInput, ruleNightEndInput);

  if (!Number.isInteger(nextPublicLeave) || nextPublicLeave < 1 || nextPublicLeave > 31) {
    window.alert('每月公休請輸入 1～31 天。');
    return;
  }
  if (!Number.isInteger(nextConsecutive) || nextConsecutive < 1 || nextConsecutive > 31) {
    window.alert('連續上班上限請輸入 1～31 天。');
    return;
  }
  if (!Number.isFinite(nextTurnaround) || nextTurnaround < 0 || nextTurnaround > 24) {
    window.alert('轉班最低間隔請輸入 0～24 小時。');
    return;
  }
  if (!window.ShiftRosterRules?.parseTimeRange(nextNight)) {
    window.alert('灰底預設時間請分別輸入開始與結束小時，例如 22、06。');
    return;
  }

  publicLeaveCount = String(nextPublicLeave);
  maxConsecutiveWorkDays = nextConsecutive;
  minTurnaroundHours = nextTurnaround;
  normalNightRange = nextNight;
  publicLeaveInput.textContent = publicLeaveCount;
  renderSummary();
  renderRuleSettingsPage();
  persistGlobalSettings();
  closeRuleSettingsEditor();
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getDayInfo(year, month, day) {
  const weekdayIndex = new Date(year, month - 1, day).getDay();
  return {
    weekdayIndex,
    weekday: weekdays[weekdayIndex],
    className: weekdayIndex === 6 ? 'saturday' : weekdayIndex === 0 ? 'sunday' : ''
  };
}

// 上方日期列採「兩白、兩灰」循環，且跨月份不中斷。
// 以 2026/10/1～10/2 為白底基準。
function getDateBandClass(year, month, day) {
  const anchorUtc = Date.UTC(2026, 9, 1);
  const currentUtc = Date.UTC(year, month - 1, day);
  const dayDiff = Math.floor((currentUtc - anchorUtc) / 86400000);
  const pairIndex = Math.floor(dayDiff / 2);
  return Math.abs(pairIndex % 2) === 1 ? 'date-band-dark' : 'date-band-light';
}

function appendDayColumns(colgroup, days) {
  const labelCol = document.createElement('col');
  labelCol.className = 'label-col';
  colgroup.appendChild(labelCol);

  const codeCol = document.createElement('col');
  codeCol.className = 'code-col';
  colgroup.appendChild(codeCol);

  for (let day = 1; day <= days; day += 1) colgroup.appendChild(document.createElement('col'));
}

function makeRosterKey(year, month, day, type, index = '') {
  return `${year}-${month}-${day}-${type}-${index}`;
}
function makeBlockedDayKey(year, month, day) {
  return `${year}-${month}-${day}`;
}
function makeSpecialShiftKey(year, month, day, shiftIndex) {
  return `${year}-${month}-${day}-shift-${shiftIndex}`;
}
function makeNightShiftKey(year, month, day, shiftIndex) {
  return `${year}-${month}-${day}-night-${shiftIndex}`;
}
function makeMeetingDayKey(year, month, day) {
  return `${year}-${month}-${day}-meeting`;
}
function makePersonnelShiftKey(year, month, letter) {
  return `${year}-${month}-${letter}-personnel-shifts`;
}


function getCurrentYearMonth() {
  return { year: Number(yearInput.value), month: Number(monthSelect.value) };
}

function getDefaultNextYearMonth(date = new Date()) {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
}

function getMonthMemoryPrefix(year, month) {
  return `${year}-${month}-`;
}

function serializeMapForMonth(map, year, month) {
  const prefix = getMonthMemoryPrefix(year, month);
  const output = {};
  for (const [key, value] of map.entries()) {
    const textKey = String(key);
    if (!textKey.startsWith(prefix)) continue;
    output[textKey.slice(prefix.length)] = value;
  }
  return output;
}

function serializeSetForMonth(set, year, month) {
  const prefix = getMonthMemoryPrefix(year, month);
  return [...set]
    .map((key) => String(key))
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));
}

function restoreMapForMonth(map, year, month, values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return;
  const prefix = getMonthMemoryPrefix(year, month);
  for (const [suffix, value] of Object.entries(values)) map.set(`${prefix}${suffix}`, value);
}

function restoreSetForMonth(set, year, month, values) {
  if (!Array.isArray(values)) return;
  const prefix = getMonthMemoryPrefix(year, month);
  values.forEach((suffix) => set.add(`${prefix}${suffix}`));
}

function clearMonthMemory(year, month) {
  clearMapKeysForMonth(rosterValues, year, month);
  clearMapKeysForMonth(blockedVacationOverrides, year, month);
  clearMapKeysForMonth(nightShiftOverrides, year, month);
  clearMapKeysForMonth(leaveTypeValues, year, month);
  clearMapKeysForMonth(specialShiftTimes, year, month);
  clearMapKeysForMonth(nightShiftTimes, year, month);
  clearMapKeysForMonth(personnelShiftValues, year, month);
  clearSetKeysForMonth(specialShiftCells, year, month);
  clearSetKeysForMonth(meetingDays, year, month);
}

function buildCurrentMonthSnapshot() {
  const { year, month } = getCurrentYearMonth();
  const monthId = storage?.makeMonthId(year, month) || `${year}-${String(month).padStart(2, '0')}`;
  const people = {};

  for (let index = 0; index < 6; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const displayName = names[index] || '';
    const employeeId = employeeIds[index] || '';
    const shiftGroups = [...getPersonnelShifts(year, month, letter)];
    if (!displayName && !employeeId && !shiftGroups.length) continue;
    people[letter] = { employeeId, displayName, shiftGroups };
  }

  return {
    month: monthId,
    people,
    specialLeaveValues: [...specialLeaveValues],
    rosterValues: serializeMapForMonth(rosterValues, year, month),
    blockedVacationOverrides: serializeMapForMonth(blockedVacationOverrides, year, month),
    specialShiftCells: serializeSetForMonth(specialShiftCells, year, month),
    nightShiftOverrides: serializeMapForMonth(nightShiftOverrides, year, month),
    leaveTypeValues: serializeMapForMonth(leaveTypeValues, year, month),
    specialShiftTimes: serializeMapForMonth(specialShiftTimes, year, month),
    nightShiftTimes: serializeMapForMonth(nightShiftTimes, year, month),
    meetingDays: serializeSetForMonth(meetingDays, year, month)
      .map((suffix) => Number(String(suffix).replace(/-meeting$/, '')))
      .filter((day) => Number.isInteger(day))
  };
}

function persistCurrentMonth() {
  if (!storage) return;
  const { year, month } = getCurrentYearMonth();
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return;
  storage.saveMonth(buildCurrentMonthSnapshot());
}

function persistGlobalSettings() {
  if (!storage) return;
  storage.saveSettings({
    publicLeaveCount: Number.parseInt(publicLeaveCount || '8', 10) || 8,
    maxConsecutiveWorkDays,
    minTurnaroundHours,
    normalNightRange
  });
}

function loadGlobalSettings() {
  if (!storage) return;
  const saved = storage.getSettings(DEFAULT_SETTINGS);
  publicLeaveCount = String(Number.parseInt(saved.publicLeaveCount, 10) || DEFAULT_SETTINGS.publicLeaveCount);
  maxConsecutiveWorkDays = Number.parseInt(saved.maxConsecutiveWorkDays, 10) || DEFAULT_SETTINGS.maxConsecutiveWorkDays;
  minTurnaroundHours = Number.isFinite(Number(saved.minTurnaroundHours)) ? Number(saved.minTurnaroundHours) : DEFAULT_SETTINGS.minTurnaroundHours;
  normalNightRange = String(saved.normalNightRange || DEFAULT_SETTINGS.normalNightRange);
}

function loadMonthIntoMemory(year, month, data) {
  clearMonthMemory(year, month);
  names.fill('');
  employeeIds.fill('');
  specialLeaveValues.fill('');

  const people = data?.people && typeof data.people === 'object' ? data.people : {};
  for (let index = 0; index < 6; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const person = people[letter] || {};
    names[index] = typeof person.displayName === 'string' ? person.displayName : '';
    employeeIds[index] = typeof person.employeeId === 'string' ? person.employeeId : '';
    const groups = Array.isArray(person.shiftGroups) ? person.shiftGroups.filter((item) => ['early', 'middle', 'night'].includes(item)) : [];
    if (groups.length) personnelShiftValues.set(makePersonnelShiftKey(year, month, letter), [...new Set(groups)]);
  }

  const leaveValues = Array.isArray(data?.specialLeaveValues) ? data.specialLeaveValues : [];
  for (let index = 0; index < 6; index += 1) specialLeaveValues[index] = String(leaveValues[index] || '');

  restoreMapForMonth(rosterValues, year, month, data?.rosterValues);
  restoreMapForMonth(blockedVacationOverrides, year, month, data?.blockedVacationOverrides);
  restoreSetForMonth(specialShiftCells, year, month, data?.specialShiftCells);

  const nightOverrides = { ...(data?.nightShiftOverrides || {}) };
  const nightTimes = { ...(data?.nightShiftTimes || {}) };
  for (const [suffix, value] of Object.entries({ ...nightOverrides })) {
    const match = String(suffix).match(/^(\d{1,2})-night$/);
    if (!match) continue;
    const migrated = `${match[1]}-night-3`;
    if (!Object.prototype.hasOwnProperty.call(nightOverrides, migrated)) nightOverrides[migrated] = value;
    delete nightOverrides[suffix];
  }
  for (const [suffix, value] of Object.entries({ ...nightTimes })) {
    const match = String(suffix).match(/^(\d{1,2})-night$/);
    if (!match) continue;
    const migrated = `${match[1]}-night-3`;
    if (!Object.prototype.hasOwnProperty.call(nightTimes, migrated)) nightTimes[migrated] = value;
    delete nightTimes[suffix];
  }
  restoreMapForMonth(nightShiftOverrides, year, month, nightOverrides);
  restoreMapForMonth(leaveTypeValues, year, month, data?.leaveTypeValues);
  restoreMapForMonth(specialShiftTimes, year, month, data?.specialShiftTimes);
  restoreMapForMonth(nightShiftTimes, year, month, nightTimes);

  if (Array.isArray(data?.meetingDays)) {
    data.meetingDays.forEach((day) => {
      if (Number.isInteger(day) && day >= 1 && day <= 31) meetingDays.add(makeMeetingDayKey(year, month, day));
    });
  }
}

function loadMonth(year, month) {
  if (!storage) return;
  const data = storage.ensureMonth(year, month);
  loadMonthIntoMemory(year, month, data);
}

function trimDisplayName(value) {
  return Array.from(String(value || '')).slice(0, 3).join('');
}

function findShiftGroupsForEmployee(employeeId, targetIndex) {
  if (!employeeId) return [];
  const { year, month } = getCurrentYearMonth();

  for (let index = 0; index < employeeIds.length; index += 1) {
    if (index === targetIndex || employeeIds[index] !== employeeId) continue;
    const letter = String.fromCharCode(65 + index);
    return [...getPersonnelShifts(year, month, letter)];
  }

  if (storage) {
    const previous = storage.getPreviousYearMonth(year, month);
    const previousMonth = storage.getMonth(previous.year, previous.month);
    for (const person of Object.values(previousMonth?.people || {})) {
      if (person?.employeeId === employeeId && Array.isArray(person.shiftGroups)) {
        return person.shiftGroups.filter((item) => ['early', 'middle', 'night'].includes(item));
      }
    }
  }
  return [];
}

function setPersonnelGroupsForIndex(index, groups) {
  const { year, month } = getCurrentYearMonth();
  const letter = String.fromCharCode(65 + index);
  const key = makePersonnelShiftKey(year, month, letter);
  const cleaned = [...new Set((groups || []).filter((item) => ['early', 'middle', 'night'].includes(item)))];
  if (cleaned.length) personnelShiftValues.set(key, cleaned);
  else personnelShiftValues.delete(key);
}

function commitNameAtIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index >= 6) return;
  const displayName = names[index] || '';
  const previousEmployeeId = employeeIds[index] || '';

  if (!displayName.trim()) {
    names[index] = '';
    employeeIds[index] = '';
    setPersonnelGroupsForIndex(index, []);
    persistCurrentMonth();
    return;
  }

  if (storage) {
    const nextEmployeeId = storage.resolveEmployee(displayName, previousEmployeeId);
    if (nextEmployeeId !== previousEmployeeId) {
      setPersonnelGroupsForIndex(index, findShiftGroupsForEmployee(nextEmployeeId, index));
    }
    employeeIds[index] = nextEmployeeId;
  }
  persistCurrentMonth();
}

function commitAllVisibleNames() {
  document.querySelectorAll('.name-input').forEach((input) => {
    const index = Number(input.dataset.index);
    if (!Number.isInteger(index)) return;
    names[index] = trimDisplayName(input.value);
    input.value = names[index];
    commitNameAtIndex(index);
  });
}

function cleanEnglishLetter(value) {
  return String(value || '').toUpperCase().replace(/[^A-F]/g, '').slice(0, 1);
}
function cleanTwoDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 2);
}
function normalizeTimeInput(value) {
  return String(value || '').trim().replace(/[～〜—–－]/g, '~').replace(/\s+/g, '');
}
function cleanHourInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 2);
}
function splitHourRange(value) {
  const parsed = window.ShiftRosterRules?.parseTimeRange(normalizeTimeInput(value));
  if (!parsed) return { start: '', end: '' };
  return { start: String(parsed.start.hour).padStart(2, '0'), end: String(parsed.end.hour).padStart(2, '0') };
}
function buildHourRange(startInput, endInput) {
  const startText = cleanHourInput(startInput.value);
  const endText = cleanHourInput(endInput.value);
  startInput.value = startText;
  endInput.value = endText;
  if (!startText || !endText) return '';
  const start = Number(startText);
  const end = Number(endText);
  if (!Number.isInteger(start) || start < 0 || start > 23) return '';
  if (!Number.isInteger(end) || end < 0 || end > 24) return '';
  return `${String(start).padStart(2, '0')}~${String(end).padStart(2, '0')}`;
}
function fillHourPair(startInput, endInput, value) {
  const { start, end } = splitHourRange(value);
  startInput.value = start;
  endInput.value = end;
}
function bindHourPair(startInput, endInput, onSubmit) {
  const sanitize = (input) => { input.value = cleanHourInput(input.value); };
  startInput.addEventListener('input', () => {
    sanitize(startInput);
    if (startInput.value.length >= 2) endInput.focus();
  });
  endInput.addEventListener('input', () => sanitize(endInput));
  startInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); endInput.focus(); }
  });
  endInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); onSubmit(); }
  });
}

function clearMapKeysForMonth(map, year, month) {
  const prefix = `${year}-${month}-`;
  for (const key of [...map.keys()]) if (String(key).startsWith(prefix)) map.delete(key);
}
function clearSetKeysForMonth(set, year, month) {
  const prefix = `${year}-${month}-`;
  for (const key of [...set]) if (String(key).startsWith(prefix)) set.delete(key);
}

function getDefaultBlockedState(year, month, day) {
  return getDayInfo(year, month, day).weekdayIndex === 6;
}
function isVacationBlocked(year, month, day) {
  const key = makeBlockedDayKey(year, month, day);
  return blockedVacationOverrides.has(key) ? blockedVacationOverrides.get(key) : getDefaultBlockedState(year, month, day);
}
function setVacationBlockedState(year, month, day, blocked) {
  const key = makeBlockedDayKey(year, month, day);
  const defaultBlocked = getDefaultBlockedState(year, month, day);
  if (blocked === defaultBlocked) blockedVacationOverrides.delete(key);
  else blockedVacationOverrides.set(key, blocked);
}

function getDefaultNightGrayState(year, month, day, shiftIndex) {
  return shiftIndex === 3 && getDayInfo(year, month, day).weekdayIndex === 6;
}
function isNightGray(year, month, day, shiftIndex) {
  const key = makeNightShiftKey(year, month, day, shiftIndex);
  return nightShiftOverrides.has(key) ? nightShiftOverrides.get(key) : getDefaultNightGrayState(year, month, day, shiftIndex);
}
function setNightGrayState(year, month, day, shiftIndex, enabled) {
  const key = makeNightShiftKey(year, month, day, shiftIndex);
  const defaultState = getDefaultNightGrayState(year, month, day, shiftIndex);
  if (enabled === defaultState) nightShiftOverrides.delete(key);
  else nightShiftOverrides.set(key, enabled);
}

function getLeaveType(key) {
  return leaveTypeValues.get(key) || 'public';
}
function setLeaveType(key, type) {
  if (!type || type === 'public') leaveTypeValues.delete(key);
  else leaveTypeValues.set(key, type);
}
function isFormalLeaveType(type) {
  return FORMAL_LEAVE_TYPES.has(type || '');
}

function getVacationLettersForDay(year, month, day) {
  return [0, 1].map((slot) => {
    const key = makeRosterKey(year, month, day, 'vacation', slot);
    return { key, slot, value: rosterValues.get(key) || '', type: getLeaveType(key) };
  });
}
function hasVacationLetter(year, month, day, letter) {
  return Boolean(letter) && getVacationLettersForDay(year, month, day).some((entry) => entry.value === letter);
}
function removeVacationLetter(year, month, day, letter) {
  getVacationLettersForDay(year, month, day).forEach((entry) => {
    if (entry.value === letter) {
      rosterValues.delete(entry.key);
      leaveTypeValues.delete(entry.key);
    }
  });
}

function isBatchPublicLeaveType(type) {
  return ['public', 'exceptionPublic'].includes(type || 'public');
}
function removeBatchPublicVacationLetter(year, month, day, letter) {
  getVacationLettersForDay(year, month, day).forEach((entry) => {
    if (entry.value === letter && isBatchPublicLeaveType(entry.type)) {
      rosterValues.delete(entry.key);
      leaveTypeValues.delete(entry.key);
    }
  });
}

function getShiftEntriesForDay(year, month, day) {
  return shifts.map((shift, shiftIndex) => {
    const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
    return { key, shiftIndex, value: rosterValues.get(key) || '' };
  });
}
function hasShiftLetterForDay(year, month, day, letter) {
  return Boolean(letter) && getShiftEntriesForDay(year, month, day).some((entry) => entry.value === letter);
}
function removeShiftLetterForDay(year, month, day, letter) {
  getShiftEntriesForDay(year, month, day).forEach((entry) => {
    if (entry.value !== letter) return;
    rosterValues.delete(entry.key);
    const specialKey = makeSpecialShiftKey(year, month, day, entry.shiftIndex);
    specialShiftCells.delete(specialKey);
    specialShiftTimes.delete(specialKey);
    nightShiftTimes.delete(makeNightShiftKey(year, month, day, entry.shiftIndex));
  });
}

const PERSONNEL_SHIFT_GROUPS = Object.freeze([
  { key: 'early', label: '早班', detail: '07～15' },
  { key: 'middle', label: '中班', detail: '15～23／16～00' },
  { key: 'night', label: '夜班', detail: '23～07／00～08' }
]);

function getPersonnelShifts(year, month, letter) {
  const value = personnelShiftValues.get(makePersonnelShiftKey(year, month, letter));
  return new Set(Array.isArray(value) ? value : value instanceof Set ? [...value] : []);
}
function setPersonnelShift(year, month, letter, groupKey, enabled) {
  const key = makePersonnelShiftKey(year, month, letter);
  const current = getPersonnelShifts(year, month, letter);
  if (enabled) current.add(groupKey);
  else current.delete(groupKey);
  if (current.size) personnelShiftValues.set(key, [...current]);
  else personnelShiftValues.delete(key);
}

function deactivateOtherModes(except) {
  const map = {
    block: () => setBlockMode(false),
    special: () => setSpecialMode(false),
    night: () => setNightMode(false),
    leaveType: () => setLeaveTypeMode(false),
    meeting: () => setMeetingMode(false)
  };
  for (const [name, disable] of Object.entries(map)) if (name !== except) disable();
}

function setBlockMode(enabled) {
  blockModeEnabled = Boolean(enabled);
  if (blockModeEnabled) deactivateOtherModes('block');
  blockModeButton.classList.toggle('is-active', blockModeEnabled);
  blockModeButton.setAttribute('aria-pressed', String(blockModeEnabled));
  document.body.classList.toggle('block-mode', blockModeEnabled);
}
function setSpecialMode(enabled) {
  specialModeEnabled = Boolean(enabled);
  if (specialModeEnabled) deactivateOtherModes('special');
  specialModeButton.classList.toggle('is-active', specialModeEnabled);
  specialModeButton.setAttribute('aria-pressed', String(specialModeEnabled));
  document.body.classList.toggle('special-mode', specialModeEnabled);
}
function setNightMode(enabled) {
  nightModeEnabled = Boolean(enabled);
  if (nightModeEnabled) deactivateOtherModes('night');
  nightModeButton.classList.toggle('is-active', nightModeEnabled);
  nightModeButton.setAttribute('aria-pressed', String(nightModeEnabled));
  document.body.classList.toggle('night-mode', nightModeEnabled);
}
function setLeaveTypeMode(enabled) {
  leaveTypeModeEnabled = Boolean(enabled);
  if (leaveTypeModeEnabled) deactivateOtherModes('leaveType');
  leaveTypeModeButton.classList.toggle('is-active', leaveTypeModeEnabled);
  leaveTypeModeButton.setAttribute('aria-pressed', String(leaveTypeModeEnabled));
  document.body.classList.toggle('leave-type-mode', leaveTypeModeEnabled);
}
function setMeetingMode(enabled) {
  meetingModeEnabled = Boolean(enabled);
  if (meetingModeEnabled) deactivateOtherModes('meeting');
  meetingModeButton.classList.toggle('is-active', meetingModeEnabled);
  meetingModeButton.setAttribute('aria-pressed', String(meetingModeEnabled));
  document.body.classList.toggle('meeting-mode', meetingModeEnabled);
}

function showConflictChoice(message) {
  if (conflictChoiceResolver) conflictChoiceResolver('vacation');
  conflictDialogMessage.textContent = message;
  conflictDialog.hidden = false;
  return new Promise((resolve) => {
    conflictChoiceResolver = resolve;
    requestAnimationFrame(() => conflictChooseVacation.focus());
  });
}
function resolveConflictChoice(choice) {
  if (!conflictChoiceResolver) return;
  const resolve = conflictChoiceResolver;
  conflictChoiceResolver = null;
  conflictDialog.hidden = true;
  resolve(choice);
}

function showBlockedLeaveChoice(message) {
  if (blockedLeaveResolver) blockedLeaveResolver('back');
  blockedLeaveMessage.textContent = message;
  blockedLeaveDialog.hidden = false;
  return new Promise((resolve) => {
    blockedLeaveResolver = resolve;
    requestAnimationFrame(() => blockedLeaveException.focus());
  });
}
function resolveBlockedLeaveChoice(choice) {
  if (!blockedLeaveResolver) return;
  const resolve = blockedLeaveResolver;
  blockedLeaveResolver = null;
  blockedLeaveDialog.hidden = true;
  resolve(choice);
}

function showLeaveTypeChoice({ message, allowedTypes = null }) {
  if (leaveTypeResolver) leaveTypeResolver(null);
  leaveTypeMessage.textContent = message;
  const allowed = allowedTypes ? new Set(allowedTypes) : null;
  leaveTypeChoices.querySelectorAll('[data-leave-type]').forEach((button) => {
    button.hidden = Boolean(allowed && !allowed.has(button.dataset.leaveType));
  });
  leaveTypeDialog.hidden = false;
  return new Promise((resolve) => {
    leaveTypeResolver = resolve;
    const first = [...leaveTypeChoices.querySelectorAll('[data-leave-type]')].find((button) => !button.hidden);
    if (first) requestAnimationFrame(() => first.focus());
  });
}
function resolveLeaveTypeChoice(type) {
  if (!leaveTypeResolver) return;
  const resolve = leaveTypeResolver;
  leaveTypeResolver = null;
  leaveTypeDialog.hidden = true;
  resolve(type);
}

function openSpecialTimeDialog(year, month, day, shiftIndex) {
  const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
  const letter = rosterValues.get(key) || '';
  if (!letter) {
    window.alert('請先在這格填入員工代號，再設定特殊班時間。');
    return;
  }
  const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
  specialTimeContext = { year, month, day, shiftIndex, key, specialKey, letter };
  specialTimeMessage.textContent = `${month}/${day}　${letter}　特殊班實際時間`;
  fillHourPair(specialTimeStartInput, specialTimeEndInput, specialShiftTimes.get(specialKey) || '');
  specialTimeDialog.hidden = false;
  requestAnimationFrame(() => specialTimeStartInput.focus());
}
function closeSpecialTimeDialog() {
  specialTimeDialog.hidden = true;
  specialTimeContext = null;
}
function applySpecialTime() {
  if (!specialTimeContext) return;
  const value = buildHourRange(specialTimeStartInput, specialTimeEndInput);
  if (!window.ShiftRosterRules?.parseTimeRange(value)) {
    window.alert('請分別輸入開始與結束小時，例如 12、20。');
    specialTimeStartInput.focus();
    return;
  }
  specialShiftCells.add(specialTimeContext.specialKey);
  specialShiftTimes.set(specialTimeContext.specialKey, value);
  closeSpecialTimeDialog();
  render();
}
function removeSpecialTime() {
  if (!specialTimeContext) return;
  specialShiftCells.delete(specialTimeContext.specialKey);
  specialShiftTimes.delete(specialTimeContext.specialKey);
  closeSpecialTimeDialog();
  render();
}

function openNightTimeDialog(year, month, day, shiftIndex) {
  const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
  const letter = rosterValues.get(key) || '';
  nightTimeContext = { year, month, day, shiftIndex, key, letter };
  const shiftLabel = shifts[shiftIndex]?.label || '';
  const emptyTimeHint = shiftIndex === 3
    ? `留空時使用灰底預設時間 ${normalNightRange}`
    : `留空時沿用班別時間 ${shiftLabel}`;
  nightTimeMessage.textContent = `${month}/${day}${letter ? `　${letter}` : ''}${shiftLabel ? `　${shiftLabel}` : ''}　灰底設定\n實際時間可留空；${emptyTimeHint}`;
  fillHourPair(nightTimeStartInput, nightTimeEndInput, nightShiftTimes.get(makeNightShiftKey(year, month, day, shiftIndex)) || '');
  nightTimeDialog.hidden = false;
  requestAnimationFrame(() => nightTimeStartInput.focus());
}
function closeNightTimeDialog() {
  nightTimeDialog.hidden = true;
  nightTimeContext = null;
}
function applyNightTime() {
  if (!nightTimeContext) return;

  const startText = cleanHourInput(nightTimeStartInput.value);
  const endText = cleanHourInput(nightTimeEndInput.value);
  nightTimeStartInput.value = startText;
  nightTimeEndInput.value = endText;

  const { year, month, day, shiftIndex } = nightTimeContext;
  const nightKey = makeNightShiftKey(year, month, day, shiftIndex);

  if (!startText && !endText) {
    setNightGrayState(year, month, day, shiftIndex, true);
    nightShiftTimes.delete(nightKey);
    closeNightTimeDialog();
    render();
    return;
  }

  if (!startText || !endText) {
    window.alert('時間可以完全留空；若要輸入，請把開始與結束時間都填完整。');
    (startText ? nightTimeEndInput : nightTimeStartInput).focus();
    return;
  }

  const value = `${String(Number(startText)).padStart(2, '0')}~${String(Number(endText)).padStart(2, '0')}`;
  if (!window.ShiftRosterRules?.parseTimeRange(value)) {
    window.alert('時間格式不正確，請分別輸入開始與結束小時，例如 21、05；或兩格都留空。');
    nightTimeStartInput.focus();
    return;
  }

  setNightGrayState(year, month, day, shiftIndex, true);
  nightShiftTimes.set(nightKey, value);
  closeNightTimeDialog();
  render();
}
function removeNight() {
  if (!nightTimeContext) return;
  const { year, month, day, shiftIndex } = nightTimeContext;
  setNightGrayState(year, month, day, shiftIndex, false);
  nightShiftTimes.delete(makeNightShiftKey(year, month, day, shiftIndex));
  closeNightTimeDialog();
  render();
}

function openClearMonthDialog() {
  const { year, month } = getCurrentYearMonth();
  clearMonthDialogMessage.textContent = `${year} 年 ${month} 月的排班與手動標記都要清空嗎？\n姓名與公休／特休數字會保留。`;
  clearMonthDialog.hidden = false;
}
function closeClearMonthDialog() {
  clearMonthDialog.hidden = true;
}
function clearCurrentMonth() {
  const { year, month } = getCurrentYearMonth();
  clearMapKeysForMonth(rosterValues, year, month);
  clearMapKeysForMonth(blockedVacationOverrides, year, month);
  clearMapKeysForMonth(nightShiftOverrides, year, month);
  clearMapKeysForMonth(leaveTypeValues, year, month);
  clearMapKeysForMonth(specialShiftTimes, year, month);
  clearMapKeysForMonth(nightShiftTimes, year, month);
  clearMapKeysForMonth(personnelShiftValues, year, month);
  clearSetKeysForMonth(specialShiftCells, year, month);
  clearSetKeysForMonth(meetingDays, year, month);
  closeRowFillPanel();
  closeShiftConfigPanel();
  closeClearMonthDialog();
  render();
}

async function applyLetterToShiftRow(shiftIndex, letter) {
  const { year, month } = getCurrentYearMonth();
  const cleaned = cleanEnglishLetter(letter);
  if (shiftIndex == null || shiftIndex < 0 || shiftIndex >= shifts.length) return;
  const days = getDaysInMonth(year, month);

  if (!cleaned) {
    for (let day = 1; day <= days; day += 1) {
      const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
      rosterValues.delete(key);
      const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
      specialShiftCells.delete(specialKey);
      specialShiftTimes.delete(specialKey);
      nightShiftTimes.delete(makeNightShiftKey(year, month, day, shiftIndex));
    }
    closeRowFillPanel();
    render();
    return;
  }

  const conflictDays = [];
  for (let day = 1; day <= days; day += 1) {
    if (hasVacationLetter(year, month, day, cleaned)) conflictDays.push(day);
  }

  let conflictChoice = null;
  if (conflictDays.length) {
    const dateText = conflictDays.map((day) => `${month}/${day}`).join('、');
    conflictChoice = await showConflictChoice(`${dateText}　${cleaned} 已排休\n要以哪一種為準？`);
    if (conflictChoice === 'schedule') conflictDays.forEach((day) => removeVacationLetter(year, month, day, cleaned));
    else conflictDays.forEach((day) => removeShiftLetterForDay(year, month, day, cleaned));
  }

  const conflictDaySet = new Set(conflictDays);
  for (let day = 1; day <= days; day += 1) {
    if (conflictChoice === 'vacation' && conflictDaySet.has(day)) continue;
    rosterValues.set(makeRosterKey(year, month, day, 'shift', shiftIndex), cleaned);
  }
  closeRowFillPanel();
  render();
}

function openRowFillPanel(shiftIndex) {
  selectedRowFillShiftIndex = shiftIndex;
  rowFillTitle.textContent = `${shifts[shiftIndex].label} 整列填入`;
  rowFillBar.hidden = false;
  closeShiftConfigPanel();
  rowFillBar.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function closeRowFillPanel() {
  rowFillBar.hidden = true;
  selectedRowFillShiftIndex = null;
}
function buildRowFillQuickLetters() {
  rowFillQuickLetters.innerHTML = '';
  for (const letter of ['A', 'B', 'C', 'D', 'E', 'F']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = letter;
    button.addEventListener('click', () => {
      if (selectedRowFillShiftIndex != null) applyLetterToShiftRow(selectedRowFillShiftIndex, letter);
    });
    rowFillQuickLetters.appendChild(button);
  }
}

function openShiftConfigPanel() {
  closeRowFillPanel();
  renderShiftConfigPanel();
  shiftConfigPanel.hidden = false;
  shiftConfigButton.setAttribute('aria-expanded', 'true');
  shiftConfigPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function closeShiftConfigPanel() {
  shiftConfigPanel.hidden = true;
  shiftConfigButton.setAttribute('aria-expanded', 'false');
}
function toggleShiftConfigPanel() {
  if (shiftConfigPanel.hidden) openShiftConfigPanel();
  else closeShiftConfigPanel();
}
function renderShiftConfigPanel() {
  const { year, month } = getCurrentYearMonth();
  shiftConfigGrid.innerHTML = '';
  for (let index = 0; index < names.length; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const row = document.createElement('div');
    row.className = 'shift-config-row';

    const person = document.createElement('span');
    person.className = 'shift-config-person';
    person.textContent = names[index] ? `${letter}. ${names[index]}` : `${letter}.`;

    const options = document.createElement('div');
    options.className = 'shift-config-options';
    options.setAttribute('aria-label', `${letter} 人員班別，可複選`);

    const current = getPersonnelShifts(year, month, letter);
    PERSONNEL_SHIFT_GROUPS.forEach((group) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'shift-config-option';
      button.setAttribute('aria-pressed', current.has(group.key) ? 'true' : 'false');
      button.setAttribute('aria-label', `${letter} ${group.label} ${group.detail}`);

      const label = document.createElement('strong');
      label.textContent = group.label;
      const detail = document.createElement('small');
      detail.textContent = group.detail;
      button.append(label, detail);

      button.addEventListener('click', () => {
        const next = button.getAttribute('aria-pressed') !== 'true';
        setPersonnelShift(year, month, letter, group.key, next);
        persistCurrentMonth();
        button.setAttribute('aria-pressed', next ? 'true' : 'false');
      });
      options.appendChild(button);
    });

    row.append(person, options);
    shiftConfigGrid.appendChild(row);
  }
}

function createLetterInput({ value = '', ariaLabel, onChange, className }) {
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 1;
  input.inputMode = 'text';
  input.pattern = '[A-Za-z]';
  input.value = value;
  input.className = className;
  input.autocomplete = 'off';
  input.autocapitalize = 'characters';
  input.spellcheck = false;
  input.setAttribute('aria-label', ariaLabel);
  input.addEventListener('input', () => {
    const cleaned = cleanEnglishLetter(input.value);
    if (input.value !== cleaned) input.value = cleaned;
    onChange(cleaned, input);
  });
  return input;
}

function restoreVacationEntry(key, inputElement, previousLetter, previousType) {
  if (previousLetter) rosterValues.set(key, previousLetter);
  else rosterValues.delete(key);
  if (previousType && previousType !== 'public') leaveTypeValues.set(key, previousType);
  else leaveTypeValues.delete(key);
  inputElement.value = previousLetter;
}

async function handleVacationChange({ year, month, day, key, letter, inputElement }) {
  const previousLetter = inputElement.dataset.previousValue || '';
  const previousType = inputElement.dataset.previousType || 'public';

  if (!letter) {
    rosterValues.delete(key);
    leaveTypeValues.delete(key);
    render();
    return;
  }

  if (hasShiftLetterForDay(year, month, day, letter)) {
    const choice = await showConflictChoice(`${month}/${day}　${letter} 已排班\n要以哪一種為準？`);
    if (choice === 'vacation') removeShiftLetterForDay(year, month, day, letter);
    else {
      restoreVacationEntry(key, inputElement, previousLetter, previousType);
      return;
    }
  }

  rosterValues.set(key, letter);
  if (previousLetter !== letter) leaveTypeValues.delete(key);

  if (isVacationBlocked(year, month, day)) {
    const blockedChoice = await showBlockedLeaveChoice(`${month}/${day} 為禁假日，${letter} 要如何處理？`);
    if (blockedChoice === 'exception') {
      setLeaveType(key, 'exceptionPublic');
    } else if (blockedChoice === 'formal') {
      setLeaveType(key, 'leave');
    } else {
      restoreVacationEntry(key, inputElement, previousLetter, previousType);
      render();
      return;
    }
  } else if (!leaveTypeValues.has(key)) {
    setLeaveType(key, 'public');
  }

  inputElement.dataset.previousValue = rosterValues.get(key) || '';
  inputElement.dataset.previousType = getLeaveType(key);
  render();
}

function renderBatchLeaveDates() {
  if (!batchLeaveLetter) return;
  const { year, month } = getCurrentYearMonth();
  const days = getDaysInMonth(year, month);

  batchLeaveDates.innerHTML = '';
  for (let day = 1; day <= days; day += 1) {
    const info = getDayInfo(year, month, day);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'batch-leave-date';
    button.dataset.day = String(day);
    button.setAttribute('aria-pressed', batchLeaveSelectedDays.has(day) ? 'true' : 'false');
    button.setAttribute('aria-label', `${month}月${day}日（${info.weekday}）`);

    const number = document.createElement('strong');
    number.textContent = String(day);
    const weekday = document.createElement('small');
    weekday.textContent = info.weekday;
    button.append(number, weekday);

    button.addEventListener('click', () => {
      if (batchLeaveSelectedDays.has(day)) {
        batchLeaveSelectedDays.delete(day);
        batchLeaveHint.textContent = '點日期可複選；特休／請假請回班表單格輸入。';
      } else {
        if (batchLeaveSelectedDays.size >= BATCH_PUBLIC_LEAVE_MAX) {
          batchLeaveHint.textContent = `最多只能選 ${BATCH_PUBLIC_LEAVE_MAX} 天。`;
          return;
        }
        batchLeaveSelectedDays.add(day);
        batchLeaveHint.textContent = '點日期可複選；特休／請假請回班表單格輸入。';
      }
      renderBatchLeaveDates();
    });

    batchLeaveDates.appendChild(button);
  }

  batchLeaveCount.textContent = `已選 ${batchLeaveSelectedDays.size} / ${BATCH_PUBLIC_LEAVE_MAX} 天`;
  batchLeaveApply.disabled = batchLeaveSelectedDays.size < 1 || batchLeaveSelectedDays.size > BATCH_PUBLIC_LEAVE_MAX;
}

function openBatchLeaveDialog(letter) {
  const { year, month } = getCurrentYearMonth();
  batchLeaveLetter = cleanEnglishLetter(letter);
  if (!batchLeaveLetter) return;

  closeRowFillPanel();
  closeShiftConfigPanel();
  batchLeaveSelectedDays = new Set(getPublicVacationDatesForLetter(year, month, batchLeaveLetter));
  batchLeaveFailedDays = [];
  batchLeaveMessage.textContent = `${batchLeaveLetter}｜${year} 年 ${month} 月批次排公休`;
  batchLeaveHint.textContent = batchLeaveSelectedDays.size > BATCH_PUBLIC_LEAVE_MAX
    ? `目前已有 ${batchLeaveSelectedDays.size} 天公休；批次最多 ${BATCH_PUBLIC_LEAVE_MAX} 天，請先取消日期。`
    : '點日期可複選；特休／請假請回班表單格輸入。';
  renderBatchLeaveDates();
  batchLeaveDialog.hidden = false;
  requestAnimationFrame(() => batchLeaveDates.querySelector('button[aria-pressed="true"], button')?.focus());
}

function closeBatchLeaveDialog() {
  batchLeaveDialog.hidden = true;
  batchLeaveLetter = null;
  batchLeaveSelectedDays = new Set();
}

function getBatchLeaveFailureText(month, failure) {
  const date = `${month}/${failure.day}`;
  if (failure.reason === 'full') {
    return `${date} 已有 ${failure.occupants.join('、')} 排休，所以 ${failure.letter} 未排進去。`;
  }
  if (failure.reason === 'shift') {
    return `${date} ${failure.letter} 已排班，所以未自動改成排休。`;
  }
  if (failure.reason === 'other-leave') {
    return `${date} ${failure.letter} 已有特休／請假，所以未改成公休。`;
  }
  return `${date} ${failure.letter} 未排進去。`;
}

function focusBatchLeaveFailure(day) {
  const cell = scheduleTable.querySelector(`.vacation-cell[data-day="${day}"]`);
  if (!cell) return;
  cell.classList.add('is-batch-leave-missed');
  cell.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  const input = cell.querySelector('.vacation-input');
  requestAnimationFrame(() => input?.focus({ preventScroll: true }));
  window.setTimeout(() => cell.classList.remove('is-batch-leave-missed'), 2200);
}

function closeBatchLeaveResult() {
  const firstFailure = batchLeaveFailedDays[0];
  batchLeaveResultDialog.hidden = true;
  if (firstFailure) focusBatchLeaveFailure(firstFailure.day);
  batchLeaveFailedDays = [];
}

function applyBatchLeave() {
  if (!batchLeaveLetter) return;
  if (batchLeaveSelectedDays.size < 1) {
    batchLeaveHint.textContent = '至少要選 1 天。';
    return;
  }
  if (batchLeaveSelectedDays.size > BATCH_PUBLIC_LEAVE_MAX) {
    batchLeaveHint.textContent = `最多只能選 ${BATCH_PUBLIC_LEAVE_MAX} 天。`;
    return;
  }

  const { year, month } = getCurrentYearMonth();
  const letter = batchLeaveLetter;
  const selected = new Set(batchLeaveSelectedDays);
  const days = getDaysInMonth(year, month);
  const failures = [];

  // 批次視為「這位員工的公休日期編輯器」：取消勾選時只移除公休／例外排休，
  // 不碰特休、請假等手動假別。
  for (let day = 1; day <= days; day += 1) {
    if (!selected.has(day)) removeBatchPublicVacationLetter(year, month, day, letter);
  }

  for (const day of [...selected].sort((a, b) => a - b)) {
    const entries = getVacationLettersForDay(year, month, day);
    const ownEntry = entries.find((entry) => entry.value === letter);

    if (ownEntry) {
      if (isBatchPublicLeaveType(ownEntry.type)) continue;
      failures.push({ day, letter, reason: 'other-leave' });
      continue;
    }

    if (hasShiftLetterForDay(year, month, day, letter)) {
      failures.push({ day, letter, reason: 'shift' });
      continue;
    }

    const occupied = entries.filter((entry) => entry.value);
    if (occupied.length >= 2) {
      failures.push({ day, letter, reason: 'full', occupants: occupied.map((entry) => entry.value) });
      continue;
    }

    const emptyEntry = entries.find((entry) => !entry.value);
    if (!emptyEntry) {
      failures.push({ day, letter, reason: 'full', occupants: occupied.map((entry) => entry.value) });
      continue;
    }

    rosterValues.set(emptyEntry.key, letter);
    setLeaveType(emptyEntry.key, 'public');
  }

  const requestedCount = selected.size;
  closeBatchLeaveDialog();
  render();

  if (failures.length) {
    batchLeaveFailedDays = failures;
    const actualCount = getPublicVacationDatesForLetter(year, month, letter).length;
    const details = failures.map((failure) => `・${getBatchLeaveFailureText(month, failure)}`).join('\n');
    batchLeaveResultMessage.textContent = `${letter} 批次排休完成 ${actualCount} / ${requestedCount} 天。\n\n${details}\n\n未排入的日期請回班表單獨調整，不用重選其他日期。`;
    batchLeaveResultDialog.hidden = false;
    requestAnimationFrame(() => batchLeaveResultClose.focus());
  }
}

function makeTimeNoteLines(letter, value) {
  const { start, end } = splitHourRange(value);
  if (!letter || !start || !end) return [];
  return [letter, start, '│', end];
}

function buildDayNotes(year, month, day) {
  const notes = [];

  for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex += 1) {
    const letter = rosterValues.get(makeRosterKey(year, month, day, 'shift', shiftIndex)) || '';
    if (!letter) continue;
    const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
    if (specialShiftCells.has(specialKey)) {
      const time = specialShiftTimes.get(specialKey);
      if (time) notes.push({ kind: 'time', lines: makeTimeNoteLines(letter, time) });
    }
    const grayTime = nightShiftTimes.get(makeNightShiftKey(year, month, day, shiftIndex));
    if (grayTime) notes.push({ kind: 'time', lines: makeTimeNoteLines(letter, grayTime) });
  }

  for (const entry of getVacationLettersForDay(year, month, day)) {
    if (!entry.value) continue;
    if (entry.type === 'annual') notes.push({ kind: 'leave', lines: [entry.value, '特', '休'] });
    if (isFormalLeaveType(entry.type)) notes.push({ kind: 'leave', lines: [entry.value, '請', '假'] });
  }

  if (meetingDays.has(makeMeetingDayKey(year, month, day))) {
    notes.push({ kind: 'meeting', lines: ['8', '點', '櫃', '檯', '開', '會'] });
  }

  return notes;
}

function renderSchedule(year, month) {
  const days = getDaysInMonth(year, month);
  scheduleTable.innerHTML = '';

  const colgroup = document.createElement('colgroup');
  appendDayColumns(colgroup, days);
  scheduleTable.appendChild(colgroup);

  const thead = document.createElement('thead');
  const dateRow = document.createElement('tr');
  const labelHead = document.createElement('th');
  labelHead.colSpan = 2;
  labelHead.className = 'header-label';
  labelHead.textContent = '日期';
  dateRow.appendChild(labelHead);
  for (let day = 1; day <= days; day += 1) {
    const th = document.createElement('th');
    th.className = `date-cell ${getDateBandClass(year, month, day)}`;
    th.textContent = day;
    dateRow.appendChild(th);
  }

  const weekdayRow = document.createElement('tr');
  const weekdayHead = document.createElement('th');
  weekdayHead.colSpan = 2;
  weekdayHead.className = 'header-label';
  weekdayHead.textContent = '星期';
  weekdayRow.appendChild(weekdayHead);
  for (let day = 1; day <= days; day += 1) {
    const info = getDayInfo(year, month, day);
    const th = document.createElement('th');
    th.className = `weekday-cell ${info.className}`.trim();
    th.textContent = info.weekday;
    weekdayRow.appendChild(th);
  }
  thead.append(dateRow, weekdayRow);
  scheduleTable.appendChild(thead);

  const tbody = document.createElement('tbody');

  shifts.forEach((shift, shiftIndex) => {
    const row = document.createElement('tr');
    const label = document.createElement('th');
    label.className = 'shift-label';
    label.textContent = shift.label;
    label.title = '點一下可整列填入同一個英文字母';
    label.tabIndex = 0;
    label.setAttribute('role', 'button');
    label.setAttribute('aria-label', `${shift.label} 整列填入`);
    label.addEventListener('click', () => openRowFillPanel(shiftIndex));
    label.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openRowFillPanel(shiftIndex);
      }
    });
    row.appendChild(label);

    const code = document.createElement('td');
    code.className = 'shift-code';
    code.textContent = shift.groupLabel;
    row.appendChild(code);

    for (let day = 1; day <= days; day += 1) {
      const td = document.createElement('td');
      td.className = 'shift-cell';
      td.dataset.shiftIndex = String(shiftIndex);
      td.dataset.day = String(day);
      td.classList.toggle('is-night-gray', isNightGray(year, month, day, shiftIndex));

      const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
      td.classList.toggle('is-special', specialShiftCells.has(specialKey));

      const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
      const input = createLetterInput({
        value: rosterValues.get(key) || '',
        ariaLabel: `${month}月${day}日 ${shift.label} 班別`,
        className: 'shift-input',
        onChange: async (letter, inputElement) => {
          const previous = rosterValues.get(key) || '';
          if (!letter) {
            rosterValues.delete(key);
            specialShiftCells.delete(specialKey);
            specialShiftTimes.delete(specialKey);
            nightShiftTimes.delete(makeNightShiftKey(year, month, day, shiftIndex));
            renderLower(year, month);
            return;
          }

          if (hasVacationLetter(year, month, day, letter)) {
            const choice = await showConflictChoice(`${month}/${day}　${letter} 已排休\n要以哪一種為準？`);
            if (choice === 'schedule') {
              removeVacationLetter(year, month, day, letter);
              rosterValues.set(key, letter);
              render();
            } else inputElement.value = previous;
            return;
          }
          rosterValues.set(key, letter);
          renderLower(year, month);
        }
      });
      td.appendChild(input);

      td.addEventListener('click', (event) => {
        if (nightModeEnabled) {
          event.preventDefault();
          if (isNightGray(year, month, day, shiftIndex)) {
            setNightGrayState(year, month, day, shiftIndex, false);
            nightShiftTimes.delete(makeNightShiftKey(year, month, day, shiftIndex));
            render();
          } else {
            openNightTimeDialog(year, month, day, shiftIndex);
          }
          return;
        }
        if (specialModeEnabled) {
          event.preventDefault();
          if (specialShiftCells.has(specialKey)) {
            specialShiftCells.delete(specialKey);
            specialShiftTimes.delete(specialKey);
            render();
          } else {
            openSpecialTimeDialog(year, month, day, shiftIndex);
          }
        }
      });
      row.appendChild(td);
    }
    tbody.appendChild(row);
  });

  const vacationRow = document.createElement('tr');
  const vacationLabel = document.createElement('th');
  vacationLabel.colSpan = 2;
  vacationLabel.className = 'vacation-label';
  vacationLabel.textContent = '休 假';
  vacationRow.appendChild(vacationLabel);

  for (let day = 1; day <= days; day += 1) {
    const info = getDayInfo(year, month, day);
    const td = document.createElement('td');
    td.className = `vacation-cell ${info.className}`.trim();
    td.dataset.day = String(day);

    const miniWeekday = document.createElement('span');
    miniWeekday.className = 'mini-weekday';
    miniWeekday.textContent = info.weekday;

    const inputs = document.createElement('div');
    inputs.className = 'vacation-inputs';
    inputs.classList.toggle('is-blocked', isVacationBlocked(year, month, day));

    for (let slot = 0; slot < 2; slot += 1) {
      const key = makeRosterKey(year, month, day, 'vacation', slot);
      const currentValue = rosterValues.get(key) || '';
      const currentType = getLeaveType(key);
      const input = createLetterInput({
        value: currentValue,
        ariaLabel: `${month}月${day}日 休假第${slot + 1}格`,
        className: 'vacation-input',
        onChange: async (letter, inputElement) => {
          await handleVacationChange({ year, month, day, key, letter, inputElement });
        }
      });
      input.dataset.previousValue = currentValue;
      input.dataset.previousType = currentType;
      input.dataset.leaveKey = key;
      input.classList.toggle('is-formal-leave', isFormalLeaveType(currentType));
      input.title = currentValue ? `${LEAVE_TYPE_LABELS[currentType] || '公休'}；假別模式可修改` : '';

      input.addEventListener('pointerdown', (event) => {
        if (!leaveTypeModeEnabled) return;
        event.preventDefault();
      });
      input.addEventListener('click', async (event) => {
        if (!leaveTypeModeEnabled) return;
        event.preventDefault();
        event.stopPropagation();
        const letter = rosterValues.get(key) || '';
        if (!letter) {
          window.alert('請先在休假格填入員工代號，再設定假別。');
          return;
        }
        const type = await showLeaveTypeChoice({ message: `${month}/${day}　${letter} 請選擇假別` });
        if (!type) return;
        setLeaveType(key, type);
        render();
      });
      inputs.appendChild(input);
    }

    const inner = document.createElement('div');
    inner.className = 'vacation-cell-inner';
    inner.append(miniWeekday, inputs);
    td.appendChild(inner);

    td.addEventListener('click', (event) => {
      if (!blockModeEnabled) return;
      event.preventDefault();
      const nextBlockedState = !isVacationBlocked(year, month, day);
      setVacationBlockedState(year, month, day, nextBlockedState);
      persistCurrentMonth();
      inputs.classList.toggle('is-blocked', nextBlockedState);
    });
    vacationRow.appendChild(td);
  }

  tbody.appendChild(vacationRow);
  scheduleTable.appendChild(tbody);
}

function renderLower(year, month) {
  const days = getDaysInMonth(year, month);
  lowerTable.innerHTML = '';

  const colgroup = document.createElement('colgroup');
  appendDayColumns(colgroup, days);
  lowerTable.appendChild(colgroup);

  const tbody = document.createElement('tbody');
  const mainRow = document.createElement('tr');

  const namesCell = document.createElement('td');
  namesCell.className = 'names-cell lower-main-cell';
  const namesPanel = document.createElement('div');
  namesPanel.className = 'names-panel';

  names.forEach((name, index) => {
    const row = document.createElement('div');
    row.className = 'name-row';
    const personLetter = String.fromCharCode(65 + index);
    const letter = document.createElement('button');
    letter.type = 'button';
    letter.className = 'name-letter';
    letter.textContent = `${personLetter}.`;
    letter.setAttribute('aria-label', `${personLetter} 批次排公休`);
    letter.title = `${personLetter} 批次排公休`;
    letter.addEventListener('click', () => openBatchLeaveDialog(personLetter));

    const input = document.createElement('input');
    input.className = 'name-input';
    input.type = 'text';
    input.value = name;
    input.dataset.index = index;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `${String.fromCharCode(65 + index)} 姓名`);
    input.addEventListener('compositionstart', () => { input.dataset.composing = 'true'; });
    input.addEventListener('compositionend', (event) => {
      input.dataset.composing = 'false';
      handleNameInput(event);
    });
    input.addEventListener('input', handleNameInput);
    input.addEventListener('blur', handleNameCommit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      }
    });

    const leaveInput = document.createElement('input');
    leaveInput.className = 'special-leave-input';
    leaveInput.type = 'text';
    leaveInput.inputMode = 'numeric';
    leaveInput.maxLength = 2;
    leaveInput.value = specialLeaveValues[index];
    leaveInput.dataset.index = index;
    leaveInput.autocomplete = 'off';
    leaveInput.setAttribute('aria-label', `${String.fromCharCode(65 + index)} 特休天數`);
    leaveInput.addEventListener('input', handleSpecialLeaveInput);

    row.append(letter, input, leaveInput);
    namesPanel.appendChild(row);
  });

  namesCell.appendChild(namesPanel);
  mainRow.appendChild(namesCell);

  const lowerCodeCell = document.createElement('td');
  lowerCodeCell.className = 'lower-code-cell';
  mainRow.appendChild(lowerCodeCell);

  for (let day = 1; day <= days; day += 1) {
    const td = document.createElement('td');
    td.className = 'day-blank';
    td.dataset.day = String(day);
    td.setAttribute('aria-label', `${month}月${day}日備註`);

    const notes = buildDayNotes(year, month, day);
    if (notes.length) {
      const stack = document.createElement('div');
      stack.className = 'day-note-stack';
      notes.forEach((note) => {
        const noteEl = document.createElement('div');
        noteEl.className = `day-note day-note-${note.kind}`;
        note.lines.forEach((line) => {
          const span = document.createElement('span');
          span.className = 'day-note-line';
          if (note.kind === 'time' && line === '│') span.classList.add('day-note-time-separator');
          span.textContent = line;
          noteEl.appendChild(span);
        });
        stack.appendChild(noteEl);
      });
      td.appendChild(stack);
    }

    td.addEventListener('click', (event) => {
      if (!meetingModeEnabled) return;
      event.preventDefault();
      const key = makeMeetingDayKey(year, month, day);
      if (meetingDays.has(key)) meetingDays.delete(key);
      else meetingDays.add(key);
      renderLower(year, month);
    });
    mainRow.appendChild(td);
  }

  const dateRow = document.createElement('tr');
  const blank = document.createElement('td');
  blank.colSpan = 2;
  blank.className = 'lower-date-label';
  dateRow.appendChild(blank);

  for (let day = 1; day <= days; day += 1) {
    const info = getDayInfo(year, month, day);
    const td = document.createElement('td');
    td.className = `lower-date-label ${info.className}`.trim();
    td.textContent = day;
    dateRow.appendChild(td);
  }

  tbody.append(mainRow, dateRow);
  lowerTable.appendChild(tbody);
  persistCurrentMonth();
}

function renderSummary() {
  summaryGrid.innerHTML = '';
  names.forEach((name, index) => {
    const item = document.createElement('div');
    item.className = 'summary-item';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'summary-name';
    nameSpan.textContent = name || `${String.fromCharCode(65 + index)}.`;
    const publicLeave = document.createElement('span');
    publicLeave.className = 'summary-count';
    publicLeave.textContent = `公休：${publicLeaveCount}`;
    const specialLeave = document.createElement('span');
    specialLeave.className = 'summary-count';
    specialLeave.textContent = `特休：${specialLeaveValues[index]}`;
    item.append(nameSpan, publicLeave, specialLeave);
    summaryGrid.appendChild(item);
  });
}

function handleNameInput(event) {
  const index = Number(event.target.dataset.index);
  if (event.target.dataset.composing === 'true') {
    names[index] = trimDisplayName(event.target.value);
    persistCurrentMonth();
    return;
  }
  const cleaned = trimDisplayName(event.target.value);
  names[index] = cleaned;
  if (event.target.value !== cleaned) event.target.value = cleaned;
  persistCurrentMonth();
  renderSummary();
  if (!shiftConfigPanel.hidden) renderShiftConfigPanel();
}
function handleNameCommit(event) {
  if (event.target.dataset.composing === 'true') return;
  handleNameInput(event);
  commitNameAtIndex(Number(event.target.dataset.index));
}
function handleSpecialLeaveInput(event) {
  const index = Number(event.target.dataset.index);
  const cleaned = cleanTwoDigits(event.target.value);
  specialLeaveValues[index] = cleaned;
  if (event.target.value !== cleaned) event.target.value = cleaned;
  persistCurrentMonth();
  renderSummary();
}
function handlePublicLeaveInput() {
  const cleaned = cleanTwoDigits(publicLeaveInput.textContent);
  publicLeaveCount = cleaned;
  if (publicLeaveInput.textContent !== cleaned) {
    publicLeaveInput.textContent = cleaned;
    const selection = window.getSelection();
    if (selection) {
      selection.selectAllChildren(publicLeaveInput);
      selection.collapseToEnd();
    }
  }
  renderSummary();
  renderRuleSettingsPage();
  persistGlobalSettings();
}

function getActiveLettersForCurrentMonth() {
  const model = buildRuleModel();
  return window.ShiftRosterRules?.getActiveLetters(model) || [];
}
function getPublicVacationDatesForLetter(year, month, letter) {
  const dates = [];
  const days = getDaysInMonth(year, month);
  for (let day = 1; day <= days; day += 1) {
    const match = getVacationLettersForDay(year, month, day).some((entry) => {
      if (entry.value !== letter) return false;
      return window.ShiftRosterRules?.isPublicLeaveType(entry.type) ?? ['public', 'exceptionPublic'].includes(entry.type);
    });
    if (match) dates.push(day);
  }
  return dates;
}
function buildLeaveCheckItems() {
  const { year, month } = getCurrentYearMonth();
  const target = Number.parseInt(publicLeaveCount || '8', 10) || 8;
  const items = [];
  const activeLetters = getActiveLettersForCurrentMonth();
  for (const letter of activeLetters) {
    const index = letter.charCodeAt(0) - 65;
    if (index < 0 || index >= 6) continue;
    const dates = getPublicVacationDatesForLetter(year, month, letter);
    if (dates.length === target) continue;
    items.push({ year, month, target, index, letter, name: names[index] || '', dates });
  }
  return items;
}
function formatLeaveCheckMessage(item) {
  const person = item.name ? `${item.letter} ${item.name}` : item.letter;
  const dateText = item.dates.length ? item.dates.map((day) => `${item.month}/${day}`).join('、') : '無';
  const difference = item.dates.length - item.target;
  const differenceText = difference < 0 ? `少 ${Math.abs(difference)} 天` : `多 ${difference} 天`;
  return `${person} 已排公休 ${item.dates.length} 天（應排 ${item.target} 天，${differenceText}）\n公休日期：${dateText}\n\n特休／請假不計入這 ${item.target} 天。\n此排假是否正確？`;
}
function showLeaveCheckItem() {
  const item = leaveCheckItems[leaveCheckIndex];
  if (!item) {
    leaveCheckCompleteMode = true;
    leaveCheckMessage.textContent = leaveCheckItems.length ? '排假檢查完成。' : '排假檢查完成：目前有效員工的公休天數都符合設定。';
    leaveCheckCorrect.textContent = '完成';
    leaveCheckIncorrect.hidden = true;
    leaveCheckActions.classList.add('is-single');
    leaveCheckDialog.hidden = false;
    requestAnimationFrame(() => leaveCheckCorrect.focus());
    return;
  }
  leaveCheckCompleteMode = false;
  leaveCheckCorrect.textContent = '正確';
  leaveCheckIncorrect.hidden = false;
  leaveCheckActions.classList.remove('is-single');
  leaveCheckMessage.textContent = `${leaveCheckIndex + 1}/${leaveCheckItems.length}\n${formatLeaveCheckMessage(item)}`;
  leaveCheckDialog.hidden = false;
  requestAnimationFrame(() => leaveCheckCorrect.focus());
}
function startLeaveCheck() {
  closeRowFillPanel();
  closeShiftConfigPanel();
  leaveCheckItems = buildLeaveCheckItems();
  leaveCheckIndex = 0;
  showLeaveCheckItem();
}
function handleLeaveCheckCorrect() {
  if (leaveCheckCompleteMode) {
    leaveCheckDialog.hidden = true;
    leaveCheckActions.classList.remove('is-single');
    leaveCheckCompleteMode = false;
    leaveCheckItems = [];
    leaveCheckIndex = 0;
    return;
  }
  leaveCheckIndex += 1;
  showLeaveCheckItem();
}
function handleLeaveCheckIncorrect() {
  leaveCheckDialog.hidden = true;
  leaveCheckActions.classList.remove('is-single');
  leaveCheckCompleteMode = false;
  leaveCheckItems = [];
  leaveCheckIndex = 0;
}

function getStoredRosterValue(monthData, day, type, index) {
  return String(monthData?.rosterValues?.[`${day}-${type}-${index}`] || '');
}

function getStoredActualRange(monthData, year, month, day, shiftIndex) {
  const specialKey = `${day}-shift-${shiftIndex}`;
  if (Array.isArray(monthData?.specialShiftCells) && monthData.specialShiftCells.includes(specialKey)) {
    return monthData?.specialShiftTimes?.[specialKey] || null;
  }

  const nightKey = `${day}-night-${shiftIndex}`;
  const legacyNightKey = shiftIndex === 3 ? `${day}-night` : '';
  const defaultGray = shiftIndex === 3 && getDayInfo(year, month, day).weekdayIndex === 6;
  const overrides = monthData?.nightShiftOverrides || {};
  const times = monthData?.nightShiftTimes || {};
  const hasNewOverride = Object.prototype.hasOwnProperty.call(overrides, nightKey);
  const hasLegacyOverride = Boolean(legacyNightKey) && Object.prototype.hasOwnProperty.call(overrides, legacyNightKey);
  const gray = hasNewOverride
    ? Boolean(overrides[nightKey])
    : (hasLegacyOverride ? Boolean(overrides[legacyNightKey]) : defaultGray);

  if (gray) {
    const grayTime = times[nightKey] || (legacyNightKey ? times[legacyNightKey] : '');
    if (grayTime) return grayTime;
    if (shiftIndex === 3) return normalNightRange || '22~06';
  }

  return shifts[shiftIndex]?.label.replace(/\s+/g, '') || null;
}

function getStoredDayStatus(monthData, year, month, day, letter) {
  const workIntervals = [];
  for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex += 1) {
    if (getStoredRosterValue(monthData, day, 'shift', shiftIndex) !== letter) continue;
    const rangeText = getStoredActualRange(monthData, year, month, day, shiftIndex);
    if (rangeText) workIntervals.push({ year, month, day, shiftIndex, rangeText });
  }
  if (workIntervals.length) return { status: 'work', workIntervals };

  for (let slot = 0; slot < 2; slot += 1) {
    if (getStoredRosterValue(monthData, day, 'vacation', slot) === letter) {
      return { status: 'leave', workIntervals: [] };
    }
  }
  return { status: 'unknown', workIntervals: [] };
}

function getPreviousMonthHistory(letter) {
  const index = String(letter || '').charCodeAt(0) - 65;
  const employeeId = index >= 0 && index < employeeIds.length ? employeeIds[index] : '';
  const { year, month } = getCurrentYearMonth();
  const previous = storage?.getPreviousYearMonth(year, month) || (() => {
    const date = new Date(year, month - 2, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  })();
  const monthData = storage?.getMonth(previous.year, previous.month) || null;

  if (!employeeId) {
    return { employeeId: '', monthMissing: false, employeeFound: false, incomplete: false, carryWorkDays: 0, carryStart: null, previousWorkIntervals: [], restGapKnown: true };
  }
  if (!monthData) {
    return { employeeId, monthMissing: true, employeeFound: false, incomplete: true, carryWorkDays: 0, carryStart: null, previousWorkIntervals: [], restGapKnown: false };
  }

  let previousLetter = '';
  for (const [candidateLetter, person] of Object.entries(monthData.people || {})) {
    if (person?.employeeId === employeeId) {
      previousLetter = candidateLetter;
      break;
    }
  }
  if (!previousLetter) {
    return { employeeId, monthMissing: false, employeeFound: false, incomplete: false, carryWorkDays: 0, carryStart: null, previousWorkIntervals: [], restGapKnown: true };
  }

  const previousDays = getDaysInMonth(previous.year, previous.month);
  const maxLookback = Math.max(1, Number(maxConsecutiveWorkDays) || 6);
  let carryWorkDays = 0;
  let carryStart = null;
  let incomplete = false;

  for (let offset = 0; offset < maxLookback; offset += 1) {
    const day = previousDays - offset;
    if (day < 1) break;
    const info = getStoredDayStatus(monthData, previous.year, previous.month, day, previousLetter);
    if (info.status === 'work') {
      carryWorkDays += 1;
      carryStart = { year: previous.year, month: previous.month, day };
      continue;
    }
    if (info.status === 'leave') break;
    incomplete = true;
    break;
  }

  const lastDayInfo = getStoredDayStatus(monthData, previous.year, previous.month, previousDays, previousLetter);
  if (lastDayInfo.status === 'unknown') incomplete = true;

  return {
    employeeId,
    previousLetter,
    monthMissing: false,
    employeeFound: true,
    incomplete,
    carryWorkDays,
    carryStart,
    restGapKnown: lastDayInfo.status !== 'unknown',
    previousWorkIntervals: lastDayInfo.status === 'work' ? lastDayInfo.workIntervals : []
  };
}

function buildRuleModel() {
  const { year, month } = getCurrentYearMonth();
  const days = getDaysInMonth(year, month);
  return {
    year,
    month,
    days,
    shifts,
    settings: {
      maxConsecutiveDays: maxConsecutiveWorkDays,
      minTurnaroundHours,
      normalNightRange
    },
    employees: names.map((name, index) => {
      const letter = String.fromCharCode(65 + index);
      return { letter, name, employeeId: employeeIds[index] || '', shiftGroups: [...getPersonnelShifts(year, month, letter)] };
    }),
    previousMonth: storage?.getPreviousYearMonth(year, month) || null,
    previousMonthExists: storage ? Boolean(storage.getMonth((storage.getPreviousYearMonth(year, month)).year, (storage.getPreviousYearMonth(year, month)).month)) : false,
    getPreviousMonthHistory,
    getShiftLetter(day, shiftIndex) {
      return rosterValues.get(makeRosterKey(year, month, day, 'shift', shiftIndex)) || '';
    },
    getLeaveEntries(day) {
      return getVacationLettersForDay(year, month, day)
        .filter((entry) => entry.value)
        .map((entry) => ({ letter: entry.value, type: entry.type, slot: entry.slot }));
    },
    isBlocked(day) {
      return isVacationBlocked(year, month, day);
    },
    isSpecial(day, shiftIndex) {
      return specialShiftCells.has(makeSpecialShiftKey(year, month, day, shiftIndex));
    },
    getSpecialTime(day, shiftIndex) {
      return specialShiftTimes.get(makeSpecialShiftKey(year, month, day, shiftIndex)) || '';
    },
    isNightGray(day, shiftIndex) {
      return isNightGray(year, month, day, shiftIndex);
    },
    getNightTime(day, shiftIndex) {
      return nightShiftTimes.get(makeNightShiftKey(year, month, day, shiftIndex)) || '';
    }
  };
}
function startRuleCheck() {
  commitAllVisibleNames();
  persistCurrentMonth();
  closeRowFillPanel();
  closeShiftConfigPanel();
  if (!window.ShiftRosterRules) {
    window.alert('規則模組未載入。');
    return;
  }
  ruleCheckItems = window.ShiftRosterRules.collectIssues(buildRuleModel());
  ruleCheckIndex = 0;
  showRuleCheckItem();
}
function showRuleCheckItem() {
  const item = ruleCheckItems[ruleCheckIndex];
  if (!item) {
    ruleCheckCompleteMode = true;
    ruleCheckMessage.textContent = ruleCheckItems.length ? '規則檢查完成。' : '規則檢查完成：目前沒有發現需要確認的項目。';
    ruleCheckException.textContent = '完成';
    ruleCheckBack.hidden = true;
    ruleCheckDialog.hidden = false;
    requestAnimationFrame(() => ruleCheckException.focus());
    return;
  }
  ruleCheckCompleteMode = false;
  ruleCheckException.textContent = '例外安排';
  ruleCheckBack.hidden = false;
  ruleCheckMessage.textContent = `${ruleCheckIndex + 1}/${ruleCheckItems.length}　${item.title}\n\n${item.message}`;
  ruleCheckDialog.hidden = false;
  requestAnimationFrame(() => ruleCheckException.focus());
}
function handleRuleCheckException() {
  if (ruleCheckCompleteMode) {
    ruleCheckDialog.hidden = true;
    ruleCheckCompleteMode = false;
    ruleCheckItems = [];
    ruleCheckIndex = 0;
    return;
  }
  ruleCheckIndex += 1;
  showRuleCheckItem();
}
function handleRuleCheckBack() {
  ruleCheckDialog.hidden = true;
  ruleCheckCompleteMode = false;
  ruleCheckItems = [];
  ruleCheckIndex = 0;
}

function formatOutputTimestamp(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${hh}:${mm}`;
}
function requestOutputTimeChoice() {
  if (outputTimeResolver) outputTimeResolver(false);
  outputTimeDialog.hidden = false;
  return new Promise((resolve) => {
    outputTimeResolver = resolve;
    requestAnimationFrame(() => outputTimeYes.focus());
  });
}
function resolveOutputTimeChoice(includeTime) {
  if (!outputTimeResolver) return;
  const resolve = outputTimeResolver;
  outputTimeResolver = null;
  outputTimeDialog.hidden = true;
  resolve(Boolean(includeTime));
}
async function prepareOutputTimestamp() {
  const includeTime = await requestOutputTimeChoice();
  if (includeTime) {
    outputTimestamp.textContent = formatOutputTimestamp();
    outputTimestamp.hidden = false;
  } else {
    outputTimestamp.textContent = '';
    outputTimestamp.hidden = true;
  }
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return () => {
    outputTimestamp.textContent = '';
    outputTimestamp.hidden = true;
  };
}

function render() {
  let year = Number(yearInput.value);
  let month = Number(monthSelect.value);
  const fallback = getDefaultNextYearMonth();
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    year = fallback.year;
    yearInput.value = year;
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    month = fallback.month;
    monthSelect.value = month;
  }
  titleYear.textContent = year;
  titleMonth.textContent = month;
  renderSchedule(year, month);
  renderLower(year, month);
  renderSummary();
  if (!shiftConfigPanel.hidden) renderShiftConfigPanel();
}
function changeMonth(offset) {
  commitAllVisibleNames();
  persistCurrentMonth();
  let year = Number(yearInput.value);
  let month = Number(monthSelect.value) + offset;
  if (month < 1) {
    month = 12;
    year -= 1;
  } else if (month > 12) {
    month = 1;
    year += 1;
  }
  if (year < 2000 || year > 2100) return;
  yearInput.value = year;
  monthSelect.value = month;
  closeRowFillPanel();
  closeShiftConfigPanel();
  loadMonth(year, month);
  render();
}

// ===== 事件 =====
rosterViewTab.addEventListener('click', () => setMainView('roster'));
rulesViewTab.addEventListener('click', () => setMainView('rules'));
editRuleSettingsButton.addEventListener('click', openRuleSettingsEditor);
ruleSettingsCancel.addEventListener('click', closeRuleSettingsEditor);
ruleSettingsApply.addEventListener('click', applyRuleSettings);

yearInput.addEventListener('change', () => {
  const year = Number(yearInput.value);
  const month = Number(monthSelect.value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return render();
  closeRowFillPanel();
  closeShiftConfigPanel();
  loadMonth(year, month);
  render();
});
monthSelect.addEventListener('change', () => {
  const { year, month } = getCurrentYearMonth();
  closeRowFillPanel();
  closeShiftConfigPanel();
  loadMonth(year, month);
  render();
});
prevMonthButton.addEventListener('click', () => changeMonth(-1));
nextMonthButton.addEventListener('click', () => changeMonth(1));
blockModeButton.addEventListener('click', () => setBlockMode(!blockModeEnabled));
specialModeButton.addEventListener('click', () => setSpecialMode(!specialModeEnabled));
nightModeButton.addEventListener('click', () => setNightMode(!nightModeEnabled));
leaveTypeModeButton.addEventListener('click', () => setLeaveTypeMode(!leaveTypeModeEnabled));
meetingModeButton.addEventListener('click', () => setMeetingMode(!meetingModeEnabled));
shiftConfigButton.addEventListener('click', toggleShiftConfigPanel);
shiftConfigClose.addEventListener('click', closeShiftConfigPanel);
leaveCheckButton.addEventListener('click', startLeaveCheck);
ruleCheckButton.addEventListener('click', startRuleCheck);
batchLeaveApply.addEventListener('click', applyBatchLeave);
batchLeaveCancel.addEventListener('click', closeBatchLeaveDialog);
batchLeaveResultClose.addEventListener('click', closeBatchLeaveResult);
clearMonthButton.addEventListener('click', openClearMonthDialog);
printButton.addEventListener('click', async () => {
  const cleanup = await prepareOutputTimestamp();
  try {
    window.print();
  } finally {
    cleanup();
  }
});

conflictChooseSchedule.addEventListener('click', () => resolveConflictChoice('schedule'));
conflictChooseVacation.addEventListener('click', () => resolveConflictChoice('vacation'));
blockedLeaveException.addEventListener('click', () => resolveBlockedLeaveChoice('exception'));
blockedLeaveFormal.addEventListener('click', () => resolveBlockedLeaveChoice('formal'));
blockedLeaveBack.addEventListener('click', () => resolveBlockedLeaveChoice('back'));
leaveTypeChoices.addEventListener('click', (event) => {
  const button = event.target.closest('[data-leave-type]');
  if (button) resolveLeaveTypeChoice(button.dataset.leaveType);
});
leaveTypeCancel.addEventListener('click', () => resolveLeaveTypeChoice(null));

specialTimeApply.addEventListener('click', applySpecialTime);
specialTimeRemove.addEventListener('click', removeSpecialTime);
specialTimeBack.addEventListener('click', closeSpecialTimeDialog);
nightTimeApply.addEventListener('click', applyNightTime);
nightTimeRemove.addEventListener('click', removeNight);
nightTimeBack.addEventListener('click', closeNightTimeDialog);

leaveCheckCorrect.addEventListener('click', handleLeaveCheckCorrect);
leaveCheckIncorrect.addEventListener('click', handleLeaveCheckIncorrect);
ruleCheckException.addEventListener('click', handleRuleCheckException);
ruleCheckBack.addEventListener('click', handleRuleCheckBack);
clearMonthCancel.addEventListener('click', closeClearMonthDialog);
clearMonthConfirm.addEventListener('click', clearCurrentMonth);
outputTimeYes.addEventListener('click', () => resolveOutputTimeChoice(true));
outputTimeNo.addEventListener('click', () => resolveOutputTimeChoice(false));

rowFillClose.addEventListener('click', closeRowFillPanel);
rowFillClearRow.addEventListener('click', () => {
  if (selectedRowFillShiftIndex != null) applyLetterToShiftRow(selectedRowFillShiftIndex, '');
});
publicLeaveInput.addEventListener('input', handlePublicLeaveInput);
publicLeaveInput.addEventListener('blur', () => {
  if (!publicLeaveCount) {
    publicLeaveCount = '8';
    publicLeaveInput.textContent = publicLeaveCount;
    renderSummary();
    renderRuleSettingsPage();
    persistGlobalSettings();
  }
});

bindHourPair(specialTimeStartInput, specialTimeEndInput, applySpecialTime);
bindHourPair(nightTimeStartInput, nightTimeEndInput, applyNightTime);
bindHourPair(ruleNightStartInput, ruleNightEndInput, applyRuleSettings);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!ruleSettingsEditor.hidden) return closeRuleSettingsEditor();
  if (!outputTimeDialog.hidden) return resolveOutputTimeChoice(false);
  if (!batchLeaveResultDialog.hidden) return closeBatchLeaveResult();
  if (!batchLeaveDialog.hidden) return closeBatchLeaveDialog();
  if (!leaveTypeDialog.hidden) return resolveLeaveTypeChoice(null);
  if (!blockedLeaveDialog.hidden) return resolveBlockedLeaveChoice('back');
  if (!specialTimeDialog.hidden) return closeSpecialTimeDialog();
  if (!nightTimeDialog.hidden) return closeNightTimeDialog();
  if (!clearMonthDialog.hidden) return closeClearMonthDialog();
  if (!leaveCheckDialog.hidden) return handleLeaveCheckIncorrect();
  if (!ruleCheckDialog.hidden) return handleRuleCheckBack();
  if (!rowFillBar.hidden) return closeRowFillPanel();
  if (!shiftConfigPanel.hidden) return closeShiftConfigPanel();
});

window.ShiftRosterOutput = Object.freeze({
  prepare: prepareOutputTimestamp,
  formatTimestamp: formatOutputTimestamp
});

window.ShiftRosterApp = Object.freeze({
  saveCurrentMonth: () => {
    commitAllVisibleNames();
    persistCurrentMonth();
    persistGlobalSettings();
  },
  reloadFromStorage: () => {
    loadGlobalSettings();
    publicLeaveInput.textContent = publicLeaveCount;
    const { year, month } = getCurrentYearMonth();
    loadMonth(year, month);
    render();
    renderRuleSettingsPage();
  },
  getCurrentYearMonth
});

loadGlobalSettings();
persistGlobalSettings();
const initialMonth = getDefaultNextYearMonth();
yearInput.value = initialMonth.year;
monthSelect.value = String(initialMonth.month);
publicLeaveInput.textContent = publicLeaveCount;
loadMonth(initialMonth.year, initialMonth.month);
buildRowFillQuickLetters();
render();
renderRuleSettingsPage();

if (storage && !storage.isPersistent()) {
  window.setTimeout(() => {
    window.alert('目前瀏覽器無法使用本機自動保存。班表仍可操作，但重新整理後資料可能消失；請使用「下載 JSON」備份。');
  }, 0);
}
