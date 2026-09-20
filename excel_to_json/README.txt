班表 Excel → JSON fixed4 inline

用途：只讀取目前班表系統自己匯出的 .xlsx，轉成現行 v3 測試 JSON。

本版修正：
- 工具 CSS / JS 全部內嵌在單一 HTML，避免 GitHub Pages 測試時 HTML 與舊 JS 快取版本不一致。
- 「匯出 JSON」改為瀏覽器原生 <a download>，解析成功時直接把 JSON data URL 掛到連結，不依賴 click 事件、File System Access API、Web Share API。
- 保留「複製 JSON」作為第二條取出資料的路徑。

部署：只需要把 excel_to_roster_json.html 上傳到 GitHub Pages 可存取的位置。
