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
const nightTimeNormal = document.getElementById('nightTimeNormal');
const nightTimeSpecial = document.getElementById('nightTimeSpecial');
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
  { label: '07 ~ 15', code: '10' },
  { label: '15 ~ 23', code: '11' },
  { label: '16 ~ 24', code: '12' },
  { label: '23 ~ 07', code: '16' },
  { label: '00 ~ 08', code: '17' }
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

// ===== 目前先用前端記憶體保存；未來接資料庫時可從這一層搬出去。 =====
const names = Array(6).fill('');
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
const primaryShiftValues = new Map();

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

for (let month = 1; month <= 12; month += 1) {
  const option = document.createElement('option');
  option.value = month;
  option.textContent = `${month} 月`;
  monthSelect.appendChild(option);
}
monthSelect.value = '11';

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
    window.alert('一般大夜時間請分別輸入開始與結束小時，例如 22、06。');
    return;
  }

  publicLeaveCount = String(nextPublicLeave);
  maxConsecutiveWorkDays = nextConsecutive;
  minTurnaroundHours = nextTurnaround;
  normalNightRange = nextNight;
  publicLeaveInput.textContent = publicLeaveCount;
  renderSummary();
  renderRuleSettingsPage();
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
function makeNightShiftKey(year, month, day) {
  return `${year}-${month}-${day}-night`;
}
function makeMeetingDayKey(year, month, day) {
  return `${year}-${month}-${day}-meeting`;
}
function makePrimaryShiftKey(year, month, letter) {
  return `${year}-${month}-${letter}-primary`;
}

function getCurrentYearMonth() {
  return { year: Number(yearInput.value), month: Number(monthSelect.value) };
}

function cleanEnglishLetter(value) {
  return String(value || '').toUpperCase().replace(/[^A-E]/g, '').slice(0, 1);
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
  if (shiftIndex !== 3) return false;
  const key = makeNightShiftKey(year, month, day);
  return nightShiftOverrides.has(key) ? nightShiftOverrides.get(key) : getDefaultNightGrayState(year, month, day, shiftIndex);
}
function setNightGrayState(year, month, day, shiftIndex, enabled) {
  if (shiftIndex !== 3) return;
  const key = makeNightShiftKey(year, month, day);
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
    if (entry.shiftIndex === 3) nightShiftTimes.delete(makeNightShiftKey(year, month, day));
  });
}

