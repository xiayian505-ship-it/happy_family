班表 Excel → JSON 測試轉換器 v1

目的
- 完全獨立於 shift_roster_v1，不修改目前班表程式。
- 讀取「目前班表自己匯出的 .xlsx」。
- 轉成 schemaVersion 3 / elitehotel-shift-roster-v3 的完整 JSON，方便拿現行 JSON 匯入器做結構與規則壓測。

開啟方式
1. 開啟 excel_to_roster_json.html。
2. 選擇班表系統匯出的 .xlsx。
3. 工具會解析目前月份並顯示 JSON 預覽與無法唯一反推的提醒。
4. 按「匯出 JSON」。

目前可直接讀回
- 月份
- 五個班別時間（Excel 左側 5 列）
- 五個班別每天的 A～F
- 休假格每天最多兩位 A～F
- A～F 姓名
- 左下特休數字欄
- 粉底特殊班格
- 可由灰底外觀與既定預設推回的 nightShiftOverrides
- 部分可無歧義辨識的特休／請假類型
- 部分可無歧義對應到粉／灰班格的特殊時間
- 年資資訊有列出時，可讀回櫃檯人員到職日
- 每人先排 N 天月假的 N

目前 Excel 沒有保存完整原始資料，因此 v1 不硬猜
- settings 全套：連勤上限、轉班最低時數、禁休假別、完整禁休星期來源、特休級距、開會預設文字等
- blockedVacationOverrides 的真正來源（Excel 只有最後畫出的斜線）
- supervisorLeaveDays（目前 Excel 無法和一般禁休斜線唯一區分）
- specialDays 整年度原始設定（單月 Excel 只有畫面結果）
- annualGrantDecisions 的 accumulate/reset 決策
- annualBalanceCalibrations
- 長條備註中無法唯一區分的開會／手動備註／主管事件
- 沒有本月排班紀錄的人，其固定班別無法從 Excel 唯一推回

重要：為什麼現在 JSON 還會有 settings？
- 現行班表的 JSON 匯入使用 replaceAll()，validateBackup() 也要求 settings / employees / months / specialDays 都存在。
- 所以這支「測試工具」為了讓現行匯入器吃得下，會對 Excel 沒有的 settings 補目前程式預設值。
- 這代表：現在拿測試 JSON 匯入主班表，仍會覆蓋設定。只適合壓測，不適合正式資料流程。

正式整合應該怎麼做
- Excel 匯入不應走 replaceAll()。
- 正式流程應是：Excel -> parser -> monthData -> ShiftRosterStorage.saveMonth(monthData)。
- 既有 settings、employees、其他月份、specialDays 全部保留。
- 人員 employeeId 應由現有資料依姓名／槽位對應，而不是使用這支測試工具建立的 emp_excel_a～f。

依賴
- ExcelJS 4.4.0 CDN（和目前班表 Excel 匯出相同）。
