# JSON 班表 → Excel v2

這是獨立測試工具，不會修改班表主程式，也不會寫回原始 JSON。

## 用法
1. 開啟 `json_roster_to_excel_v2.html`
2. 選擇 EliteHotel 班表 JSON
3. 畫面會先以「日期橫向、項目縱向」預覽
4. 按「匯出表格 Excel」

## 這版和 v1 的差別
v1 是通用 JSON flatten：適合檢查資料結構，但不會知道班表的視覺結構。

v2 針對目前班表 JSON 的 `months -> rosterValues`，解析像：

- `2-vacation-0`
- `3-shift-1`

這種 sparse key，重新組成二維表格。

## 不會做的事
- 不修改 JSON
- 不修改正式班表 HTML / CSS / JS
- 不猜 `shift-0` 一定是早班、`shift-1` 一定是中班，所以 Excel 先標示為「班次 1 / 班次 2」
- 不把 A/B/C 直接改成姓名；人員姓名另列對照，避免改變原始班表值

## 可能的軍火庫拆法
如果測試方向正確，可再拆成：

1. `roster-grid-adapter.js`：sparse JSON key → 二維 grid
2. `excel-export.js`：二維 grid → `.xlsx`
3. 測試台 UI 留在專案，不進軍火庫

## 相依
ExcelJS 4.4.0（CDN），用於瀏覽器端產生 `.xlsx` 與基本 Excel 樣式。
