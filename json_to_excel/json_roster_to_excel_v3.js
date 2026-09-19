(() => {
  'use strict';

  const EXPECTED_FORMAT = 'elitehotel-shift-roster-v3';
  const EXPECTED_SCHEMA = 3;
  const WEEKDAYS = ['日','一','二','三','四','五','六'];
  const DEFAULT_SHIFTS = ['07~15','15~23','16~24','23~07','00~08'];
  const SHIFT_GROUPS = ['早','中','中','夜','夜'];
  const DEFAULT_ANNUAL_LEAVE_RULES = Object.freeze({
    sixMonths: 3,
    year1: 7,
    year2: 10,
    years3to4: 14,
    years5to9: 15,
    year10Base: 16,
    after10Increment: 1,
    maxDays: 30
  });

  const PINK = 'FFF586C0';
  const GRAY = 'FFB7B7B7';
  const WHITE = 'FFFFFFFF';
  const BLACK = 'FF1B1B1B';
  const RED = 'FFC62828';
  const FORMAL_RED = 'FFB3261E';

  const fileInput = document.getElementById('jsonFile');
  const dropZone = document.getElementById('dropZone');
  const status = document.getElementById('status');
  const monthField = document.getElementById('monthField');
  const monthSelect = document.getElementById('monthSelect');
  const preview = document.getElementById('preview');
  const formatText = document.getElementById('formatText');
  const monthText = document.getElementById('monthText');
  const peopleText = document.getElementById('peopleText');
  const rosterText = document.getElementById('rosterText');
  const exportBtn = document.getElementById('exportBtn');

  let payload = null;
  let sourceName = 'EliteHotel';

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) loadFile(file);
  });

  ['dragenter','dragover'].forEach(type => dropZone.addEventListener(type, event => {
    event.preventDefault();
    dropZone.classList.add('is-dragover');
  }));

  ['dragleave','drop'].forEach(type => dropZone.addEventListener(type, event => {
    event.preventDefault();
    dropZone.classList.remove('is-dragover');
  }));

  dropZone.addEventListener('drop', event => {
    const file = event.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  });

  monthSelect.addEventListener('change', refreshPreview);
  exportBtn.addEventListener('click', exportExcel);

  async function loadFile(file) {
    try {
      const text = await file.text();
      const json = JSON.parse(text.replace(/^\uFEFF/, ''));
      validate(json);
      payload = json;
      sourceName = file.name.replace(/\.json$/i, '') || 'EliteHotel';
      fillMonths();
      refreshPreview();
      setStatus(`已載入：${file.name}`, 'ok');
      exportBtn.disabled = false;
    } catch (error) {
      payload = null;
      exportBtn.disabled = true;
      monthField.hidden = true;
      preview.hidden = true;
      setStatus(error?.message || '無法讀取 JSON。', 'error');
    }
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function validate(json) {
    if (!isPlainObject(json)) throw new Error('JSON 最外層格式不正確。');
    if (json.format !== EXPECTED_FORMAT) throw new Error('這不是 EliteHotel 班表 v3 備份 JSON。');
    if (Number(json.schemaVersion) !== EXPECTED_SCHEMA) throw new Error(`只支援 schemaVersion ${EXPECTED_SCHEMA}。`);
    if (!isPlainObject(json.settings)) throw new Error('JSON 的 settings 格式不正確。');
    if (!isPlainObject(json.employees)) throw new Error('JSON 的 employees 格式不正確。');
    if (!isPlainObject(json.months) || !Object.keys(json.months).length) throw new Error('JSON 裡沒有可匯出的月份。');
    if (!isPlainObject(json.specialDays)) throw new Error('JSON 的 specialDays 格式不正確。');

    for (const [monthId, data] of Object.entries(json.months)) {
      if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(monthId) || !isPlainObject(data) || data.month !== monthId) {
        throw new Error(`月份 ${monthId} 的資料格式不正確。`);
      }
      if (!isPlainObject(data.people) || !isPlainObject(data.rosterValues)) {
        throw new Error(`月份 ${monthId} 缺少人員或班表資料。`);
      }
    }
  }

  function fillMonths() {
    const months = Object.keys(payload.months).sort();
    monthSelect.innerHTML = '';
    months.forEach(id => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = id;
      monthSelect.appendChild(option);
    });
    monthSelect.value = months[months.length - 1];
    monthField.hidden = months.length <= 1;
  }

  function refreshPreview() {
    if (!payload) return;
    const monthId = monthSelect.value || Object.keys(payload.months).sort().at(-1);
    const data = payload.months[monthId];
    const activePeople = Object.values(data.people || {}).filter(person => String(person?.displayName || '').trim()).length;
    const rosterCount = Object.values(data.rosterValues || {}).filter(Boolean).length;
    formatText.textContent = `${payload.format} / schema ${payload.schemaVersion}`;
    monthText.textContent = monthId;
    peopleText.textContent = `${activePeople} 人`;
    rosterText.textContent = `${rosterCount} 格`;
    preview.hidden = false;
  }

  async function exportExcel() {
    if (!payload) return;
    if (!window.ExcelJS) {
      setStatus('ExcelJS 尚未載入。請確認目前有網路連線後重新開啟工具。', 'error');
      return;
    }

    exportBtn.disabled = true;
    setStatus('正在建立 Excel…', 'ok');
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Stillness by Slowly';
      workbook.created = new Date();
      const monthId = monthSelect.value || Object.keys(payload.months).sort().at(-1);
      buildMonthSheet(workbook, monthId, payload.months[monthId], payload);

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),
        `${sourceName}_${monthId}_同版班表.xlsx`
      );
      setStatus('Excel 已建立完成。', 'ok');
    } catch (error) {
      console.error(error);
      setStatus(`匯出失敗：${error?.message || error}`, 'error');
    } finally {
      exportBtn.disabled = false;
    }
  }

  function buildMonthSheet(workbook, monthId, data, sourcePayload = payload) {
    if (!sourcePayload) throw new Error('缺少班表 JSON 資料。');
    const [year, month] = monthId.split('-').map(Number);
    const days = new Date(year, month, 0).getDate();
    const settings = sourcePayload.settings || {};
    const shiftRanges = Array.isArray(settings.shiftRanges) && settings.shiftRanges.length === 5 ? settings.shiftRanges : DEFAULT_SHIFTS;
    const blockedWeekdays = new Set((settings.blockedWeekdays || [6]).map(Number));
    const publicLeaveTarget = Number(settings.publicLeaveCount || 8);

    const ws = workbook.addWorksheet(`${monthId} 班表`, {
      views:[{showGridLines:false, state:'normal'}],
      pageSetup:{paperSize:9, orientation:'landscape', fitToPage:true, fitToWidth:1, fitToHeight:1, horizontalCentered:true, verticalCentered:false},
      pageMargins:{left:0.2,right:0.2,top:0.25,bottom:0.25,header:0.1,footer:0.1}
    });

    ws.getColumn(1).width = 4.1;
    ws.getColumn(2).width = 10.2;
    ws.getColumn(3).width = 4.5;
    ws.getColumn(4).width = 4.4;
    for (let c = 5; c < 5 + days; c += 1) ws.getColumn(c).width = 4.05;
    const noteCol = 5 + days;
    ws.getColumn(noteCol).width = 5.4;

    const thin = {style:'thin', color:{argb:BLACK}};
    const medium = {style:'medium', color:{argb:BLACK}};
    const baseBorder = {top:thin,left:thin,bottom:thin,right:thin};
    const serif = 'PMingLiU';
    const sans = 'Arial';

    ws.getRow(1).height = 28.5;
    ws.mergeCells(1,1,1,7);
    ws.getCell(1,1).value = `${year} 年 ${month} 月`;
    ws.getCell(1,1).font = {name:serif,size:14};
    ws.getCell(1,1).alignment = {vertical:'bottom',horizontal:'left'};
    const titleStart = 8;
    const titleEnd = Math.max(titleStart, noteCol - 4);
    ws.mergeCells(1,titleStart,1,titleEnd);
    const title = ws.getCell(1,titleStart);
    title.value = '櫃檯人員排班紀錄表';
    title.font = {name:serif,size:18,bold:true};
    title.alignment = {vertical:'bottom',horizontal:'center'};

    let r = 2;
    const tableStart = r;

    // 日期列：保留兩白兩灰；年度休假日改紅字，補班日維持黑字。
    ws.getRow(r).height = 17.25;
    mergeSet(ws,r,1,r,4,'日期',{font:{name:serif,size:10},alignment:{horizontal:'center',vertical:'middle'},border:baseBorder});
    for (let day=1; day<=days; day+=1) {
      const specialType = getAnnualSpecialDayType(sourcePayload,year,month,day);
      const cell = ws.getCell(r,4+day);
      cell.value = day;
      cell.font = {name:sans,size:9,...(specialType === 'holiday' ? {color:{argb:RED},bold:true} : {})};
      cell.alignment = {horizontal:'center',vertical:'middle'};
      cell.fill = solidFill(getDateBandDark(year,month,day) ? GRAY : WHITE);
      cell.border = baseBorder;
    }
    r += 1;

    // 星期列：週末粉底；補班日取消週末粉底；年度休假日紅字。
    ws.getRow(r).height = 17.25;
    mergeSet(ws,r,1,r,4,'星期',{font:{name:serif,size:10},alignment:{horizontal:'center',vertical:'middle'},border:baseBorder});
    for (let day=1; day<=days; day+=1) {
      const dow = new Date(year,month-1,day).getDay();
      const specialType = getAnnualSpecialDayType(sourcePayload,year,month,day);
      const cell = ws.getCell(r,4+day);
      cell.value = WEEKDAYS[dow];
      cell.font = {name:serif,size:9,...(specialType === 'holiday' ? {color:{argb:RED},bold:true} : {})};
      cell.alignment = {horizontal:'center',vertical:'middle'};
      if ((dow === 0 || dow === 6) && specialType !== 'workday') cell.fill = solidFill(PINK);
      else if (specialType === 'workday') cell.fill = solidFill(WHITE);
      cell.border = baseBorder;
    }
    r += 1;

    // 五班。
    for (let shift=0; shift<5; shift+=1) {
      ws.getRow(r).height = 36;
      mergeSet(ws,r,1,r,3,formatShift(shiftRanges[shift]),{
        font:{name:serif,size:14},alignment:{horizontal:'center',vertical:'middle'},border:baseBorder
      });
      const group = ws.getCell(r,4);
      group.value = SHIFT_GROUPS[shift];
      group.font = {name:serif,size:11};
      group.alignment = {horizontal:'center',vertical:'middle'};
      group.border = baseBorder;

      for (let day=1; day<=days; day+=1) {
        const key = `${day}-shift-${shift}`;
        const cell = ws.getCell(r,4+day);
        cell.value = String(data.rosterValues?.[key] || '');
        cell.font = {name:sans,size:14};
        cell.alignment = {horizontal:'center',vertical:'middle'};
        if (isNightGray(data,year,month,day,shift)) cell.fill = solidFill(GRAY);
        if (Array.isArray(data.specialShiftCells) && data.specialShiftCells.includes(key)) cell.fill = solidFill(PINK);
        cell.border = baseBorder;
      }
      r += 1;
    }

    // 休假：Excel 用一格換行呈現上下兩個休假輸入格。
    const vacWeekRow = r;
    const vacBodyRow = r + 1;
    ws.getRow(vacWeekRow).height = 15;
    ws.getRow(vacBodyRow).height = 34.5;
    ws.mergeCells(vacWeekRow,1,vacBodyRow,4);
    const vacLabel = ws.getCell(vacWeekRow,1);
    vacLabel.value = '休　假';
    vacLabel.font = {name:serif,size:17};
    vacLabel.alignment = {horizontal:'center',vertical:'middle'};
    vacLabel.border = baseBorder;

    for (let day=1; day<=days; day+=1) {
      const dow = new Date(year,month-1,day).getDay();
      const specialType = getAnnualSpecialDayType(sourcePayload,year,month,day);
      const top = ws.getCell(vacWeekRow,4+day);
      top.value = WEEKDAYS[dow];
      top.font = {name:serif,size:9,...(specialType === 'holiday' ? {color:{argb:RED},bold:true} : {})};
      top.alignment = {horizontal:'center',vertical:'middle'};
      top.border = baseBorder;
      if ((dow === 0 || dow === 6) && specialType !== 'workday') top.fill = solidFill(PINK);
      else if (specialType === 'workday') top.fill = solidFill(WHITE);

      const v0 = String(data.rosterValues?.[`${day}-vacation-0`] || '');
      const v1 = String(data.rosterValues?.[`${day}-vacation-1`] || '');
      const body = ws.getCell(vacBodyRow,4+day);
      body.value = [v0,v1].join('\n').replace(/^\n|\n$/g,'');
      body.font = {name:sans,size:12};
      body.alignment = {horizontal:'center',vertical:'middle',wrapText:true};
      body.border = baseBorder;

      const blockState = getBlockedState(sourcePayload,data,blockedWeekdays,year,month,day);
      if (blockState.blocked) {
        body.border = {
          ...baseBorder,
          diagonal:{up:true,down:false,style:blockState.supervisor ? 'medium' : 'thin',color:{argb:blockState.supervisor ? FORMAL_RED : BLACK}}
        };
      }

      // Excel 單一 cell 無法讓上下兩行各自套不同字色；只要其中一格是正式請假就整格紅字。
      const t0 = normalizeLeaveType(data.leaveTypeValues?.[`${day}-vacation-0`]);
      const t1 = normalizeLeaveType(data.leaveTypeValues?.[`${day}-vacation-1`]);
      if (t0 === 'leave' || t1 === 'leave') body.font = {name:sans,size:12,color:{argb:FORMAL_RED}};
    }
    r += 2;

    // 下方姓名 / 月初特休 / 長條備註區。
    const lowerStart = r;
    const rowHeight = 33.375;
    const people = normalizePeople(data);
    const specialLeave = Array.from({length:6}, (_,i) => String(data.specialLeaveValues?.[i] ?? ''));
    for (let i=0;i<6;i+=1) {
      ws.getRow(r+i).height = rowHeight;
      const letter = String.fromCharCode(65+i);
      const lc = ws.getCell(r+i,1);
      lc.value = `${letter}.`;
      lc.font = {name:sans,size:12};
      lc.alignment = {horizontal:'center',vertical:'middle'};
      lc.border = baseBorder;

      const nc = ws.getCell(r+i,2);
      nc.value = people[letter]?.displayName || '';
      nc.font = {name:serif,size:12};
      nc.alignment = {horizontal:'left',vertical:'middle'};
      nc.border = baseBorder;

      const ac = ws.getCell(r+i,3);
      ac.value = specialLeave[i];
      ac.font = {name:sans,size:11};
      ac.alignment = {horizontal:'center',vertical:'middle'};
      ac.border = baseBorder;

      const blank = ws.getCell(r+i,4);
      blank.border = baseBorder;
    }

    for (let day=1; day<=days; day+=1) {
      ws.mergeCells(lowerStart,4+day,lowerStart+5,4+day);
      const cell = ws.getCell(lowerStart,4+day);
      const notes = buildNotes(sourcePayload,data,year,month,day,people);
      cell.value = notes.join('\n');
      cell.font = {name:serif,size:8};
      cell.alignment = {horizontal:'center',vertical:'top',wrapText:true};
      cell.border = baseBorder;
    }
    r += 6;

    // 下方日期列：跟正式班表一樣，週末粉底；補班日取消粉底；休假日紅字。
    ws.getRow(r).height = 16.5;
    mergeSet(ws,r,1,r,4,'',{border:baseBorder});
    for (let day=1; day<=days; day+=1) {
      const dow = new Date(year,month-1,day).getDay();
      const specialType = getAnnualSpecialDayType(sourcePayload,year,month,day);
      const cell = ws.getCell(r,4+day);
      cell.value = day;
      cell.font = {name:sans,size:9,...(specialType === 'holiday' ? {color:{argb:RED},bold:true} : {})};
      cell.alignment = {horizontal:'center',vertical:'middle'};
      cell.border = baseBorder;
      if ((dow === 0 || dow === 6) && specialType !== 'workday') cell.fill = solidFill(PINK);
      else if (specialType === 'workday') cell.fill = solidFill(WHITE);
    }
    r += 1;

    // 休假統計：每列三人，共兩列。
    const summaryStart = r;
    const totalMainCols = 4 + days;
    const groups = splitThreeRanges(1,totalMainCols);
    for (let sr=0; sr<2; sr+=1) {
      ws.getRow(r+sr).height = 21.75;
      for (let gi=0; gi<3; gi+=1) {
        const i = sr*3 + gi;
        const letter = String.fromCharCode(65+i);
        const range = groups[gi];
        ws.mergeCells(r+sr,range[0],r+sr,range[1]);
        const cell = ws.getCell(r+sr,range[0]);
        const name = people[letter]?.displayName || `${letter}.`;
        const summary = getLeaveSummary(data,letter,days);
        cell.value = `${name}　公休：${summary.publicCount}　特休：${summary.annualCount}`;
        cell.font = {name:serif,size:10};
        cell.alignment = {horizontal:'left',vertical:'middle'};
        cell.border = baseBorder;
      }
    }
    r += 2;

    // 右側直排說明。
    ws.mergeCells(tableStart,noteCol,r-1,noteCol);
    const side = ws.getCell(tableStart,noteCol);
    side.value = `請每人先各排 ${publicLeaveTarget} 天月假，等大家全部都排完再排特休。`;
    side.font = {name:serif,size:11};
    side.alignment = {horizontal:'center',vertical:'middle',textRotation:'vertical',wrapText:true};
    side.border = {top:medium,left:medium,bottom:medium,right:medium};

    applyOuterBorder(ws, tableStart, 1, summaryStart+1, totalMainCols, medium);
    ws.pageSetup.printArea = `A1:${colName(noteCol)}${r-1}`;
    ws.headerFooter.oddFooter = '&C&8';
  }

  function normalizePeople(data) {
    const result = {};
    for (const letter of ['A','B','C','D','E','F']) {
      const p = data.people?.[letter] || {};
      result[letter] = {
        displayName:String(p.displayName || ''),
        employeeId:String(p.employeeId || '')
      };
    }
    return result;
  }

  function formatShift(value) {
    return String(value || '').replace(/\s+/g,'').replace('~',' ~ ');
  }

  function solidFill(argb) {
    return {type:'pattern',pattern:'solid',fgColor:{argb}};
  }

  function mergeSet(ws,r1,c1,r2,c2,value,style={}) {
    ws.mergeCells(r1,c1,r2,c2);
    const cell = ws.getCell(r1,c1);
    cell.value = value;
    Object.assign(cell,style);
    return cell;
  }

  function getDateBandDark(year,month,day) {
    const anchor = Date.UTC(2026,9,1);
    const current = Date.UTC(year,month-1,day);
    const diff = Math.floor((current-anchor)/86400000);
    const pair = Math.floor(diff/2);
    return Math.abs(pair % 2) === 1;
  }

  function pad2(value) {
    return String(value).padStart(2,'0');
  }

  function getAnnualSpecialDayType(sourcePayload,year,month,day) {
    const data = sourcePayload?.specialDays?.[String(year)];
    const key = `${year}-${pad2(month)}-${pad2(day)}`;
    if (Array.isArray(data?.holidays) && data.holidays.includes(key)) return 'holiday';
    if (Array.isArray(data?.workdays) && data.workdays.includes(key)) return 'workday';
    return '';
  }

  function getBlockedState(sourcePayload,data,blockedWeekdays,year,month,day) {
    const supervisor = Array.isArray(data.supervisorLeaveDays) && data.supervisorLeaveDays.map(Number).includes(Number(day));
    if (supervisor) return {blocked:true,supervisor:true};

    const override = data.blockedVacationOverrides?.[String(day)];
    if (typeof override === 'boolean') return {blocked:override,supervisor:false};

    const specialType = getAnnualSpecialDayType(sourcePayload,year,month,day);
    if (specialType === 'holiday') return {blocked:true,supervisor:false};
    if (specialType === 'workday') return {blocked:false,supervisor:false};
    const dow = new Date(year,month-1,day).getDay();
    return {blocked:blockedWeekdays.has(dow),supervisor:false};
  }

  function isNightGray(data,year,month,day,shift) {
    const key = `${day}-night-${shift}`;
    const override = data.nightShiftOverrides?.[key];
    if (typeof override === 'boolean') return override;
    return shift === 3 && new Date(year,month-1,day).getDay() === 6;
  }

  function normalizeLeaveType(value) {
    const type = String(value || 'public');
    if (type === 'annual') return 'annual';
    if (type === 'public' || type === 'exceptionPublic') return type;
    return 'leave';
  }

  function getLeaveSummary(data,letter,days) {
    let publicCount = 0;
    let annualCount = 0;
    for (let day=1;day<=days;day+=1) {
      for (let slot=0;slot<2;slot+=1) {
        const key = `${day}-vacation-${slot}`;
        if (String(data.rosterValues?.[key] || '') !== letter) continue;
        const type = normalizeLeaveType(data.leaveTypeValues?.[key]);
        if (type === 'annual') annualCount += 1;
        else if (type === 'public' || type === 'exceptionPublic') publicCount += 1;
      }
      const extra = data.extraLeaves?.[String(day)];
      if (extra && String(extra.letter || '') === letter) {
        const type = normalizeLeaveType(extra.type);
        if (type === 'annual') annualCount += 1;
        else if (type === 'public' || type === 'exceptionPublic') publicCount += 1;
      }
    }
    return {publicCount,annualCount};
  }

  function buildNotes(sourcePayload,data,year,month,day,people) {
    const groups = [];

    for (let shift=0;shift<5;shift+=1) {
      const letter = String(data.rosterValues?.[`${day}-shift-${shift}`] || '');
      if (!letter) continue;
      const specialTime = data.specialShiftTimes?.[`${day}-shift-${shift}`];
      const nightTime = data.nightShiftTimes?.[`${day}-night-${shift}`];
      if (specialTime) groups.push(timeNote(letter,specialTime));
      if (nightTime) groups.push(timeNote(letter,nightTime));
    }

    for (let slot=0;slot<2;slot+=1) {
      const key = `${day}-vacation-${slot}`;
      const letter = String(data.rosterValues?.[key] || '');
      if (!letter) continue;
      const type = normalizeLeaveType(data.leaveTypeValues?.[key]);
      const note = String(data.leaveNoteValues?.[key] || '');
      if (type === 'annual') groups.push(`${letter}\n特\n休`);
      else if (type === 'leave') groups.push(`${letter}\n${Array.from(note || '請假').join('\n')}`);
    }

    const extra = data.extraLeaves?.[String(day)];
    if (extra?.letter) {
      const type = normalizeLeaveType(extra.type);
      if (type === 'annual') groups.push(`${extra.letter}\n特\n休`);
      else if (type === 'leave') groups.push(`${extra.letter}\n${Array.from(extra.note || '請假').join('\n')}`);
      else groups.push(`${extra.letter}\n公\n休`);
    }

    // 正式班表依員工到職日直接顯示取得事件，不依「累加 / 重置」是否已做決定。
    for (const letter of ['A','B','C','D','E','F']) {
      const employeeId = people[letter]?.employeeId || '';
      if (!employeeId) continue;
      const record = sourcePayload?.employees?.[employeeId];
      const grant = getAnnualGrantEventForRecord(sourcePayload,record,year,month);
      if (grant && Number(grant.day) === day && Number(grant.days) > 0) {
        groups.push(`${letter}\n${grant.days}`);
      }
    }

    const supervisor = sourcePayload?.employees?.emp_supervisor;
    if (supervisor?.role === 'supervisor') {
      const grant = getAnnualGrantEventForRecord(sourcePayload,supervisor,year,month);
      const code = cleanSupervisorCode(supervisor.code || '');
      const days = grant ? Math.ceil(Number(grant.days || 0) / 2) : 0;
      if (grant && Number(grant.day) === day && days > 0 && code) groups.push(`${code}\n${days}`);
    }

    if ((data.meetingDays || []).map(Number).includes(day)) {
      const text = String(data.meetingNoteValues?.[String(day)] || sourcePayload.settings?.meetingDefaultText || '8點櫃檯開會');
      groups.push(Array.from(text).join('\n'));
    }

    const manual = String(data.manualNotes?.[String(day)] || '');
    if (manual) groups.push(Array.from(manual).join('\n'));
    return groups;
  }

  function timeNote(letter,range) {
    const [start,end] = String(range).replace(/\s+/g,'').split('~');
    return `${letter}\n${start || ''}\n│\n${end || ''}`;
  }

  function addMonthsClamped(date,months) {
    const year = date.getFullYear();
    const month = date.getMonth() + months;
    const day = date.getDate();
    const lastDay = new Date(year,month+1,0).getDate();
    return new Date(year,month,Math.min(day,lastDay));
  }

  function addYearsClamped(date,years) {
    const year = date.getFullYear() + years;
    const month = date.getMonth();
    const day = date.getDate();
    const lastDay = new Date(year,month+1,0).getDate();
    return new Date(year,month,Math.min(day,lastDay));
  }

  function getAnnualRules(sourcePayload) {
    const saved = isPlainObject(sourcePayload?.settings?.annualLeaveRules) ? sourcePayload.settings.annualLeaveRules : {};
    return {...DEFAULT_ANNUAL_LEAVE_RULES,...saved};
  }

  function getAnnualGrantDaysForYears(sourcePayload,years) {
    const rules = getAnnualRules(sourcePayload);
    if (years === 1) return Number(rules.year1 || 0);
    if (years === 2) return Number(rules.year2 || 0);
    if (years >= 3 && years < 5) return Number(rules.years3to4 || 0);
    if (years >= 5 && years < 10) return Number(rules.years5to9 || 0);
    if (years >= 10) return Math.min(Number(rules.maxDays || 0), Number(rules.year10Base || 0) + (years - 10) * Number(rules.after10Increment || 0));
    return 0;
  }

  function getAnnualGrantEventForRecord(sourcePayload,record,year,month) {
    const match = String(record?.hireDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const hireDate = new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    if (Number.isNaN(hireDate.getTime())) return null;
    const rules = getAnnualRules(sourcePayload);
    const sixMonth = addMonthsClamped(hireDate,6);
    if (sixMonth.getFullYear() === year && sixMonth.getMonth()+1 === month) {
      return {day:sixMonth.getDate(),days:Number(rules.sixMonths || 0)};
    }
    for (let years=1;years<=80;years+=1) {
      const anniversary = addYearsClamped(hireDate,years);
      if (anniversary.getFullYear() > year) break;
      if (anniversary.getFullYear() === year && anniversary.getMonth()+1 === month) {
        return {day:anniversary.getDate(),days:getAnnualGrantDaysForYears(sourcePayload,years)};
      }
    }
    return null;
  }

  function cleanSupervisorCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z]/g,'').slice(0,1);
  }

  function splitThreeRanges(start,end) {
    const count = end-start+1;
    const base = Math.floor(count/3);
    const rem = count%3;
    const out=[];
    let cursor=start;
    for (let i=0;i<3;i+=1) {
      const size=base+(i<rem?1:0);
      out.push([cursor,cursor+size-1]);
      cursor+=size;
    }
    return out;
  }

  function applyOuterBorder(ws,r1,c1,r2,c2,edge) {
    for (let c=c1;c<=c2;c+=1) {
      ws.getCell(r1,c).border = {...ws.getCell(r1,c).border,top:edge};
      ws.getCell(r2,c).border = {...ws.getCell(r2,c).border,bottom:edge};
    }
    for (let r=r1;r<=r2;r+=1) {
      ws.getCell(r,c1).border = {...ws.getCell(r,c1).border,left:edge};
      ws.getCell(r,c2).border = {...ws.getCell(r,c2).border,right:edge};
    }
  }

  function colName(number) {
    let n = number;
    let name = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }

  function setStatus(message,type='') {
    status.textContent = message;
    status.className = `status ${type}`.trim();
  }

  function downloadBlob(blob,filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  // 保留一個很小的公開入口，之後接回班表時可以直接重用 renderer，避免再複製一份邏輯。
  window.EliteHotelRosterExcel = Object.freeze({
    validate,
    buildMonthSheet
  });
})();
