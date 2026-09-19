# EliteHotel JSON → 同版 Excel v3

這一版不是通用 JSON 轉 Excel。

目標：讀取 `elitehotel-shift-roster-v3` / `schemaVersion: 3` 的班表備份 JSON，將資料重新排成目前正式 HTML 班表的 Excel 版型。

## 使用

1. 開啟 `json_roster_to_excel_v3.html`
2. 選擇 EliteHotel 匯出的 JSON
3. 若 JSON 含多個月份，可選月份
4. 按「匯出同版 Excel」

## 已對齊正式班表的項目

- 年月 +「櫃檯人員排班紀錄表」標題
- 日期列兩白兩灰，跨月份延續
- 星期六／星期日粉紅底
- 5 個班別 + 早／中／中／夜／夜
- 大夜週六灰底與 override
- 特殊班粉紅底
- 休假區、兩格休假內容、禁休斜線
- A~F 姓名 + 本月特休數字
- 下方長條備註（特殊時間、假別、開會、手動備註）
- 下方日期列
- 每人公休／特休統計
- 右側直排「請每人先各排…」說明
- A4 橫式、單頁寬度列印設定

## 限制

HTML 與 Excel 使用不同排版／字型渲染引擎，所以字距不可能像圖片那樣逐像素完全一致。這一版採真正 Excel 儲存格，不是把 HTML 截圖塞進 Excel，因此內容仍可編輯。

工具使用 ExcelJS 4.4.0 CDN；第一次開啟需要網路載入 ExcelJS。