function getPrimaryShift(year, month, letter) {
  return primaryShiftValues.get(makePrimaryShiftKey(year, month, letter)) ?? '';
}
function setPrimaryShift(year, month, letter, shiftIndex) {
  const key = makePrimaryShiftKey(year, month, letter);
  if (shiftIndex === '' || shiftIndex == null) primaryShiftValues.delete(key);
  else primaryShiftValues.set(key, Number(shiftIndex));
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
  if (shiftIndex !== 3) return;
  const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
  const letter = rosterValues.get(key) || '';
  nightTimeContext = { year, month, day, shiftIndex, key, letter };
  nightTimeMessage.textContent = `${month}/${day}${letter ? `　${letter}` : ''}　大夜設定`;
  fillHourPair(nightTimeStartInput, nightTimeEndInput, nightShiftTimes.get(makeNightShiftKey(year, month, day)) || '');
  nightTimeDialog.hidden = false;
  requestAnimationFrame(() => nightTimeNormal.focus());
}
function closeNightTimeDialog() {
  nightTimeDialog.hidden = true;
  nightTimeContext = null;
}
function setNormalNight() {
  if (!nightTimeContext) return;
  const { year, month, day, shiftIndex } = nightTimeContext;
  setNightGrayState(year, month, day, shiftIndex, true);
  nightShiftTimes.delete(makeNightShiftKey(year, month, day));
  closeNightTimeDialog();
  render();
}
function setSpecialNight() {
  if (!nightTimeContext) return;
  const value = buildHourRange(nightTimeStartInput, nightTimeEndInput);
  if (!window.ShiftRosterRules?.parseTimeRange(value)) {
    window.alert('請分別輸入開始與結束小時，例如 21、05。');
    nightTimeStartInput.focus();
    return;
  }
  const { year, month, day, shiftIndex } = nightTimeContext;
  setNightGrayState(year, month, day, shiftIndex, true);
  nightShiftTimes.set(makeNightShiftKey(year, month, day), value);
  closeNightTimeDialog();
  render();
}
function removeNight() {
  if (!nightTimeContext) return;
  const { year, month, day, shiftIndex } = nightTimeContext;
  setNightGrayState(year, month, day, shiftIndex, false);
  nightShiftTimes.delete(makeNightShiftKey(year, month, day));
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
  clearMapKeysForMonth(primaryShiftValues, year, month);
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
      if (shiftIndex === 3) nightShiftTimes.delete(makeNightShiftKey(year, month, day));
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
    const row = document.createElement('label');
    row.className = 'shift-config-row';

    const person = document.createElement('span');
    person.className = 'shift-config-person';
    person.textContent = names[index] ? `${letter}. ${names[index]}` : `${letter}.`;

    const select = document.createElement('select');
    select.setAttribute('aria-label', `${letter} 本月主要班別`);
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '未設定';
    select.appendChild(empty);
    shifts.forEach((shift, shiftIndex) => {
      const option = document.createElement('option');
      option.value = String(shiftIndex);
      option.textContent = shift.label;
      select.appendChild(option);
    });
    const current = getPrimaryShift(year, month, letter);
    select.value = current === '' ? '' : String(current);
    select.addEventListener('change', () => setPrimaryShift(year, month, letter, select.value));

    row.append(person, select);
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

function buildDayNotes(year, month, day) {
  const notes = [];

  for (let shiftIndex = 0; shiftIndex < shifts.length; shiftIndex += 1) {
    const letter = rosterValues.get(makeRosterKey(year, month, day, 'shift', shiftIndex)) || '';
    if (!letter) continue;
    const specialKey = makeSpecialShiftKey(year, month, day, shiftIndex);
    if (specialShiftCells.has(specialKey)) {
      const time = specialShiftTimes.get(specialKey);
      if (time) notes.push({ kind: 'time', lines: [letter, time] });
    }
    if (shiftIndex === 3) {
      const time = nightShiftTimes.get(makeNightShiftKey(year, month, day));
      if (time) notes.push({ kind: 'time', lines: [letter, time] });
    }
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
    code.textContent = shift.code;
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
            if (shiftIndex === 3) nightShiftTimes.delete(makeNightShiftKey(year, month, day));
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
        if (nightModeEnabled && shiftIndex === 3) {
          event.preventDefault();
          openNightTimeDialog(year, month, day, shiftIndex);
          return;
        }
        if (specialModeEnabled) {
          event.preventDefault();
          openSpecialTimeDialog(year, month, day, shiftIndex);
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
    const row = document.createElement('label');
    row.className = 'name-row';
    const letter = document.createElement('span');
    letter.className = 'name-letter';
    letter.textContent = `${String.fromCharCode(65 + index)}.`;
    letter.setAttribute('aria-hidden', 'true');

    const input = document.createElement('input');
    input.className = 'name-input';
    input.type = 'text';
    input.maxLength = 3;
    input.value = name;
    input.dataset.index = index;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `${String.fromCharCode(65 + index)} 姓名`);
    input.addEventListener('input', handleNameInput);

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
  names[index] = event.target.value.slice(0, 3);
  if (event.target.value !== names[index]) event.target.value = names[index];
  renderSummary();
  if (!shiftConfigPanel.hidden) renderShiftConfigPanel();
}
function handleSpecialLeaveInput(event) {
  const index = Number(event.target.dataset.index);
  const cleaned = cleanTwoDigits(event.target.value);
  specialLeaveValues[index] = cleaned;
  if (event.target.value !== cleaned) event.target.value = cleaned;
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
      return { letter, name, primaryShiftIndex: getPrimaryShift(year, month, letter) };
    }),
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
    getNightTime(day) {
      return nightShiftTimes.get(makeNightShiftKey(year, month, day)) || '';
    }
  };
}
function startRuleCheck() {
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
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    year = 2026;
    yearInput.value = year;
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    month = 11;
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
  render();
}

// ===== 事件 =====
rosterViewTab.addEventListener('click', () => setMainView('roster'));
rulesViewTab.addEventListener('click', () => setMainView('rules'));
editRuleSettingsButton.addEventListener('click', openRuleSettingsEditor);
ruleSettingsCancel.addEventListener('click', closeRuleSettingsEditor);
ruleSettingsApply.addEventListener('click', applyRuleSettings);

yearInput.addEventListener('change', render);
monthSelect.addEventListener('change', () => {
  closeRowFillPanel();
  closeShiftConfigPanel();
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
nightTimeNormal.addEventListener('click', setNormalNight);
nightTimeSpecial.addEventListener('click', setSpecialNight);
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
  }
});

bindHourPair(specialTimeStartInput, specialTimeEndInput, applySpecialTime);
bindHourPair(nightTimeStartInput, nightTimeEndInput, setSpecialNight);
bindHourPair(ruleNightStartInput, ruleNightEndInput, applyRuleSettings);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!ruleSettingsEditor.hidden) return closeRuleSettingsEditor();
  if (!outputTimeDialog.hidden) return resolveOutputTimeChoice(false);
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

buildRowFillQuickLetters();
render();
renderRuleSettingsPage();
