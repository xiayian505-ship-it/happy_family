# JSON → Excel v1

獨立瀏覽器測試工具，不依賴後端。

## 檔案

- `json_to_excel_v1.html`：測試介面
- `json_to_excel_v1.css`：外觀
- `json_to_excel_v1.js`：JSON 解析、表格整理、Excel 匯出

## 使用方式

1. 開啟 `json_to_excel_v1.html`
2. 選擇 `.json` 檔案
3. 選擇轉換模式
4. 查看預覽
5. 按「匯出 Excel」

## 轉換模式

### 智慧分頁

- 根節點陣列：輸出成一張 `data` 工作表
- 根節點物件：頂層區塊分成多張工作表
- 物件 map（例如 id -> record）：每個 record 變一列，key 放在 `_key`
- 巢狀物件欄位會用 `a.b.c` 展開
- 陣列會保留成 JSON 字串，避免擅自猜測資料語意

### 完整路徑

把所有葉節點輸出成：

- `path`
- `type`
- `value`

適合檢查資料是否完整，以及處理結構很深、語意不固定的 JSON。

## 核心 API

載入 JS 後會提供：

```js
window.SlowlyJsonExcel.buildSheets(data, "smart");
window.SlowlyJsonExcel.buildSheets(data, "paths");
window.SlowlyJsonExcel.exportWorkbook(data, {
  mode: "smart",
  fileName: "example.xlsx"
});
```

## 相依套件

使用 SheetJS Community Edition `0.20.3`，目前由官方 CDN 載入。

若之後要正式收進軍火庫，可再決定：

- 保留外部 CDN
- 或把 SheetJS 本地化，讓工具可離線使用

## v1 原則

這版刻意不包含任何旅館班表專用欄位或規則，先驗證「任意 JSON → Excel」這個單一功能。
