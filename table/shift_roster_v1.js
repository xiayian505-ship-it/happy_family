const yearInput = document.getElementById('yearInput');
const monthSelect = document.getElementById('monthSelect');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const printButton = document.getElementById('printButton');

const scheduleTable = document.getElementById('scheduleTable');
const lowerTable = document.getElementById('lowerTable');
const summaryGrid = document.getElementById('summaryGrid');
const titleYear = document.getElementById('titleYear');
const titleMonth = document.getElementById('titleMonth');

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const shifts = [
  { label: '07 ~ 15', code: '10' },
  { label: '15 ~ 23', code: '11' },
  { label: '16 ~ 24', code: '12' },
  { label: '23 ~ 07', code: '16' },
  { label: '00 ~ 08', code: '17' }
];

const names = Array(6).fill('');
const rosterValues = new Map();

for (let month = 1; month <= 12; month += 1) {
  const option = document.createElement('option');
  option.value = month;
  option.textContent = `${month} 月`;
  monthSelect.appendChild(option);
}
monthSelect.value = '11';

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

// 上方日期列採「兩白、兩黑」循環，且跨月份不中斷。
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

  for (let day = 1; day <= days; day += 1) {
    colgroup.appendChild(document.createElement('col'));
  }
}

function makeRosterKey(year, month, day, type, index = '') {
  return `${year}-${month}-${day}-${type}-${index}`;
}

function cleanEnglishLetter(value) {
  const letters = value.toUpperCase().replace(/[^A-Z]/g, '');
  return letters.slice(0, 1);
}

function createLetterInput({ value = '', ariaLabel, onChange, className }) {
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 1;
  input.value = value;
  input.className = className;
  input.autocomplete = 'off';
  input.autocapitalize = 'characters';
  input.spellcheck = false;
  input.setAttribute('aria-label', ariaLabel);

  input.addEventListener('input', () => {
    const cleaned = cleanEnglishLetter(input.value);
    if (input.value !== cleaned) input.value = cleaned;
    onChange(cleaned);
  });

  return input;
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
    row.appendChild(label);

    const code = document.createElement('td');
    code.className = 'shift-code';
    code.textContent = shift.code;
    row.appendChild(code);

    for (let day = 1; day <= days; day += 1) {
      const td = document.createElement('td');
      td.className = 'shift-cell';

      const key = makeRosterKey(year, month, day, 'shift', shiftIndex);
      const input = createLetterInput({
        value: rosterValues.get(key) || '',
        ariaLabel: `${month}月${day}日 ${shift.label} 班別`,
        className: 'shift-input',
        onChange: (letter) => {
          if (letter) rosterValues.set(key, letter);
          else rosterValues.delete(key);
        }
      });

      td.appendChild(input);
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

    const miniWeekday = document.createElement('span');
    miniWeekday.className = 'mini-weekday';
    miniWeekday.textContent = info.weekday;

    const inputs = document.createElement('div');
    inputs.className = 'vacation-inputs';

    for (let slot = 0; slot < 2; slot += 1) {
      const key = makeRosterKey(year, month, day, 'vacation', slot);
      const input = createLetterInput({
        value: rosterValues.get(key) || '',
        ariaLabel: `${month}月${day}日 休假第${slot + 1}格`,
        className: 'vacation-input',
        onChange: (letter) => {
          if (letter) rosterValues.set(key, letter);
          else rosterValues.delete(key);
        }
      });
      inputs.appendChild(input);
    }

    td.append(miniWeekday, inputs);
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

  // A～F 是固定標籤，不放進 input，因此輸入／刪除名字都不會動到英文。
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
    input.placeholder = '';
    input.dataset.index = index;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `${String.fromCharCode(65 + index)} 姓名`);
    input.addEventListener('input', handleNameInput);

    row.append(letter, input);
    namesPanel.appendChild(row);
  });

  namesCell.appendChild(namesPanel);
  mainRow.appendChild(namesCell);

  // 對齊上方固定的班別代碼窄欄；姓名只佔左邊那格。
  const lowerCodeCell = document.createElement('td');
  lowerCodeCell.className = 'lower-code-cell';
  mainRow.appendChild(lowerCodeCell);

  for (let day = 1; day <= days; day += 1) {
    const td = document.createElement('td');
    td.className = 'day-blank';
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
    publicLeave.textContent = '公休：　';

    const specialLeave = document.createElement('span');
    specialLeave.className = 'summary-count';
    specialLeave.textContent = '特休：　';

    item.append(nameSpan, publicLeave, specialLeave);
    summaryGrid.appendChild(item);
  });
}

function handleNameInput(event) {
  const index = Number(event.target.dataset.index);
  names[index] = event.target.value.slice(0, 3);
  if (event.target.value !== names[index]) event.target.value = names[index];
  renderSummary();
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
  render();
}

yearInput.addEventListener('change', render);
monthSelect.addEventListener('change', render);
prevMonthButton.addEventListener('click', () => changeMonth(-1));
nextMonthButton.addEventListener('click', () => changeMonth(1));
printButton.addEventListener('click', () => window.print());

render();
