(() => {
  'use strict';

  const PUBLIC_LEAVE_TYPES = new Set(['public', 'exceptionPublic']);
  const FORMAL_LEAVE_TYPES = new Set(['personal', 'bereavement', 'other']);

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function normalizeTimeText(value) {
    return String(value || '')
      .trim()
      .replace(/[：:]/g, ':')
      .replace(/[～〜—–－]/g, '~')
      .replace(/\s+/g, '');
  }

  function parseClockPart(part) {
    const match = String(part || '').match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;
    if (hour === 24 && minute !== 0) return null;
    return { hour, minute };
  }

  function parseTimeRange(value) {
    const normalized = normalizeTimeText(value);
    const parts = normalized.split('~');
    if (parts.length !== 2) return null;
    const start = parseClockPart(parts[0]);
    const end = parseClockPart(parts[1]);
    if (!start || !end) return null;
    if (start.hour === 24) return null;
    return { start, end, text: `${pad2(start.hour)}:${pad2(start.minute)}~${pad2(end.hour)}:${pad2(end.minute)}` };
  }

  function buildInterval(year, month, day, rangeText) {
    const parsed = parseTimeRange(rangeText);
    if (!parsed) return null;

    const start = new Date(year, month - 1, day, parsed.start.hour, parsed.start.minute, 0, 0);
    let endYear = year;
    let endMonth = month - 1;
    let endDay = day;
    let endHour = parsed.end.hour;
    const endMinute = parsed.end.minute;

    if (endHour === 24) {
      endHour = 0;
      endDay += 1;
    }

    let end = new Date(endYear, endMonth, endDay, endHour, endMinute, 0, 0);
    if (end <= start) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    return { start, end, rangeText };
  }

  function formatDate(month, day) {
    return `${month}/${day}`;
  }

  function formatDurationHours(ms) {
    const hours = ms / 3600000;
    if (Number.isInteger(hours)) return String(hours);
    return hours.toFixed(1).replace(/\.0$/, '');
  }

  function isPublicLeaveType(type) {
    return PUBLIC_LEAVE_TYPES.has(type || 'public');
  }

  function isFormalLeaveType(type) {
    return FORMAL_LEAVE_TYPES.has(type || '');
  }

  function getActiveLetters(model) {
    const active = new Set();

    for (const employee of model.employees || []) {
      if (employee.name || employee.primaryShiftIndex !== '' && employee.primaryShiftIndex != null) active.add(employee.letter);
    }

    for (let day = 1; day <= model.days; day += 1) {
      for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
        const letter = model.getShiftLetter(day, shiftIndex);
        if (letter) active.add(letter);
      }
      for (const leave of model.getLeaveEntries(day)) {
        if (leave.letter) active.add(leave.letter);
      }
    }

    return [...active].sort();
  }

  function collectBlockedLeaveIssues(model, issues) {
    for (let day = 1; day <= model.days; day += 1) {
      if (!model.isBlocked(day)) continue;
      for (const leave of model.getLeaveEntries(day)) {
        if (!leave.letter) continue;
        const type = leave.type || 'public';
        if (type === 'exceptionPublic' || isFormalLeaveType(type)) continue;
        const label = type === 'annual' ? '特休' : '公休';
        issues.push({
          code: 'blocked-leave',
          title: '禁假日排休',
          message: `${formatDate(model.month, day)} 為禁假日，${leave.letter} 排了${label}。\n若為特殊安排，可選「例外安排」繼續。`
        });
      }
    }
  }

  function collectMissingAssignmentIssues(model, issues, activeLetters) {
    const employeeMap = new Map((model.employees || []).map((employee) => [employee.letter, employee]));
    for (const letter of activeLetters) {
      const employee = employeeMap.get(letter);
      if (!employee || employee.primaryShiftIndex === '' || employee.primaryShiftIndex == null) {
        issues.push({
          code: 'missing-primary-shift',
          title: '尚未設定主要班別',
          message: `${letter}${employee?.name ? ` ${employee.name}` : ''} 尚未設定本月主要班別。\n同組排休與相鄰排休順序將無法完整檢查。`
        });
      }
    }
  }

  function collectSameGroupLeaveIssues(model, issues) {
    const employeeMap = new Map((model.employees || []).map((employee) => [employee.letter, employee]));
    const groups = [
      { name: '日／晚班組', shiftIndexes: new Set([0, 1, 2]) },
      { name: '大夜組', shiftIndexes: new Set([3, 4]) }
    ];

    for (let day = 1; day <= model.days; day += 1) {
      const leaves = model.getLeaveEntries(day).filter((entry) => entry.letter);
      for (const group of groups) {
        const members = [];
        for (const leave of leaves) {
          const employee = employeeMap.get(leave.letter);
          if (!employee) continue;
          const shiftIndex = Number(employee.primaryShiftIndex);
          if (group.shiftIndexes.has(shiftIndex)) members.push(leave.letter);
        }
        const unique = [...new Set(members)];
        if (unique.length > 1) {
          issues.push({
            code: 'same-group-leave',
            title: '同組同日排休',
            message: `${formatDate(model.month, day)} ${group.name}同日排休：${unique.join('、')}。\n原則上同組同一天最多休 1 人。`
          });
        }
      }
    }
  }

  function collectAdjacentLeaveOrderIssues(model, issues) {
    const employeeMap = new Map((model.employees || []).map((employee) => [employee.letter, employee]));

    for (let day = 1; day < model.days; day += 1) {
      const todayLeaves = model.getLeaveEntries(day).filter((entry) => entry.letter);
      const nextLeaves = model.getLeaveEntries(day + 1).filter((entry) => entry.letter);

      const todayMiddle = todayLeaves.filter((entry) => Number(employeeMap.get(entry.letter)?.primaryShiftIndex) === 1);
      const nextEarly = nextLeaves.filter((entry) => Number(employeeMap.get(entry.letter)?.primaryShiftIndex) === 0);

      for (const first of todayMiddle) {
        for (const second of nextEarly) {
          issues.push({
            code: 'adjacent-leave-order',
            title: '相鄰排休順序',
            message: `${formatDate(model.month, day)} ${first.letter}（15~23）休假，${formatDate(model.month, day + 1)} ${second.letter}（07~15）休假。\n目前順序為「中班 → 早班」，原則上應避免。`
          });
        }
      }
    }
  }

  function getActualRange(model, day, shiftIndex) {
    const shift = model.shifts[shiftIndex];
    if (!shift) return null;

    if (model.isSpecial(day, shiftIndex)) {
      return model.getSpecialTime(day, shiftIndex) || null;
    }

    if (shiftIndex === 3 && model.isNightGray(day, shiftIndex)) {
      return model.getNightTime(day, shiftIndex) || '22~06';
    }

    return shift.label.replace(/\s+/g, '');
  }

  function buildWorkIntervals(model) {
    const byLetter = new Map();

    for (let day = 1; day <= model.days; day += 1) {
      for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
        const letter = model.getShiftLetter(day, shiftIndex);
        if (!letter) continue;
        const rangeText = getActualRange(model, day, shiftIndex);
        if (!rangeText) continue;
        const interval = buildInterval(model.year, model.month, day, rangeText);
        if (!interval) continue;
        interval.day = day;
        interval.shiftIndex = shiftIndex;
        interval.letter = letter;
        interval.rangeText = rangeText;
        if (!byLetter.has(letter)) byLetter.set(letter, []);
        byLetter.get(letter).push(interval);
      }
    }

    for (const intervals of byLetter.values()) {
      intervals.sort((a, b) => a.start - b.start || a.end - b.end);
    }

    return byLetter;
  }

  function collectSpecialTimeIssues(model, issues) {
    for (let day = 1; day <= model.days; day += 1) {
      for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
        const letter = model.getShiftLetter(day, shiftIndex);
        if (!letter) continue;
        if (model.isSpecial(day, shiftIndex)) {
          const time = model.getSpecialTime(day, shiftIndex);
          if (!time || !parseTimeRange(time)) {
            issues.push({
              code: 'special-time-missing',
              title: '特殊班缺少時間',
              message: `${formatDate(model.month, day)} ${letter} 的特殊班沒有有效實際時間。\n請補上例如 12~20。`
            });
          }
        }
        if (shiftIndex === 3 && model.getNightTime(day, shiftIndex)) {
          const time = model.getNightTime(day, shiftIndex);
          if (!parseTimeRange(time)) {
            issues.push({
              code: 'night-time-invalid',
              title: '特殊大夜時間格式',
              message: `${formatDate(model.month, day)} ${letter || ''} 的特殊大夜時間「${time}」無法判讀。`
            });
          }
        }
      }
    }
  }

  function collectConsecutiveWorkIssues(model, issues) {
    const activeLetters = getActiveLetters(model);

    for (const letter of activeLetters) {
      const workDays = [];
      for (let day = 1; day <= model.days; day += 1) {
        let works = false;
        for (let shiftIndex = 0; shiftIndex < model.shifts.length; shiftIndex += 1) {
          if (model.getShiftLetter(day, shiftIndex) === letter) {
            works = true;
            break;
          }
        }
        if (works) workDays.push(day);
      }

      let start = 0;
      while (start < workDays.length) {
        let end = start;
        while (end + 1 < workDays.length && workDays[end + 1] === workDays[end] + 1) end += 1;
        const length = end - start + 1;
        if (length > 6) {
          const first = workDays[start];
          const last = workDays[end];
          issues.push({
            code: 'consecutive-work',
            title: '連續上班超過 6 天',
            message: `${letter} 於 ${formatDate(model.month, first)}～${formatDate(model.month, last)} 連續上班 ${length} 天。\n原則上第 7 天應休假。`
          });
        }
        start = end + 1;
      }
    }
  }

  function collectRestGapIssues(model, issues) {
    const byLetter = buildWorkIntervals(model);

    for (const [letter, intervals] of byLetter.entries()) {
      for (let index = 0; index < intervals.length - 1; index += 1) {
        const current = intervals[index];
        const next = intervals[index + 1];
        const gapMs = next.start - current.end;
        if (gapMs >= 12 * 3600000) continue;

        issues.push({
          code: 'rest-gap',
          title: '轉班間隔低於 12 小時',
          message: `${letter}：${formatDate(model.month, current.day)} ${current.rangeText} → ${formatDate(model.month, next.day)} ${next.rangeText}\n中間休息約 ${formatDurationHours(gapMs)} 小時，低於 12 小時。`
        });
      }
    }
  }

  function collectIssues(model) {
    const issues = [];
    const activeLetters = getActiveLetters(model);

    collectBlockedLeaveIssues(model, issues);
    collectMissingAssignmentIssues(model, issues, activeLetters);
    collectSameGroupLeaveIssues(model, issues);
    collectAdjacentLeaveOrderIssues(model, issues);
    collectSpecialTimeIssues(model, issues);
    collectConsecutiveWorkIssues(model, issues);
    collectRestGapIssues(model, issues);

    return issues;
  }

  window.ShiftRosterRules = Object.freeze({
    parseTimeRange,
    isPublicLeaveType,
    isFormalLeaveType,
    getActiveLetters,
    collectIssues
  });
})();
