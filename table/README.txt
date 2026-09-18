shift_roster_v1

檔案：
- shift_roster_v1.html：頁面結構
- shift_roster_v1.css：排班表與列印樣式
- shift_roster_v1.js：排班表操作與資料狀態
- shift_roster_export.js：獨立的 Canvas PNG 匯出功能

本版本完全獨立使用：
- 不呼叫 Stillness by Slowly 軍火庫
- 不使用 CDN
- 不需要後端
- HTML / CSS / JS 放在同一資料夾即可使用

整列快速填入：
點左側 07~15、15~23、16~24、23~07、00~08 班別文字後，
上方操作列下方會顯示 A~F、其他英文字母與清空整列。
整列套用後，每個日期格仍可單獨修改。

PNG 匯出：
由 shift_roster_export.js 單獨處理，不寫入排班表主 JS。
按「匯出 PNG」會把目前排班表轉成 Canvas 後輸出 PNG。

排班／休假互斥：
- 同一人同一天不能同時存在於排班格與休假格。
- 若排班時遇到已排休，會出現「排班／休假」選擇。
- 選「排班」會移除該人的休假；選「休假」會保留休假並跳過該日排班。
- 從休假格輸入時若撞到既有排班，也會用同一組選項處理。
