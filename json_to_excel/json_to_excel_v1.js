(() => {
  "use strict";

  const MAX_PREVIEW_ROWS = 12;
  const INVALID_SHEET_CHARS = /[\\/?*\[\]:]/g;

  function getType(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value === "object" ? "object" : typeof value;
  }

  function cellValue(value) {
    if (value === null) return null;
    if (["string", "number", "boolean"].includes(typeof value)) return value;
    return JSON.stringify(value);
  }

  function flattenRecord(obj, prefix = "", output = {}) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
      output[prefix || "value"] = cellValue(obj);
      return output;
    }

    const entries = Object.entries(obj);
    if (!entries.length) {
      output[prefix || "value"] = "{}";
      return output;
    }

    for (const [key, value] of entries) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        flattenRecord(value, path, output);
      } else {
        output[path] = cellValue(value);
      }
    }
    return output;
  }

  function normalizeArray(arr) {
    if (!arr.length) return [{ value: "" }];
    return arr.map((item, index) => {
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        return flattenRecord(item);
      }
      return { index, value: cellValue(item) };
    });
  }

  function objectSectionToRows(obj) {
    const entries = Object.entries(obj);
    if (!entries.length) return [{ key: "", value: "" }];

    const isObjectMap = entries.every(([, value]) =>
      value !== null && typeof value === "object" && !Array.isArray(value)
    );

    if (isObjectMap) {
      return entries.map(([key, value]) => ({ _key: key, ...flattenRecord(value) }));
    }

    return entries.map(([key, value]) => ({
      key,
      type: getType(value),
      value: cellValue(value)
    }));
  }

  function safeSheetName(input, usedNames) {
    const base = String(input || "Sheet")
      .replace(INVALID_SHEET_CHARS, "_")
      .trim()
      .slice(0, 31) || "Sheet";

    let name = base;
    let counter = 2;
    while (usedNames.has(name)) {
      const suffix = `_${counter++}`;
      name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    }
    usedNames.add(name);
    return name;
  }

  function buildSmartSheets(data) {
    const usedNames = new Set();
    const sheets = [];

    if (Array.isArray(data)) {
      sheets.push({ name: safeSheetName("data", usedNames), rows: normalizeArray(data) });
      return sheets;
    }

    if (data === null || typeof data !== "object") {
      sheets.push({ name: safeSheetName("data", usedNames), rows: [{ value: cellValue(data) }] });
      return sheets;
    }

    const rootRows = [];

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        sheets.push({ name: safeSheetName(key, usedNames), rows: normalizeArray(value) });
      } else if (value !== null && typeof value === "object") {
        sheets.push({ name: safeSheetName(key, usedNames), rows: objectSectionToRows(value) });
      } else {
        rootRows.push({ key, type: getType(value), value: cellValue(value) });
      }
    }

    if (rootRows.length) {
      sheets.unshift({ name: safeSheetName("_root", usedNames), rows: rootRows });
    }

    if (!sheets.length) {
      sheets.push({ name: safeSheetName("data", usedNames), rows: [{ value: "" }] });
    }

    return sheets;
  }

  function collectPaths(value, path = "$", rows = []) {
    const type = getType(value);

    if (value === null || typeof value !== "object") {
      rows.push({ path, type, value: cellValue(value) });
      return rows;
    }

    if (Array.isArray(value)) {
      if (!value.length) rows.push({ path, type: "array", value: "[]" });
      value.forEach((item, index) => collectPaths(item, `${path}[${index}]`, rows));
      return rows;
    }

    const entries = Object.entries(value);
    if (!entries.length) {
      rows.push({ path, type: "object", value: "{}" });
      return rows;
    }

    for (const [key, child] of entries) {
      const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
      collectPaths(child, `${path}${safeKey}`, rows);
    }
    return rows;
  }

  function buildPathSheets(data) {
    return [{ name: "paths", rows: collectPaths(data) }];
  }

  function buildSheets(data, mode = "smart") {
    return mode === "paths" ? buildPathSheets(data) : buildSmartSheets(data);
  }

  function rowsToWorksheet(rows) {
    const worksheet = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
    const headers = rows.length ? Object.keys(rows[0]) : ["value"];

    worksheet["!cols"] = headers.map((header) => ({
      wch: Math.min(40, Math.max(10, String(header).length + 2))
    }));

    return worksheet;
  }

  function exportWorkbook(data, options = {}) {
    if (typeof XLSX === "undefined") {
      throw new Error("SheetJS 尚未載入，請確認網路連線後重試。");
    }

    const mode = options.mode || "smart";
    const fileName = options.fileName || "json_export.xlsx";
    const sheets = buildSheets(data, mode);
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
      XLSX.utils.book_append_sheet(workbook, rowsToWorksheet(sheet.rows), sheet.name);
    }

    XLSX.writeFile(workbook, fileName);
    return sheets;
  }

  window.SlowlyJsonExcel = {
    getType,
    buildSheets,
    buildSmartSheets,
    buildPathSheets,
    exportWorkbook
  };

  const els = {
    file: document.getElementById("jsonFile"),
    mode: document.getElementById("mode"),
    exportBtn: document.getElementById("exportBtn"),
    clearBtn: document.getElementById("clearBtn"),
    fileName: document.getElementById("fileName"),
    rootType: document.getElementById("rootType"),
    sheetCount: document.getElementById("sheetCount"),
    statusText: document.getElementById("statusText"),
    sheetSelect: document.getElementById("sheetSelect"),
    previewTitle: document.getElementById("previewTitle"),
    previewEmpty: document.getElementById("previewEmpty"),
    tableWrap: document.getElementById("tableWrap"),
    previewTable: document.getElementById("previewTable")
  };

  const state = {
    data: null,
    sourceName: "",
    sheets: []
  };

  function setStatus(message, isError = false) {
    els.statusText.textContent = message;
    els.statusText.classList.toggle("error", isError);
  }

  function workbookName() {
    const base = (state.sourceName || "json_export").replace(/\.json$/i, "");
    return `${base}.xlsx`;
  }

  function refreshSheets() {
    if (state.data === null) return;
    state.sheets = buildSheets(state.data, els.mode.value);
    els.sheetCount.textContent = String(state.sheets.length);
    els.sheetSelect.innerHTML = "";

    state.sheets.forEach((sheet, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${sheet.name} (${sheet.rows.length})`;
      els.sheetSelect.appendChild(option);
    });

    els.sheetSelect.disabled = false;
    renderPreview(0);
  }

  function renderPreview(index) {
    const sheet = state.sheets[index];
    if (!sheet) return;

    const rows = sheet.rows.slice(0, MAX_PREVIEW_ROWS);
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    els.previewTitle.textContent = `${sheet.name} · ${sheet.rows.length} 列`;
    els.previewTable.innerHTML = "";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      headers.forEach((header) => {
        const td = document.createElement("td");
        const value = row[header];
        td.textContent = value === null || value === undefined ? "" : String(value);
        td.title = td.textContent;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    els.previewTable.append(thead, tbody);
    els.previewEmpty.hidden = true;
    els.tableWrap.hidden = false;
  }

  function reset() {
    state.data = null;
    state.sourceName = "";
    state.sheets = [];
    els.file.value = "";
    els.fileName.textContent = "尚未選擇";
    els.rootType.textContent = "—";
    els.sheetCount.textContent = "—";
    els.sheetSelect.innerHTML = "";
    els.sheetSelect.disabled = true;
    els.exportBtn.disabled = true;
    els.clearBtn.disabled = true;
    els.previewTitle.textContent = "尚無資料";
    els.previewEmpty.hidden = false;
    els.tableWrap.hidden = true;
    els.previewTable.innerHTML = "";
    setStatus("等待 JSON");
  }

  els.file.addEventListener("change", async () => {
    const file = els.file.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      state.data = parsed;
      state.sourceName = file.name;
      els.fileName.textContent = file.name;
      els.rootType.textContent = getType(parsed);
      els.exportBtn.disabled = false;
      els.clearBtn.disabled = false;
      setStatus("JSON 解析成功");
      refreshSheets();
    } catch (error) {
      reset();
      els.fileName.textContent = file.name;
      setStatus(`解析失敗：${error.message}`, true);
    }
  });

  els.mode.addEventListener("change", refreshSheets);
  els.sheetSelect.addEventListener("change", () => renderPreview(Number(els.sheetSelect.value)));
  els.clearBtn.addEventListener("click", reset);

  els.exportBtn.addEventListener("click", () => {
    if (state.data === null) return;
    try {
      exportWorkbook(state.data, {
        mode: els.mode.value,
        fileName: workbookName()
      });
      setStatus("Excel 已產生");
    } catch (error) {
      setStatus(`匯出失敗：${error.message}`, true);
    }
  });
})();
