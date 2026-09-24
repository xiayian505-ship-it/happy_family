# 慢慢週期｜Cycle

手機優先、無登入、無後端的個人生理週期記錄工具。最低限度只需記月經開始日期，結束日期可日後補上；身體紀錄完全選填。直接以靜態網站開啟，資料保存在目前瀏覽器的 `localStorage`。

## 檔案與責任

- `index.html`：語意化頁面、表單與對話框。
- `cycle.js`：無 DOM 的日期、驗證、週期、備份與儲存 adapter 核心；同時支援瀏覽器與 Node.js 測試。
- `cycle.css`：月曆功能狀態與圖例。
- `cycle_style.css`：網站外觀、手機響應式與觸控尺寸。
- `cycle_style.js`：畫面渲染、對話框、下載／選檔等純 UI 串接。
- `cycle.test.js`：Node 內建 test runner 的核心回歸測試。

所有 runtime 資源皆使用 `./` 相對路徑，沒有 CDN、套件、建置步驟或對 repository 名稱的依賴。`arsenal/` 是從使用者軍火庫唯讀複製的本地副本。

## 使用方式

1. 用靜態伺服器提供本目錄，例如在 repository 根目錄執行 `python3 -m http.server 8000`，開啟 `http://localhost:8000/cycle/`。
2. 按「＋ 新增」記錄月經開始日期；結束日期可留空，之後從歷史列表按「編輯」補上。
3. 點月曆日期可選填經血量、疼痛與備註；清除此資料不影響月經區間。
4. 「手動預估週期」留空時使用有效歷史間隔平均，填 15–90 天整數時只改變預估。
5. 「備份與還原」可下載 JSON。匯入會先完整解析及驗證，通過後仍須明確確認才覆蓋；失敗不會呼叫儲存 adapter。

> 資料只在該瀏覽器。清除網站資料、無痕模式結束或更換裝置都可能造成遺失。請定期下載備份。預估月經、排卵與易孕期均不精確，不能作為可靠避孕依據。

## 資料模型與 adapter 邊界

```json
{
  "schemaVersion": 1,
  "periods": [{ "id": "p_...", "start": "2026-01-01", "end": null }],
  "daily": { "2026-01-01": { "flow": "少量", "pain": "輕微", "note": "" } },
  "settings": { "manualCycleLength": null },
  "updatedAt": "ISO timestamp"
}
```

UI 僅透過具有非同步 `load()` / `save(data)` 的 adapter 存取資料，目前實作是 `LocalStorageAdapter`。未來可加入 Supabase adapter 而不改月曆渲染與週期函式。雲端版仍須另行設計 Auth、每位使用者的 RLS、離線佇列、衝突策略、同步狀態，以及兩種**分離**的保存機制：可覆寫的同步鏡像與帶時間戳、還原前再留存當前版本的歷史備份。本版完全沒有網路請求或 Supabase 程式碼。

## 驗證規則與隱私

- 日期採嚴格 `YYYY-MM-DD` 並做真實日曆驗證（包含閏年）；結束不得早於開始。
- 月經區間不得重複／相交；未結束紀錄會阻止其後新增另一筆，須先補結束日期。
- 手動週期限制 15–90 天；備註最多 1000 字；選項使用白名單。
- 匯入需符合完整 schema、唯一 id、每日紀錄與日期規則。驗證在寫入前完成。
- 程式不把紀錄輸出到 console，也不傳送至任何伺服器。

## 軍火庫整合（本地副本，不回寫原庫）

已從 `stillnessbyslowly_data_core` 唯讀複製五個模組至 `cycle/arsenal/`：

- `date/datetime.js` → `arsenal/datetime.js`：瀏覽器日期鍵、嚴格日期解析、日期加減、日期差。Cycle 核心在瀏覽器使用軍火庫 DateTime；Node 核心測試保留相同語意的 fallback。
- `calendar/month_grid_view.js` → `arsenal/month_grid_view.js`：實際產生月份 DOM 格線，Cycle 在 `renderDay` callback 放入可點擊日期按鈕和週期標記。
- `calendar/month_sequence.js` → `arsenal/month_sequence.js`：上／下月份切換。
- `data/Data_backup.js` → `arsenal/Data_backup.js`：JSON 下載及檔案讀取；備份資料格式仍維持原 Cycle v1 schema，舊備份可匯入。
- `data/json/json_safe_import.js` → `arsenal/json_safe_import.js`：匯入的 prepare／validate／commit／rollback 流程；Cycle 專用 schema 驗證和使用者覆蓋確認保留。

Cycle 專有的月經區間、週期預估、身體紀錄及本機 adapter 保留在 `cycle.js`。`snapshot_mirror.js` 與 `Realtime_sync.js` 涉及雲端同步，第一版沒有後端，不載入。軍火庫原始 repo 未修改。

載入順序：五個 `arsenal/` 模組 → `cycle.js` → `cycle_style.js`。請搬移**完整** `cycle/`（包含 `arsenal/`）。

## 測試

```bash
node --test cycle/cycle.test.js
```

涵蓋空資料、開始後補結束、跨月／年／閏年、修改／刪除保留身體紀錄、非法／反向／重疊／未結束日期、平均與手動週期、記憶體模擬 localStorage 重載、JSON 往返與失敗不寫入。另應用真實手機驗收 320px 寬版面、觸控、原生 date input、下載和檔案選擇流程。

## 搬移與驗收

1. 將整個 `happy_family/cycle/` 複製成目標 repository 的 `cycle/`，不要只複製 HTML。
2. 確認所有檔案（包含 `arsenal/` 五個本地副本）均存在；不需改任何絕對路徑。
3. 以靜態伺服器在目標 repository 根目錄預覽 `/cycle/`，再部署。
4. 開啟 `https://xiayian505.stillnessbyslowly.com/cycle/`，確認 Network 中 `cycle.css`、`cycle_style.css`、`cycle.js`、`cycle_style.js` 均為 200。
5. 依序驗收新增未結束紀錄、補結束、當日選填、重新整理留存、下載備份、修改資料、還原覆蓋，以及窄螢幕無水平捲動。
6. 搬移不會帶走來源瀏覽器的 localStorage；若要移轉個人資料，先在舊網址匯出，再於新網址匯入。
