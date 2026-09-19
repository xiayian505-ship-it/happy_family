(() => {
  'use strict';

  const fileInput = document.querySelector('#fileInput');
  const fileName = document.querySelector('#fileName');
  const exportBtn = document.querySelector('#exportBtn');
  const clearBtn = document.querySelector('#clearBtn');
  const monthSelect = document.querySelector('#monthSelect');
  const preview = document.querySelector('#preview');
  const status = document.querySelector('#status');

  let sourceData = null;
  let sourceBaseName = 'roster';

  const WEEKDAY_ZH = ['日','一','二','三','四','五','六'];

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function assertRosterJson(data) {
    if (!data || typeof data !== 'object') throw new Error('JSON 根節點不是物件。');
    if (!data.months || typeof data.months !== 'object') throw new Error('找不到 months，這不是目前支援的班表 JSON。');
    const keys = Object.keys(data.months);
    if (!keys.length) throw new Error('months 裡沒有月份資料。');
    for (const key of keys) {
      const month = data.months[key];
      if (!month || typeof month !== 'object' || !month.rosterValues || typeof month.rosterValues !== 'object') {
        throw new Error(`${key} 缺少 rosterValues。`);
      }
    }
  }

  function getMonthParts(monthKey) {
    const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
    if (!match) throw new Error(`月份格式無法辨識：${monthKey}`);
    return { year: Number(match[1]), month: Number(match[2]) };
  }

  function daysInMonth(monthKey) {
    const { year, month } = getMonthParts(monthKey);
    return new Date(year, month, 0).getDate();
  }

  function weekdayFor(monthKey, day) {
    const { year, month } = getMonthParts(monthKey);
    return WEEKDAY_ZH[new Date(year, month - 1, day).getDay()];
  }

  // 將 sparse key（例如 2-vacation-0 / 3-shift-1）還原成二維矩陣。
  // 這一層只理解 key 結構，不碰 Excel API，日後可獨立抽成 adapter。
  function buildRosterGrid(monthKey, monthData) {
    const dayCount = daysInMonth(monthKey);
    const parsed = [];

    Object.entries(monthData.rosterValues || {}).forEach(([key, value]) => {
      const m = /^(\d+)-([^-]+)-(\d+)$/.exec(key);
      if (!m) return;
      const day = Number(m[1]);
      const group = m[2];
      const slot = Number(m[3]);
      if (day < 1 || day > dayCount) return;
      parsed.push({ day, group, slot, value });
    });

    const rowKeys = [...new Set(parsed.map(x => `${x.group}-${x.slot}`))]
      .map(key => {
        const m = /^(.+)-(\d+)$/.exec(key);
        return { key, group: m[1], slot: Number(m[2]) };
      })
      .sort((a,b) => {
        const order = { vacation: 0, shift: 1 };
        const ao = order[a.group] ?? 50;
        const bo = order[b.group] ?? 50;
        return ao - bo || a.group.localeCompare(b.group) || a.slot - b.slot;
      });

    const labelCounts = {};
    rowKeys.forEach(r => { labelCounts[r.group] = (labelCounts[r.group] || 0) + 1; });

    function rowLabel(row) {
      const names = { vacation: '排休', shift: '班次' };
      const base = names[row.group] || row.group;
      return labelCounts[row.group] > 1 ? `${base} ${row.slot + 1}` : base;
    }

    const rows = rowKeys.map(r => ({
      ...r,
      label: rowLabel(r),
      cells: Array(dayCount).fill('')
    }));
    const rowMap = new Map(rows.map(r => [r.key, r]));

    parsed.forEach(item => {
      const row = rowMap.get(`${item.group}-${item.slot}`);
      if (row) row.cells[item.day - 1] = item.value ?? '';
    });

    return {
      monthKey,
      dayCount,
      weekdays: Array.from({ length: dayCount }, (_, i) => weekdayFor(monthKey, i + 1)),
      rows,
      people: monthData.people || {}
    };
  }

  function renderMonth(monthKey) {
    const monthData = sourceData.months[monthKey];
    const grid = buildRosterGrid(monthKey, monthData);
    const legend = Object.entries(grid.people)
      .map(([code, p]) => `<span><b>${escapeHtml(code)}</b> ${escapeHtml(p.displayName || '')}</span>`)
      .join('');

    const headerDays = Array.from({length:grid.dayCount},(_,i)=>`<th>${i+1}</th>`).join('');
    const weekdays = grid.weekdays.map(v => `<td>${escapeHtml(v)}</td>`).join('');
    const bodyRows = grid.rows.map(row => {
      const cells = row.cells.map(v => `<td>${escapeHtml(v)}</td>`).join('');
      return `<tr><td>${escapeHtml(row.label)}</td>${cells}</tr>`;
    }).join('');

    preview.classList.remove('empty');
    preview.innerHTML = `
      <div class="legend">${legend || '<span>無人員對照資料</span>'}</div>
      <table>
        <thead><tr><th>項目</th>${headerDays}</tr></thead>
        <tbody>
          <tr><td>星期</td>${weekdays}</tr>
          ${bodyRows}
        </tbody>
      </table>`;
  }

  function safeSheetName(name, used) {
    let result = String(name).replace(/[\\/?*\[\]:]/g, '-').slice(0,31) || 'Sheet';
    let suffix = 2;
    const base = result;
    while (used.has(result)) {
      const tail = `_${suffix++}`;
      result = `${base.slice(0,31-tail.length)}${tail}`;
    }
    used.add(result);
    return result;
  }

  function styleBorder(cell) {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD7DDDA' } },
      left: { style: 'thin', color: { argb: 'FFD7DDDA' } },
      bottom: { style: 'thin', color: { argb: 'FFD7DDDA' } },
      right: { style: 'thin', color: { argb: 'FFD7DDDA' } }
    };
  }

  function addRosterWorksheet(workbook, monthKey, monthData, usedNames) {
    const grid = buildRosterGrid(monthKey, monthData);
    const ws = workbook.addWorksheet(safeSheetName(monthKey, usedNames), {
      views: [{ state:'frozen', xSplit:1, ySplit:6 }],
      pageSetup: { orientation:'landscape', fitToPage:true, fitToWidth:1, fitToHeight:0 }
    });

    const lastCol = grid.dayCount + 1;
    ws.mergeCells(1,1,1,lastCol);
    const title = ws.getCell(1,1);
    title.value = `${monthKey} 班表`;
    title.font = { bold:true, size:16, color:{argb:'FF25302E'} };
    title.alignment = { horizontal:'left', vertical:'middle' };
    ws.getRow(1).height = 26;

    // 人員對照：保留 A/B/C...，不替換班表格子內容。
    const people = Object.entries(grid.people);
    ws.getCell(3,1).value = '人員對照';
    ws.getCell(3,1).font = { bold:true };
    people.forEach(([code,p],i) => {
      const col = 2 + i * 2;
      ws.getCell(3,col).value = code;
      ws.getCell(3,col).font = { bold:true };
      ws.getCell(3,col+1).value = p.displayName || '';
    });

    const headerRow = 5;
    ws.getCell(headerRow,1).value = '項目';
    for (let d=1; d<=grid.dayCount; d++) ws.getCell(headerRow,d+1).value = d;

    const weekdayRow = 6;
    ws.getCell(weekdayRow,1).value = '星期';
    grid.weekdays.forEach((v,i) => ws.getCell(weekdayRow,i+2).value = v);

    grid.rows.forEach((row, ri) => {
      const r = weekdayRow + 1 + ri;
      ws.getCell(r,1).value = row.label;
      row.cells.forEach((v,i) => ws.getCell(r,i+2).value = v);
    });

    const tableEndRow = weekdayRow + grid.rows.length;
    for (let r=headerRow; r<=tableEndRow; r++) {
      for (let c=1; c<=lastCol; c++) {
        const cell = ws.getCell(r,c);
        styleBorder(cell);
        cell.alignment = { horizontal:'center', vertical:'middle' };
        if (r === headerRow) {
          cell.font = { bold:true, color:{argb:'FFFFFFFF'} };
          cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF536D78'} };
        } else if (c === 1) {
          cell.font = { bold:true };
          cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFF3F1EC'} };
        } else if (r === weekdayRow) {
          cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFE7EEF0'} };
        }
      }
    }

    ws.getColumn(1).width = 12;
    for (let c=2; c<=lastCol; c++) ws.getColumn(c).width = 5.2;
    ws.getRow(headerRow).height = 22;
    ws.getRow(weekdayRow).height = 21;

    // 週六、週日僅做淡色提示，不改資料。
    grid.weekdays.forEach((wd,i) => {
      if (wd === '六' || wd === '日') {
        const c = i + 2;
        for (let r=headerRow; r<=tableEndRow; r++) {
          const cell = ws.getCell(r,c);
          if (r !== headerRow) cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFF7F3EB'} };
        }
      }
    });
  }

  async function exportWorkbook() {
    if (!sourceData) return;
    if (!window.ExcelJS) {
      status.textContent = 'ExcelJS 載入失敗，請確認目前有網路後重試。';
      return;
    }

    exportBtn.disabled = true;
    status.textContent = '正在產生表格 Excel…';
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'JSON roster to Excel v2';
      wb.created = new Date();
      const used = new Set();

      Object.entries(sourceData.months).forEach(([monthKey, monthData]) => {
        addRosterWorksheet(wb, monthKey, monthData, used);
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourceBaseName}_table.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = `完成：共匯出 ${Object.keys(sourceData.months).length} 個月份工作表。`;
    } catch (err) {
      console.error(err);
      status.textContent = `匯出失敗：${err.message}`;
    } finally {
      exportBtn.disabled = false;
    }
  }

  function clearAll() {
    sourceData = null;
    sourceBaseName = 'roster';
    fileInput.value = '';
    fileName.textContent = '尚未選擇檔案';
    exportBtn.disabled = true;
    clearBtn.disabled = true;
    monthSelect.disabled = true;
    monthSelect.innerHTML = '';
    preview.className = 'preview empty';
    preview.textContent = '載入 JSON 後會在這裡預覽班表。';
    status.textContent = '';
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      status.textContent = '讀取中…';
      const text = await file.text();
      const data = JSON.parse(text);
      assertRosterJson(data);
      sourceData = data;
      sourceBaseName = file.name.replace(/\.json$/i,'') || 'roster';
      fileName.textContent = file.name;

      const months = Object.keys(data.months).sort();
      monthSelect.innerHTML = months.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
      monthSelect.disabled = false;
      exportBtn.disabled = false;
      clearBtn.disabled = false;
      renderMonth(months[0]);
      status.textContent = `已讀取 ${months.length} 個月份。這版會還原成橫向日期表格。`;
    } catch (err) {
      console.error(err);
      clearAll();
      fileName.textContent = file.name;
      status.textContent = `讀取失敗：${err.message}`;
    }
  });

  monthSelect.addEventListener('change', () => renderMonth(monthSelect.value));
  exportBtn.addEventListener('click', exportWorkbook);
  clearBtn.addEventListener('click', clearAll);

  // 方便未來抽軍火庫時直接拿 adapter 做測試。
  window.SlowlyRosterGrid = { buildRosterGrid };
})();
