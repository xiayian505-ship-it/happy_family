(() => {
  'use strict';

  const FORMAT = 'elitehotel-shift-roster-v3';
  const SCHEMA_VERSION = 3;
  const DEFAULT_SHIFT_RANGES = ['07~15', '15~23', '16~24', '23~07', '00~08'];
  const DEFAULT_ANNUAL_LEAVE_RULES = {
    sixMonths: 3,
    year1: 7,
    year2: 10,
    years3to4: 14,
    years5to9: 15,
    year10Base: 16,
    after10Increment: 1,
    maxDays: 30
  };
  const DEFAULT_SETTINGS = {
    publicLeaveCount: 8,
    maxConsecutiveWorkDays: 6,
    minTurnaroundHours: 12,
    normalNightRange: '22~06',
    shiftRanges: [...DEFAULT_SHIFT_RANGES],
    blockedWeekdays: [6],
    blockedLeaveTypes: ['public', 'annual'],
    meetingDefaultText: '8點櫃檯開會',
    annualLeaveRules: { ...DEFAULT_ANNUAL_LEAVE_RULES }
  };

  const COLOR = {
    pink: 'F586C0',
    gray: 'B7B7B7',
    red: 'B3261E'
  };

  const LAYOUT = Object.freeze({
    dateRow: 2,
    weekdayRow: 3,
    shiftStartRow: 4,
    shiftCount: 5,
    vacationWeekRow: 9,
    vacationBodyRow: 10,
    peopleStartRow: 11,
    peopleCount: 6,
    lowerDateRow: 17,
    seniorityStartRow: 21,
    dayStartCol: 5
  });

  const excelInput = document.getElementById('excelInput');
  const fileName = document.getElementById('fileName');
  const resultCard = document.getElementById('resultCard');
  const monthLabel = document.getElementById('monthLabel');
  const peopleCount = document.getElementById('peopleCount');
  const shiftCount = document.getElementById('shiftCount');
  const vacationCount = document.getElementById('vacationCount');
  const warningCount = document.getElementById('warningCount');
  const warningBox = document.getElementById('warningBox');
  const warningList = document.getElementById('warningList');
  const jsonPreview = document.getElementById('jsonPreview');
  const downloadJsonButton = document.getElementById('downloadJsonButton');

  let currentPayload = null;
  let currentMonthId = '';
  let currentDownloadUrl = '';

  excelInput.addEventListener('change', async () => {
    const file = excelInput.files?.[0];
    resetResult();
    if (!file) return;

    fileName.textContent = file.name;
    if (!window.ExcelJS) {
      window.alert('ExcelJS 尚未載入。請確認網路連線後重新整理。');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const parsed = parseWorkbook(workbook);
      currentPayload = parsed.payload;
      currentMonthId = parsed.monthId;
      renderResult(parsed);
    } catch (error) {
      console.error(error);
      window.alert(`Excel 解析失敗。\n${error?.message || '未知錯誤'}`);
    }
  });

  downloadJsonButton.addEventListener('click', (event) => {
    if (!currentPayload || !currentMonthId || !currentDownloadUrl) {
      event.preventDefault();
    }
  });

  function parseWorkbook(workbook) {
    const target = findRosterWorksheet(workbook);
    if (!target) throw new Error('找不到本系統的班表工作表。工作表名稱或 A1 月份格式不符。');

    const { worksheet, year, month } = target;
    const monthId = `${year}-${pad2(month)}`;
    const days = new Date(year, month, 0).getDate();
    validateLayout(worksheet, days);

    const warnings = [];
    const shiftRanges = readShiftRanges(worksheet);
    const publicLeaveCount = readPublicLeaveTarget(worksheet, days) || DEFAULT_SETTINGS.publicLeaveCount;
    const peopleInfo = readPeople(worksheet);
    const rosterValues = readRosterValues(worksheet, days, warnings);
    const specialLeaveValues = readSpecialLeaveValues(worksheet);
    const styleState = readShiftStyleState(worksheet, year, month, days, rosterValues, warnings);
    const noteState = readRecoverableNotes(worksheet, days, rosterValues, styleState, warnings);
    const employees = buildEmployees(worksheet, peopleInfo, rosterValues, warnings);
    const people = buildMonthPeople(peopleInfo, rosterValues, employees, warnings);

    detectUnrecoverableVisualConditions(worksheet, year, month, days, warnings);

    const monthData = {
      month: monthId,
      people,
      specialLeaveValues,
      rosterValues,
      blockedVacationOverrides: {},
      specialShiftCells: styleState.specialShiftCells,
      nightShiftOverrides: styleState.nightShiftOverrides,
      leaveTypeValues: noteState.leaveTypeValues,
      leaveNoteValues: noteState.leaveNoteValues,
      manualNotes: {},
      extraLeaves: {},
      annualGrantDecisions: {},
      annualBalanceCalibrations: {},
      specialShiftTimes: noteState.specialShiftTimes,
      nightShiftTimes: noteState.nightShiftTimes,
      meetingDays: [],
      meetingNoteValues: {},
      supervisorLeaveDays: []
    };

    const now = new Date().toISOString();
    const payload = {
      format: FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now,
      meta: {
        schemaVersion: SCHEMA_VERSION,
        createdAt: now,
        source: 'excel-to-json-prototype-v1'
      },
      settings: {
        ...DEFAULT_SETTINGS,
        publicLeaveCount,
        shiftRanges
      },
      employees,
      months: { [monthId]: monthData },
      specialDays: {}
    };

    const stats = countStats(monthData);
    return { payload, monthId, warnings: unique(warnings), stats };
  }

  function findRosterWorksheet(workbook) {
    for (const worksheet of workbook.worksheets) {
      const sheetMatch = String(worksheet.name || '').match(/(\d{4})-(0[1-9]|1[0-2])\s*班表/);
      if (sheetMatch) {
        return { worksheet, year: Number(sheetMatch[1]), month: Number(sheetMatch[2]) };
      }

      const title = cellText(worksheet.getCell(1, 1));
      const titleMatch = title.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
      if (titleMatch) {
        const year = Number(titleMatch[1]);
        const month = Number(titleMatch[2]);
        if (month >= 1 && month <= 12) return { worksheet, year, month };
      }
    }
    return null;
  }

  function validateLayout(worksheet, days) {
    const firstDay = Number(cellText(worksheet.getCell(LAYOUT.dateRow, LAYOUT.dayStartCol)));
    const lastDay = Number(cellText(worksheet.getCell(LAYOUT.dateRow, LAYOUT.dayStartCol + days - 1)));
    if (firstDay !== 1 || lastDay !== days) {
      throw new Error('日期列位置與目前班表匯出格式不一致。這支工具只支援本系統匯出的 Excel。');
    }

    const shiftGroups = Array.from({ length: LAYOUT.shiftCount }, (_, index) =>
      cellText(worksheet.getCell(LAYOUT.shiftStartRow + index, 4))
    );
    const expected = ['早', '中', '中', '夜', '夜'];
    if (shiftGroups.some((value, index) => value !== expected[index])) {
      throw new Error('五個班別列位置與目前班表格式不一致。');
    }
  }

  function readShiftRanges(worksheet) {
    return Array.from({ length: LAYOUT.shiftCount }, (_, index) => {
      const text = cellText(worksheet.getCell(LAYOUT.shiftStartRow + index, 1));
      const normalized = normalizeTimeRange(text);
      return normalized || DEFAULT_SHIFT_RANGES[index];
    });
  }

  function readPublicLeaveTarget(worksheet, days) {
    const noteCol = LAYOUT.dayStartCol + days;
    const text = cellText(worksheet.getCell(LAYOUT.dateRow, noteCol));
    const match = text.match(/各排\s*(\d{1,2})\s*天/);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isInteger(value) && value >= 1 && value <= 31 ? value : null;
  }

  function readPeople(worksheet) {
    const result = {};
    for (let index = 0; index < LAYOUT.peopleCount; index += 1) {
      const letter = String.fromCharCode(65 + index);
      const row = LAYOUT.peopleStartRow + index;
      const displayName = cellText(worksheet.getCell(row, 2)).trim();
      if (!displayName) continue;
      result[letter] = { displayName, row };
    }
    return result;
  }

  function readSpecialLeaveValues(worksheet) {
    return Array.from({ length: LAYOUT.peopleCount }, (_, index) => {
      const value = cellText(worksheet.getCell(LAYOUT.peopleStartRow + index, 3)).trim();
      if (!value) return '';
      const digits = value.match(/^\d{1,2}$/)?.[0];
      return digits || '';
    });
  }

  function readRosterValues(worksheet, days, warnings) {
    const result = {};

    for (let shift = 0; shift < LAYOUT.shiftCount; shift += 1) {
      const row = LAYOUT.shiftStartRow + shift;
      for (let day = 1; day <= days; day += 1) {
        const letter = normalizeLetter(cellText(worksheet.getCell(row, dayColumn(day))));
        if (letter) result[`${day}-shift-${shift}`] = letter;
      }
    }

    for (let day = 1; day <= days; day += 1) {
      const body = cellText(worksheet.getCell(LAYOUT.vacationBodyRow, dayColumn(day)));
      const letters = extractLetters(body).slice(0, 2);
      letters.forEach((letter, slot) => {
        result[`${day}-vacation-${slot}`] = letter;
      });
      if (extractLetters(body).length > 2) {
        warnings.push(`${day} 日休假格超過 2 個人，只取前兩個。`);
      }
    }

    return result;
  }

  function readShiftStyleState(worksheet, year, month, days, rosterValues, warnings) {
    const specialShiftCells = [];
    const nightShiftOverrides = {};

    for (let shift = 0; shift < LAYOUT.shiftCount; shift += 1) {
      const row = LAYOUT.shiftStartRow + shift;
      for (let day = 1; day <= days; day += 1) {
        const key = `${day}-shift-${shift}`;
        const cell = worksheet.getCell(row, dayColumn(day));
        const fill = fillHex(cell);
        const isPink = fill === COLOR.pink;
        const isGray = fill === COLOR.gray;

        if (isPink) specialShiftCells.push(key);

        const defaultGray = shift === 3 && new Date(year, month - 1, day).getDay() === 6;
        if (!isPink && isGray !== defaultGray) {
          nightShiftOverrides[`${day}-night-${shift}`] = isGray;
        }

        if (isPink && defaultGray && rosterValues[key]) {
          warnings.push(`${day} 日 ${shift + 1} 班同時可能涉及粉底特殊班與預設灰底；Excel 外觀無法看出粉底下面是否另有灰底覆寫。`);
        }
      }
    }

    return { specialShiftCells, nightShiftOverrides };
  }

  function readRecoverableNotes(worksheet, days, rosterValues, styleState, warnings) {
    const leaveTypeValues = {};
    const leaveNoteValues = {};
    const specialShiftTimes = {};
    const nightShiftTimes = {};

    for (let day = 1; day <= days; day += 1) {
      const noteCell = worksheet.getCell(LAYOUT.peopleStartRow, dayColumn(day));
      const tokens = splitNoteTokens(cellText(noteCell));
      const vacationLetters = [0, 1]
        .map((slot) => rosterValues[`${day}-vacation-${slot}`])
        .filter(Boolean);

      for (let slot = 0; slot < 2; slot += 1) {
        const key = `${day}-vacation-${slot}`;
        const letter = rosterValues[key];
        if (!letter) continue;

        if (hasSequence(tokens, [letter, '特', '休'])) {
          leaveTypeValues[key] = 'annual';
          continue;
        }

        const leaveNote = findLeaveNote(tokens, letter);
        if (leaveNote) {
          leaveTypeValues[key] = 'leave';
          leaveNoteValues[key] = leaveNote;
          continue;
        }

        const vacationCell = worksheet.getCell(LAYOUT.vacationBodyRow, dayColumn(day));
        if (fontHex(vacationCell) === COLOR.red && vacationLetters.length === 1) {
          leaveTypeValues[key] = 'leave';
          leaveNoteValues[key] = '請假';
          warnings.push(`${day} 日 ${letter} 的休假格為紅字，但備註無法完整還原請假文字；暫以「請假」輸出。`);
        }
      }

      const timeNotes = findTimeNotes(tokens);
      for (const timeNote of timeNotes) {
        const candidates = [];
        for (let shift = 0; shift < LAYOUT.shiftCount; shift += 1) {
          const shiftKey = `${day}-shift-${shift}`;
          if (rosterValues[shiftKey] === timeNote.letter) candidates.push(shift);
        }

        const pinkCandidates = candidates.filter((shift) => styleState.specialShiftCells.includes(`${day}-shift-${shift}`));
        const grayCandidates = candidates.filter((shift) => {
          const cell = worksheet.getCell(LAYOUT.shiftStartRow + shift, dayColumn(day));
          return fillHex(cell) === COLOR.gray;
        });

        if (pinkCandidates.length === 1) {
          specialShiftTimes[`${day}-shift-${pinkCandidates[0]}`] = timeNote.range;
        } else if (grayCandidates.length === 1) {
          nightShiftTimes[`${day}-night-${grayCandidates[0]}`] = timeNote.range;
        } else {
          warnings.push(`${day} 日 ${timeNote.letter} 的 ${timeNote.range} 時間備註找不到唯一對應班格，未寫入特殊／夜班時間。`);
        }
      }
    }

    return { leaveTypeValues, leaveNoteValues, specialShiftTimes, nightShiftTimes };
  }

  function buildEmployees(worksheet, peopleInfo, rosterValues, warnings) {
    const employees = {};
    const hireDates = readHireDates(worksheet, Object.values(peopleInfo).map((item) => item.displayName));

    for (const [letter, person] of Object.entries(peopleInfo)) {
      const employeeId = `emp_excel_${letter.toLowerCase()}`;
      employees[employeeId] = {
        name: person.displayName,
        role: 'staff',
        active: true
      };
      if (hireDates[person.displayName]) employees[employeeId].hireDate = hireDates[person.displayName];
    }

    const missingHireDates = Object.values(peopleInfo)
      .map((item) => item.displayName)
      .filter((name) => !hireDates[name]);
    if (missingHireDates.length) {
      warnings.push(`年資區無法取得到職日：${missingHireDates.join('、')}。員工仍可建立，但特休判斷不會完整。`);
    }

    return employees;
  }

  function buildMonthPeople(peopleInfo, rosterValues, employees, warnings) {
    const result = {};

    for (const [letter, person] of Object.entries(peopleInfo)) {
      const employeeId = `emp_excel_${letter.toLowerCase()}`;
      let shiftGroups = [];

      if (letter === 'A') {
        shiftGroups = ['early', 'middle', 'night'];
      } else {
        const counts = { early: 0, middle: 0, night: 0 };
        for (const [key, value] of Object.entries(rosterValues)) {
          if (value !== letter || !/-shift-/.test(key)) continue;
          const shift = Number(key.match(/-shift-(\d)$/)?.[1]);
          if (shift === 0) counts.early += 1;
          else if (shift === 1 || shift === 2) counts.middle += 1;
          else if (shift === 3 || shift === 4) counts.night += 1;
        }

        const usedGroups = Object.entries(counts).filter(([, count]) => count > 0);
        if (usedGroups.length === 1) {
          shiftGroups = [usedGroups[0][0]];
        } else if (usedGroups.length > 1) {
          usedGroups.sort((a, b) => b[1] - a[1]);
          shiftGroups = [usedGroups[0][0]];
          warnings.push(`${letter}.${person.displayName} 在 Excel 本月出現在多個班別群組；固定班別暫以出現次數最多的「${groupLabel(shiftGroups[0])}」推定。`);
        } else {
          warnings.push(`${letter}.${person.displayName} 本月沒有排班紀錄，Excel 沒有固定班別欄位，因此 shiftGroups 暫留空。`);
        }
      }

      result[letter] = { employeeId, displayName: person.displayName, shiftGroups };
      if (!employees[employeeId]) throw new Error(`內部轉換錯誤：找不到 ${letter} 的 employee。`);
    }

    return result;
  }

  function readHireDates(worksheet, names) {
    const result = {};
    const known = new Set(names);

    for (let row = LAYOUT.seniorityStartRow; row <= worksheet.rowCount + 2; row += 1) {
      const text = cellText(worksheet.getCell(row, 1)).trim();
      if (!text) continue;
      const name = [...known].find((item) => text.startsWith(`${item} `));
      if (!name) continue;
      const match = text.match(/\b(\d{4})\.(\d{2})\.(\d{2})\b/);
      if (!match) continue;
      result[name] = `${match[1]}-${match[2]}-${match[3]}`;
    }

    return result;
  }

  function detectUnrecoverableVisualConditions(worksheet, year, month, days, warnings) {
    const blockedDays = [];
    const holidayDays = [];

    for (let day = 1; day <= days; day += 1) {
      const vacationCell = worksheet.getCell(LAYOUT.vacationBodyRow, dayColumn(day));
      const diagonal = vacationCell.border?.diagonal;
      if (diagonal?.up || diagonal?.down) blockedDays.push(day);

      const dateCell = worksheet.getCell(LAYOUT.dateRow, dayColumn(day));
      if (fontHex(dateCell) === COLOR.red) holidayDays.push(day);
    }

    if (blockedDays.length) {
      warnings.push(`Excel 有 ${blockedDays.length} 個禁休斜線日，但斜線只代表「最後結果」，無法分辨是預設星期、年度特殊日、主管休假或手動例外；測試 JSON 不重建 blockedVacationOverrides / supervisorLeaveDays。`);
    }
    if (holidayDays.length) {
      warnings.push(`Excel 有特殊日期紅字（${holidayDays.join('、')} 日），但單月 Excel 沒有整年度 specialDays 原始設定；測試 JSON 不覆寫年度特殊日期。`);
    }

    warnings.push('Excel 沒有保存：連勤上限、轉班最低時數、禁休假別、特休級距等完整 settings；本工具為了讓現行 v3 JSON 匯入器可測試，這些欄位使用程式預設值。');
    warnings.push('Excel 沒有保存 annualGrantDecisions / annualBalanceCalibrations 的完整原始狀態；測試 JSON 以空資料輸出。');
    warnings.push('下方長條的開會備註、一般手動備註、主管特休事件可能共用同一視覺區，無法百分之百無歧義反推；v1 不猜測。');
  }

  function countStats(monthData) {
    let shift = 0;
    let vacation = 0;
    for (const key of Object.keys(monthData.rosterValues)) {
      if (/-shift-/.test(key)) shift += 1;
      if (/-vacation-/.test(key)) vacation += 1;
    }
    return {
      people: Object.keys(monthData.people).length,
      shift,
      vacation
    };
  }

  function renderResult(parsed) {
    resultCard.hidden = false;
    monthLabel.textContent = `${parsed.monthId} 班表`;
    peopleCount.textContent = String(parsed.stats.people);
    shiftCount.textContent = String(parsed.stats.shift);
    vacationCount.textContent = String(parsed.stats.vacation);
    warningCount.textContent = String(parsed.warnings.length);
    const jsonText = `${JSON.stringify(parsed.payload, null, 2)}\n`;
    jsonPreview.textContent = jsonText;
    prepareDownload(jsonText, parsed.monthId);

    warningList.replaceChildren();
    warningBox.hidden = parsed.warnings.length === 0;
    parsed.warnings.forEach((message) => {
      const li = document.createElement('li');
      li.textContent = message;
      warningList.appendChild(li);
    });
  }

  function resetResult() {
    currentPayload = null;
    currentMonthId = '';
    resultCard.hidden = true;
    clearDownload();
    jsonPreview.textContent = '';
    warningList.replaceChildren();
  }


  function prepareDownload(text, monthId) {
    clearDownload();
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    currentDownloadUrl = URL.createObjectURL(blob);
    downloadJsonButton.href = currentDownloadUrl;
    downloadJsonButton.download = `EliteHotel_${monthId}_from_excel_test.json`;
    downloadJsonButton.classList.remove('is-disabled');
    downloadJsonButton.setAttribute('aria-disabled', 'false');
  }

  function clearDownload() {
    if (currentDownloadUrl) {
      URL.revokeObjectURL(currentDownloadUrl);
      currentDownloadUrl = '';
    }
    downloadJsonButton.removeAttribute('download');
    downloadJsonButton.href = '#';
    downloadJsonButton.classList.add('is-disabled');
    downloadJsonButton.setAttribute('aria-disabled', 'true');
  }

  function cellText(cell) {
    if (!cell) return '';
    if (typeof cell.text === 'string') return cell.text.replace(/\r\n/g, '\n');
    if (cell.value == null) return '';
    return String(cell.value).replace(/\r\n/g, '\n');
  }

  function dayColumn(day) {
    return LAYOUT.dayStartCol + day - 1;
  }

  function normalizeLetter(value) {
    const match = String(value || '').trim().toUpperCase().match(/^[A-F]$/);
    return match ? match[0] : '';
  }

  function extractLetters(value) {
    return String(value || '').toUpperCase().match(/[A-F]/g) || [];
  }

  function normalizeTimeRange(value) {
    const text = String(value || '').replace(/\s+/g, '').replace(/[～－–—-]/g, '~');
    const match = text.match(/^(\d{1,2}(?::\d{2})?)~(\d{1,2}(?::\d{2})?)$/);
    return match ? `${match[1]}~${match[2]}` : '';
  }

  function splitNoteTokens(value) {
    return String(value || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function hasSequence(tokens, sequence) {
    for (let index = 0; index <= tokens.length - sequence.length; index += 1) {
      if (sequence.every((item, offset) => tokens[index + offset] === item)) return true;
    }
    return false;
  }

  function findLeaveNote(tokens, letter) {
    for (let index = 0; index < tokens.length; index += 1) {
      if (tokens[index] !== letter) continue;
      if (tokens[index + 1] === '特' && tokens[index + 2] === '休') continue;
      if (tokens[index + 1] === '公' && tokens[index + 2] === '休') continue;
      if (isTimeToken(tokens[index + 1]) && tokens[index + 2] === '│' && isTimeToken(tokens[index + 3])) continue;

      const chars = [];
      for (let cursor = index + 1; cursor < tokens.length && chars.length < 4; cursor += 1) {
        const token = tokens[cursor];
        if (/^[A-F]$/.test(token)) break;
        if (token === '│' || /^\d{1,2}$/.test(token)) break;
        if (isTimeToken(token)) break;
        chars.push(token);
      }
      const note = chars.join('').slice(0, 4);
      if (note) return note;
    }
    return '';
  }

  function findTimeNotes(tokens) {
    const result = [];
    for (let index = 0; index <= tokens.length - 4; index += 1) {
      const letter = tokens[index];
      const start = tokens[index + 1];
      const bar = tokens[index + 2];
      const end = tokens[index + 3];
      if (!/^[A-F]$/.test(letter) || bar !== '│' || !isTimeToken(start) || !isTimeToken(end)) continue;
      result.push({ letter, range: `${start}~${end}` });
      index += 3;
    }
    return result;
  }

  function isTimeToken(value) {
    return /^\d{1,2}(?::\d{2})?$/.test(String(value || ''));
  }

  function fillHex(cell) {
    const argb = cell?.fill?.fgColor?.argb;
    return normalizeColor(argb);
  }

  function fontHex(cell) {
    const argb = cell?.font?.color?.argb;
    return normalizeColor(argb);
  }

  function normalizeColor(value) {
    const text = String(value || '').replace(/[^0-9A-F]/gi, '').toUpperCase();
    return text.length >= 6 ? text.slice(-6) : '';
  }

  function groupLabel(group) {
    return ({ early: '早班', middle: '中班', night: '大夜' })[group] || group;
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function unique(values) {
    return [...new Set(values)];
  }
})();
