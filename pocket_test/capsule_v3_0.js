"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  /* =========================================================
     慢慢｜時光膠囊 capsule_v3_0.js

     宿主保留：
     - 時光膠囊的投遞規則
     - 信件狀態（draft / sealed / opened）
     - openedAt 起算的 12 天 / 12 封消散規則
     - 信紙老化與歲月側寫場景
     - 明信片匯出 UI

     慢慢的倉庫接管：
     - Navigation Hash
     - DateTime
     - FictionStorage / Filter / Sort / Paginate / Change
     - Data Validation / Data Diff
     - FormDraft
     - Ticker
     - Custom Date / Custom Select
     - Toast
     - Responsive Base
     - FictionShuffle
     - Canvas Wrapped Text / CanvasPNG / PNGDownload
     - Random
     - ContentEditable Insert
     - Confirm
  ========================================================= */

  const MONTHS = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];

  const HOLIDAY_TABLE = [
    { name: "新年第一天", month: 1, day: 1 },
    { name: "春分", month: 3, day: 20 },
    { name: "夏至", month: 6, day: 21 },
    { name: "秋分", month: 9, day: 22 },
    { name: "冬至", month: 12, day: 21 }
  ];

  const TIME_SLEEP_LINES = [
    "正被時間保存",
    "在時光裡醞釀",
    "停泊於未來",
    "靜置時光深處",
    "未醒",
    "在時間中成形",
    "被未來珍藏",
    "把時間交付未來",
    "沉浮於時間之中",
    "暫停於某個未來",
    "尚在被歲月校準",
    "佇立在時間的陰影",
    "等待未來翻閱",
    "穿梭歲月",
    "被時間輕拂",
    "還在與歲月對齊",
    "停靠未來之前",
    "於未來安放",
    "歲月緩慢前行",
    "時光旅途",
    "放進未來",
    "在時間背面停留",
    "此刻",
    "編入未來",
    "時間正在讓路",
    "暫存於未來邊界",
    "尚未抵達",
    "被歲月輕聲覆蓋",
    "駐留在未來之前",
    "逃離現在",
    "時光尚未呼喚",
    "停在將來",
    "在時序之外緩慢呼吸",
    "時光尚未跟上",
    "暫未相遇",
    "被未來接手",
    "停留在將來之前",
    "安靜存在"
  ];

  const MAX_DAYS = 12;
  const MAX_COUNT = 12;

  /*
    TEMP｜PNG 匯出驗收用。
    true：sealed 信件可忽略 openAt 直接打開。
    false：恢復正式時間限制。

    正式上線前只要改成 false，不需要改其他規則。
  */
  const TEMP_ALLOW_EARLY_OPEN = true;

  const VALID_TABS = new Set(["diary", "search", "dev"]);

  /* ===============================
     DOM
  ================================ */
  const titleEl = document.querySelector(".diaryTitle");
  const contentEl = document.querySelector(".diaryContent");
  const diaryPaper = document.querySelector(".diary");
  const writeActions = document.querySelector(".diaryWriteActions");

  const sealBtn = document.getElementById("sealBtn");
  const editBtn = document.getElementById("editBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const exportBtn = document.getElementById("exportBtn");
  const openedActions = document.querySelector(".openedActions");

  const previewTitle = document.querySelector(".mailPreviewTitle");
  const previewContent = document.querySelector(".mailPreviewContent");
  const previewActions = document.querySelector(".mailPreviewActions");

  const dateInput = document.querySelector(".deliveryDateInput");
  const meaningfulSelect = document.querySelector(".meaningfulSelect");
  const festivalSelect = document.querySelector(".festivalSelect");
  const birthdayInput = document.querySelector(".birthdayInput");

  const todayYear = document.getElementById("todayYear");
  const todayMonth = document.getElementById("todayMonth");
  const todayDate = document.getElementById("todayDate");

  const previewModal = document.getElementById("exportPreviewModal");
  const previewMount = document.getElementById("exportPreviewMount");
  const cancelExportBtn = document.getElementById("cancelExportBtn");
  const confirmExportBtn = document.getElementById("confirmExportBtn");
  const exportCard = document.getElementById("capsuleExportCard");

  const exportTitle = exportCard?.querySelector(".exportTitle") || null;
  const exportBody = exportCard?.querySelector(".exportBody") || null;
  const exportFrom = exportCard?.querySelector(".fromText") || null;
  const exportTo = exportCard?.querySelector(".toText") || null;

  const toast = window.SlowlyToast?.create("#capsuleToast", {
    duration: 1900
  });

  function tell(message) {
    if (toast) {
      toast.show(message);
      return;
    }
    console.info(message);
  }

  /* ===============================
     倉庫｜DateTime Adapter
  ================================ */
  function todayKey() {
    return DateTime.dateKey(new Date());
  }

  function parseDateKey(key) {
    return DateTime.parseDateKey(key);
  }

  function addDays(key, days) {
    return DateTime.addDays(key, days);
  }

  function formatDateMMDD(key) {
    return DateTime.formatMMDD(key);
  }

  /* ===============================
     Entry schema + FictionStorage
  ================================ */
  function ensureEntryShape(raw = {}) {
    return {
      ...raw,
      key: String(raw.key || ""),
      title: String(raw.title || ""),
      content: String(raw.content || ""),
      status: raw.status || "draft",
      openAt: raw.openAt || null,
      mode: raw.mode || null,
      holidayName: raw.holidayName || null,
      sealedAt: raw.sealedAt || null,
      openedAt: raw.openedAt || null,
      aging: Number.isFinite(Number(raw.aging)) ? Number(raw.aging) : 0
    };
  }

  const store = FictionStorage.create({
    namespace: "SBS_capsule",
    collections: {
      entries: {
        idField: "key",
        normalize: ensureEntryShape
      }
    }
  });

  const entries = store.collection("entries");

  const capsuleChanges = FictionChange.create({
    name: "SBS_capsule"
  });

  const mailboxRefreshQueue = SerialQueue.create();

  function queueMailboxRefresh() {
    return mailboxRefreshQueue
      .add(() => renderMonthList())
      .catch(error => {
        console.error("[Capsule] 信箱刷新失敗。", error);
      });
  }

  const unsubscribeCapsuleChanges = capsuleChanges.subscribe(event => {
    if (event.collection !== "entries") return;

    const structuralChanges = new Set([
      "entry-structure",
      "removed",
      "cleanup"
    ]);

    if (!structuralChanges.has(event.type)) return;
    void queueMailboxRefresh();
  });

  function blankEntry(key) {
    return ensureEntryShape({ key });
  }

  async function getEntry(key) {
    const entry = await entries.get(key);
    return entry ? ensureEntryShape(entry) : blankEntry(key);
  }

  function hasStructuralEntryChange(diff) {
    const watchedPaths = new Set([
      "$.status",
      "$.openAt",
      "$.mode",
      "$.holidayName",
      "$.sealedAt",
      "$.openedAt"
    ]);

    return [
      ...diff.added,
      ...diff.removed,
      ...diff.changed
    ].some(record => watchedPaths.has(record.path));
  }

  async function saveEntry(entry) {
    const nextEntry = ensureEntryShape(entry);
    const previousRaw = await entries.get(nextEntry.key);
    const previousEntry = previousRaw
      ? ensureEntryShape(previousRaw)
      : blankEntry(nextEntry.key);

    const saved = await entries.upsert(nextEntry);
    const diff = SlowlyDataDiff.diff(previousEntry, saved);

    if (hasStructuralEntryChange(diff)) {
      capsuleChanges.emit({
        type: "entry-structure",
        collection: "entries",
        record: saved,
        diff
      });
    }

    return saved;
  }

  /* ===============================
     Navigation Hash
  ================================ */
  let timeLayerInited = false;
  let timeLayerLoop = null;

  function activateTab(name) {
    const tabName = VALID_TABS.has(name) ? name : "diary";

    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    document.querySelectorAll(".page").forEach(page => {
      page.classList.toggle("active", page.id === tabName);
    });

    if (tabName === "dev" && !timeLayerInited) {
      initTimeLayerScene();
      timeLayerInited = true;
    }
  }

  function syncTabFromHash() {
    const value = SlowlyNavigationHash.value();
    activateTab(VALID_TABS.has(value) ? value : "diary");
  }

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      if (!VALID_TABS.has(target)) return;

      if (SlowlyNavigationHash.value() === target) {
        activateTab(target);
      } else {
        SlowlyNavigationHash.go(target);
      }
    });
  });

  window.addEventListener("hashchange", syncTabFromHash);
  syncTabFromHash();

  /* ===============================
     Today UI
  ================================ */
  function renderToday() {
    if (!todayYear || !todayMonth || !todayDate) return;

    const now = new Date();
    todayYear.textContent = String(now.getFullYear());
    todayMonth.textContent = MONTHS[now.getMonth()];
    todayDate.textContent = String(now.getDate());
  }

  /* ===============================
     Custom Date / Select
  ================================ */
  const tomorrowKey = addDays(todayKey(), 1);
  const today = parseDateKey(todayKey());

  if (dateInput) {
    dateInput.min = tomorrowKey;
    dateInput.value = tomorrowKey;
  }

  if (birthdayInput && today) {
    birthdayInput.min = todayKey();
    birthdayInput.max = DateTime.dateKey(
      new Date(today.getFullYear(), 11, 31)
    );
  }

  SlowlyDate?.createAll('input[type="date"][data-slowly-date]');
  SlowlySelect?.createAll('select[data-slowly-select]');

  /* ===============================
     FormDraft｜未封存信件只管當前編輯狀態
  ================================ */
  let draft = FormDraft.create({ title: "", content: "" });
  let isEditing = false;
  let currentKey = todayKey();
  let previewKey = null;

  function bindDraftFromDom() {
    draft.patch({
      title: titleEl?.textContent || "",
      content: contentEl?.innerText || ""
    });
  }

  function validateDraftForSeal(values) {
    const result = SlowlyDataValidation.validate(values, {
      "": {
        validate(value) {
          const title = String(value?.title || "").trim();
          const content = String(value?.content || "").trim();

          return Boolean(title || content) || "你還沒寫內容";
        }
      }
    });

    if (result.valid) return true;

    tell(result.errors[0]?.message || "信件內容未通過檢查");
    return false;
  }

  titleEl?.addEventListener("input", bindDraftFromDom);
  contentEl?.addEventListener("input", bindDraftFromDom);

  /* ===============================
     純文字 Enter｜ContentEditable Insert
  ================================ */
  function handleEnterKey(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    SlowlyContentEditable.insertLineBreak(contentEl);
  }

  function setEditing(next) {
    isEditing = Boolean(next);

    if (titleEl) titleEl.contentEditable = String(isEditing);
    if (contentEl) contentEl.contentEditable = String(isEditing);

    if (contentEl) {
      contentEl.removeEventListener("keydown", handleEnterKey);
      if (isEditing) contentEl.addEventListener("keydown", handleEnterKey);
    }

    if (editBtn) {
      editBtn.textContent = isEditing ? "完成信件" : "寫信";
    }

    if (isEditing) titleEl?.focus();
  }

  editBtn?.addEventListener("click", async () => {
    const entry = await getEntry(currentKey);

    if (currentKey !== todayKey() || entry.status !== "draft") {
      tell("只有今天尚未寄出的信可以編輯");
      return;
    }

    setEditing(!isEditing);
    if (!isEditing) bindDraftFromDom();
  });

  /* ===============================
     投遞規則（Capsule 專屬）
  ================================ */
  function getSelectedMode() {
    return document.querySelector(
      'input[name="deliverMode"]:checked'
    )?.value || "custom";
  }

  function validateDeliveryInput(data, schema) {
    const result = SlowlyDataValidation.validate(data, schema);

    if (result.valid) return true;

    tell(result.errors[0]?.message || "投遞設定未通過檢查");
    return false;
  }

  function computeOpenAt() {
    const todayValue = todayKey();
    const mode = getSelectedMode();

    if (mode === "custom") {
      const min = addDays(todayValue, 1);
      const key = dateInput?.value || "";

      if (!validateDeliveryInput(
        { key },
        {
          key: {
            required: true,
            requiredMessage: "請選擇投遞日期",
            validate(value) {
              return value >= min || "時光膠囊最早只能寄往明天";
            }
          }
        }
      )) {
        return null;
      }

      return { openAt: key, mode: "custom", holidayName: null };
    }

    if (mode === "meaningful") {
      const days = Number(meaningfulSelect?.value || 7);
      return {
        openAt: addDays(todayValue, days),
        mode: "meaningful",
        holidayName: null
      };
    }

    if (mode === "random") {
      const days = SlowlyRandom.int(1, 365);
      return {
        openAt: addDays(todayValue, days),
        mode: "random",
        holidayName: null
      };
    }

    if (mode === "festival") {
      const value = festivalSelect?.value || "";
      const [month, day] = value.split("-").map(Number);
      const current = parseDateKey(todayValue);
      if (!current || !month || !day) return null;

      let year = current.getFullYear();
      let key = DateTime.dateKey(new Date(year, month - 1, day));

      if (key <= todayValue) {
        key = DateTime.dateKey(new Date(year + 1, month - 1, day));
      }

      const holidayName = HOLIDAY_TABLE.find(
        item => item.month === month && item.day === day
      )?.name || null;

      return { openAt: key, mode: "holiday", holidayName };
    }

    if (mode === "birthday") {
      const key = birthdayInput?.value || "";
      const current = parseDateKey(todayValue);

      if (!validateDeliveryInput(
        { key },
        {
          key: {
            required: true,
            requiredMessage: "請選擇生日日期",
            validate(value) {
              if (value < todayValue) {
                return "這一天已經過去了，請選擇今天或今年未來的生日";
              }

              const selected = parseDateKey(value);
              if (!selected || !current) return false;

              if (
                value !== todayValue &&
                selected.getFullYear() !== current.getFullYear()
              ) {
                return "生日只能選今年今天之後；若今天生日，請直接選今天";
              }

              return true;
            },
            validateMessage: "生日日期格式不正確"
          }
        }
      )) {
        return null;
      }

      if (!current) return null;

      if (key === todayValue) {
        return {
          openAt: DateTime.dateKey(
            new Date(
              current.getFullYear() + 1,
              current.getMonth(),
              current.getDate()
            )
          ),
          mode: "birthday",
          holidayName: "誕生"
        };
      }

      return { openAt: key, mode: "birthday", holidayName: "誕生" };
    }

    return null;
  }

  /* ===============================
     信紙慢慢做舊
     動畫：FrameLoop
     保存：Ticker（不再每幀碰 storage）
  ================================ */
  let agingTarget = 0;
  let agingValue = 0;
  let agingPersisted = 0;
  let agingSaveBusy = false;

  function applyPaperAging() {
    if (!diaryPaper) return;

    const sepia = agingValue * 0.35;
    const bright = 1 - agingValue * 0.08;
    const saturation = 1 - agingValue * 0.12;
    const contrast = 1 - agingValue * 0.05;

    diaryPaper.style.filter =
      `sepia(${sepia}) brightness(${bright}) ` +
      `saturate(${saturation}) contrast(${contrast})`;
  }

  const agingFrameLoop = FrameLoop.create({
    callback() {
      agingValue += (agingTarget - agingValue) * 0.0001;
      applyPaperAging();
    }
  });

  const agingTicker = Ticker.create({
    interval: 1000,
    callback: async () => {
      if (agingSaveBusy) return;
      if (Math.abs(agingPersisted - agingValue) <= 0.0005) return;

      agingSaveBusy = true;
      try {
        const entry = await getEntry(currentKey);
        entry.aging = agingValue;
        await saveEntry(entry);
        agingPersisted = agingValue;
      } finally {
        agingSaveBusy = false;
      }
    }
  });

  agingTicker.start();

  /* ===============================
     核心顯示
  ================================ */
  let sleepLineDeck = [];

  function pickSleepLine() {
    if (sleepLineDeck.length === 0) {
      sleepLineDeck = FictionShuffle.shuffle(TIME_SLEEP_LINES);
    }

    return sleepLineDeck.pop() || "正被時間保存";
  }

  function isOpenable(entry) {
    if (entry?.status !== "sealed") return false;

    if (TEMP_ALLOW_EARLY_OPEN) {
      return true;
    }

    return Boolean(
      entry.openAt &&
      todayKey() >= entry.openAt
    );
  }

  async function showPreview(key) {
    const entry = await getEntry(key);
    if (entry.status !== "opened") return;

    previewKey = key;

    if (previewTitle) {
      previewTitle.innerText = entry.title || "留 給 未 來";
    }
    if (previewContent) {
      previewContent.innerText = entry.content || "";
    }
    if (previewActions) {
      previewActions.style.display = "flex";
    }
  }

  async function applyView(key) {
    let entry = await getEntry(key);

    if (isOpenable(entry)) {
      const openedEarly = Boolean(
        TEMP_ALLOW_EARLY_OPEN &&
        entry.openAt &&
        todayKey() < entry.openAt
      );

      entry.status = "opened";
      entry.openedAt = entry.openedAt || todayKey();
      entry = await saveEntry(entry);

      // 開啟後立刻套用「12 天 / 12 封」規則，只影響已 opened 信件。
      await autoCleanupCapsules();

      if (openedEarly) {
        tell("測試模式：已忽略抵達時間開啟信件");
      }
    }

    agingTarget = entry.aging;
    agingValue = entry.aging;
    agingPersisted = entry.aging;
    applyPaperAging();

    setEditing(false);

    const visibleTitle = entry.title || "寄 給 未 來";
    const visibleContent =
      entry.status === "sealed" && !isOpenable(entry)
        ? pickSleepLine()
        : (entry.content || "信件在時間裡沉澱");

    if (titleEl) titleEl.textContent = visibleTitle;
    if (contentEl) contentEl.textContent = visibleContent;

    draft = FormDraft.create({
      title: entry.title || "",
      content: entry.content || ""
    });

    const diaryPage = document.getElementById("diary");

    if (entry.status === "draft") {
      if (writeActions) writeActions.style.display = "flex";
      diaryPaper?.classList.remove("time-sealed");
      diaryPage?.classList.remove("time-layer");
    } else {
      if (writeActions) writeActions.style.display = "none";
      diaryPaper?.classList.add("time-sealed");
      diaryPage?.classList.add("time-layer");
    }

    if (openedActions) {
      openedActions.style.display =
        entry.status === "opened" ? "flex" : "none";
    }
  }

  async function loadEntry(key) {
    currentKey = key;
    await applyView(key);
  }

  /* ===============================
     點擊標題觸發老化
  ================================ */
  titleEl?.addEventListener("click", async () => {
    const entry = await getEntry(currentKey);
    if (entry.aging !== 0) return;

    entry.aging = 1;
    await saveEntry(entry);
    agingTarget = 1;
    agingPersisted = 1;
  });

  /* ===============================
     封存
  ================================ */
  sealBtn?.addEventListener("click", async () => {
    const key = todayKey();

    if (currentKey !== key) {
      tell("封存只能對今天這封信操作");
      return;
    }

    let entry = await getEntry(key);
    if (entry.status !== "draft") {
      tell("這封信已經寄出了");
      return;
    }

    bindDraftFromDom();
    const currentDraft = draft.get();
    const title = String(currentDraft.title || "").trim();
    const content = String(currentDraft.content || "").trim();

    if (!validateDraftForSeal({ title, content })) {
      return;
    }

    const delivery = computeOpenAt();
    if (!delivery) return;

    entry = {
      ...entry,
      key,
      title: title.replace("留 給 未 來", ""),
      content,
      status: "sealed",
      openAt: delivery.openAt,
      mode: delivery.mode,
      holidayName: delivery.holidayName,
      sealedAt: key,
      openedAt: null
    };

    await saveEntry(entry);
    draft.commit();
    tell("信已交給時間");
    await loadEntry(key);
  });

  /* ===============================
     信箱｜Filter + Sort
  ================================ */
  async function renderMonthList() {
    const openedList = document.querySelector(".openedList");
    const sealedList = document.querySelector(".sealedList");

    if (openedList) openedList.innerHTML = "";
    if (sealedList) sealedList.innerHTML = "";

    const all = await entries.all();
    const sorted = FictionSort.sort(all, {
      field: "key",
      direction: "desc",
      type: "string"
    });

    const opened = FictionFilter.filter(sorted, {
      equals: { status: "opened" }
    });

    const sealed = FictionFilter.filter(sorted, {
      equals: { status: "sealed" }
    });

    function makeItem(raw, target) {
      const entry = ensureEntryShape(raw);
      if (!entry.title && !entry.content) return;

      const item = document.createElement("div");
      item.className = "monthItem";

      const date = document.createElement("div");
      date.className = "date";
      date.textContent = formatDateMMDD(entry.key);

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = entry.title || "留 給 未 來";

      item.append(date, title);
      item.addEventListener("click", async () => {
        if (entry.status === "opened") {
          await showPreview(entry.key);
        } else {
          await loadEntry(entry.key);
        }
      });

      target?.appendChild(item);
    }

    opened.forEach(entry => makeItem(entry, openedList));
    sealed.forEach(entry => makeItem(entry, sealedList));
  }

  /* ===============================
     明信片匯出（Capsule 專屬）
  ================================ */
  function buildToText(entry) {
    if (entry.mode === "meaningful") {
      const days = DateTime.diffDays(entry.sealedAt, entry.openAt);
      return `${days ?? 0} DAY`;
    }

    if (entry.holidayName) {
      return `Welcome to ${entry.holidayName}`;
    }

    return `To ${entry.openAt}`;
  }

  function fillExportCard(key, entry) {
    if (exportTitle) exportTitle.innerText = entry.title || "留 給 未 來";
    if (exportBody) exportBody.innerText = entry.content || "";
    if (exportFrom) exportFrom.textContent = `from ${entry.sealedAt || key}`;
    if (exportTo) exportTo.textContent = buildToText(entry);
  }

  async function openExportPreview() {
    if (!previewKey) {
      tell("請先選擇一封已開啟的信件");
      return;
    }

    const entry = await getEntry(previewKey);
    if (entry.status !== "opened") {
      tell("只能匯出已開啟的信件");
      return;
    }

    fillExportCard(previewKey, entry);

    if (!previewMount || !previewModal || !exportCard) return;

    previewMount.innerHTML = "";
    previewMount.appendChild(exportCard);

    exportCard.style.position = "relative";
    exportCard.style.left = "0";
    previewModal.style.display = "flex";
  }

  exportBtn?.addEventListener("click", openExportPreview);

  cancelExportBtn?.addEventListener("click", () => {
    if (!previewModal || !exportCard) return;

    previewModal.style.display = "none";
    document.body.appendChild(exportCard);
    exportCard.style.position = "fixed";
    exportCard.style.left = "-9999px";
  });

  function getOffsetWithin(element, ancestor) {
    let x = 0;
    let y = 0;
    let current = element;

    while (current && current !== ancestor) {
      x += current.offsetLeft || 0;
      y += current.offsetTop || 0;
      current = current.offsetParent;
    }

    return { x, y };
  }

  function canvasFontFromStyle(style) {
    const fontStyle = style.fontStyle || "normal";
    const fontWeight = style.fontWeight || "400";
    const fontSize = style.fontSize || "16px";
    const fontFamily = style.fontFamily || "sans-serif";

    return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
  }

  function parsePixel(value, fallback = 0) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function drawTextWithStyle(ctx, element, text, x, y) {
    const style = getComputedStyle(element);

    ctx.save();
    ctx.fillStyle = style.color;
    ctx.font = canvasFontFromStyle(style);
    ctx.textBaseline = "top";

    if ("letterSpacing" in ctx && style.letterSpacing !== "normal") {
      ctx.letterSpacing = style.letterSpacing;
    }

    ctx.fillText(String(text ?? ""), x, y);
    ctx.restore();
  }

  function drawWrappedBody(ctx, element, x, y) {
    const style = getComputedStyle(element);
    const lineHeight = parsePixel(
      style.lineHeight,
      parsePixel(style.fontSize, 15) * 2
    );
    const maxWidth = element.offsetWidth;
    const paragraphs = String(element.innerText || "").split("\n");

    ctx.save();
    ctx.fillStyle = style.color;
    ctx.font = canvasFontFromStyle(style);
    ctx.textBaseline = "top";

    let currentY = y;

    paragraphs.forEach(paragraph => {
      if (!paragraph) {
        currentY += lineHeight;
        return;
      }

      const result = SlowlyCanvasWrappedText.draw(
        ctx,
        paragraph,
        x,
        currentY,
        maxWidth,
        lineHeight
      );

      currentY += Math.max(1, result.lines.length) * lineHeight;
    });

    ctx.restore();
  }

  function drawPostcardFrames(ctx, card, inner, content) {
    const cardStyle = getComputedStyle(card);
    const innerStyle = getComputedStyle(inner);
    const innerBeforeStyle = getComputedStyle(inner, "::before");
    const contentBeforeStyle = getComputedStyle(content, "::before");

    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;

    ctx.fillStyle = cardStyle.backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    const innerPos = getOffsetWithin(inner, card);
    const innerWidth = inner.offsetWidth;
    const innerHeight = inner.offsetHeight;
    const innerBorder = parsePixel(innerStyle.borderTopWidth, 1);

    ctx.save();
    ctx.strokeStyle = innerStyle.borderTopColor;
    ctx.lineWidth = innerBorder;
    ctx.strokeRect(
      innerPos.x + innerBorder / 2,
      innerPos.y + innerBorder / 2,
      innerWidth - innerBorder,
      innerHeight - innerBorder
    );
    ctx.restore();

    // 對應 .capsuleInner 的 inset box-shadow。
    ctx.save();
    ctx.strokeStyle = "rgba(127,168,163,.05)";
    ctx.lineWidth = 6;
    ctx.strokeRect(
      innerPos.x + 3,
      innerPos.y + 3,
      innerWidth - 6,
      innerHeight - 6
    );
    ctx.restore();

    // 對應 .capsuleInner::before。
    const innerInset = 18;
    ctx.save();
    ctx.strokeStyle =
      innerBeforeStyle.borderTopColor || "rgba(127,168,163,.18)";
    ctx.lineWidth = parsePixel(innerBeforeStyle.borderTopWidth, 1);
    ctx.strokeRect(
      innerPos.x + innerInset + 0.5,
      innerPos.y + innerInset + 0.5,
      innerWidth - innerInset * 2 - 1,
      innerHeight - innerInset * 2 - 1
    );
    ctx.restore();

    // 對應 .capsuleContent::before。
    const contentPos = getOffsetWithin(content, card);
    ctx.save();
    ctx.strokeStyle =
      contentBeforeStyle.borderTopColor || "rgba(127,168,163,.08)";
    ctx.lineWidth = parsePixel(contentBeforeStyle.borderTopWidth, 1);
    ctx.strokeRect(
      contentPos.x + 0.5,
      contentPos.y - 10 + 0.5,
      content.offsetWidth - 1,
      content.offsetHeight + 30 - 1
    );
    ctx.restore();
  }

  function drawFromHalo(ctx, element, card) {
    const pos = getOffsetWithin(element, card);
    const width = 80;
    const height = 18;
    const right = pos.x + element.offsetWidth + 12;
    const left = right - width;
    const top = pos.y + element.offsetHeight / 2 - height / 2;

    const gradient = ctx.createLinearGradient(left, 0, right, 0);
    gradient.addColorStop(0, "rgba(127,168,163,0)");
    gradient.addColorStop(1, "rgba(127,168,163,.075)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(left, top, width, height);
    ctx.restore();
  }

  async function drawPostcardCanvas() {
    if (
      !exportCard ||
      !exportTitle ||
      !exportBody ||
      !exportFrom ||
      !exportTo
    ) {
      throw new Error("Capsule postcard DOM is incomplete.");
    }

    const inner = exportCard.querySelector(".capsuleInner");
    const content = exportCard.querySelector(".capsuleContent");

    if (!inner || !content) {
      throw new Error("Capsule postcard layout is incomplete.");
    }

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const cssWidth = exportCard.offsetWidth || 720;
    const cssHeight = exportCard.offsetHeight || 320;
    const scale = 2;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(cssWidth * scale);
    canvas.height = Math.ceil(cssHeight * scale);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    ctx.scale(scale, scale);

    drawPostcardFrames(ctx, exportCard, inner, content);

    const toPos = getOffsetWithin(exportTo, exportCard);
    const titlePos = getOffsetWithin(exportTitle, exportCard);
    const bodyPos = getOffsetWithin(exportBody, exportCard);
    const fromPos = getOffsetWithin(exportFrom, exportCard);

    drawTextWithStyle(
      ctx,
      exportTo,
      exportTo.textContent,
      toPos.x,
      toPos.y
    );

    drawTextWithStyle(
      ctx,
      exportTitle,
      exportTitle.innerText,
      titlePos.x,
      titlePos.y
    );

    drawWrappedBody(
      ctx,
      exportBody,
      bodyPos.x,
      bodyPos.y
    );

    drawFromHalo(ctx, exportFrom, exportCard);

    drawTextWithStyle(
      ctx,
      exportFrom,
      exportFrom.textContent,
      fromPos.x,
      fromPos.y
    );

    return canvas;
  }

  confirmExportBtn?.addEventListener("click", async () => {
    if (!exportCard || !previewKey) return;

    try {
      const canvas = await drawPostcardCanvas();
      const blob = await SlowlyCanvasPNG.toBlob(canvas);

      SlowlyPNGDownload.fromBlob(
        blob,
        `SBS_capsule_${previewKey}.png`
      );

      tell("時光明信片已輸出");
    } catch (error) {
      console.error("時光明信片輸出失敗", error);
      tell("時光明信片輸出失敗");
    }
  });

  /* ===============================
     消散
  ================================ */
  deleteBtn?.addEventListener("click", async () => {
    if (!previewKey) return;

    const ok = await SlowlyConfirm.show({
      title: "讓這封信消散？",
      message: "從時光膠囊消散。\n消散後無法回來。",
      confirmText: "消散",
      cancelText: "留下"
    });

    if (!ok) return;

    const removedKey = previewKey;
    const removed = await entries.remove(removedKey);

    if (removed) {
      capsuleChanges.emit({
        type: "removed",
        collection: "entries",
        record: { key: removedKey }
      });
    }

    if (previewTitle) previewTitle.textContent = "選一封信";
    if (previewContent) previewContent.textContent = "信件會在這裡展開";
    if (previewActions) previewActions.style.display = "none";

    previewKey = null;
    tell("這封信已隨時間消散");
  });

  /* ===============================
     自動消散｜openedAt 起算 12 天 OR 已開啟 12 封

     規則：
     - draft：不碰
     - sealed（未抵達 / 已抵達但未開）：不碰
     - opened 但沒有 openedAt：視為舊資料，先保護，不自動刪
     - opened + openedAt：才進入 12 天 / 12 封淘汰
  ================================ */
  async function autoCleanupCapsules() {
    const all = await entries.all();
    const current = todayKey();

    const protectedEntries = FictionFilter.filter(all, {
      predicate(raw) {
        const entry = ensureEntryShape(raw);
        return entry.status !== "opened" || !entry.openedAt;
      }
    });

    const openedEntries = FictionFilter.filter(all, {
      predicate(raw) {
        const entry = ensureEntryShape(raw);
        return entry.status === "opened" && Boolean(entry.openedAt);
      }
    });

    const openedWithinAge = FictionFilter.filter(openedEntries, {
      predicate(raw) {
        const entry = ensureEntryShape(raw);
        const age = DateTime.diffDays(entry.openedAt, current);
        return age === null || age <= MAX_DAYS;
      }
    });

    const openedNewestFirst = [...openedWithinAge].sort((aRaw, bRaw) => {
      const a = ensureEntryShape(aRaw);
      const b = ensureEntryShape(bRaw);

      const byOpenedAt = String(b.openedAt).localeCompare(String(a.openedAt));
      if (byOpenedAt !== 0) return byOpenedAt;

      return String(b.key).localeCompare(String(a.key));
    });

    const keepOpened = FictionPaginate.paginate(openedNewestFirst, {
      page: 1,
      pageSize: MAX_COUNT
    }).data;

    const keep = [
      ...protectedEntries,
      ...keepOpened
    ];

    if (keep.length !== all.length) {
      await entries.replace(keep);
      capsuleChanges.emit({
        type: "cleanup",
        collection: "entries",
        records: keep
      });
    }
  }

  /* ===============================
     歲月側寫（Capsule 專屬）
  ================================ */

  function initTimeLayerScene() {
    const scene = document.getElementById("mm_time_layer_scene");
    if (!scene) return;

    const HELP_TEXT =
      "這裡可以\n寫信給未來\n時光會保存信件\n" +
      "停下來\n慢一點\n讓靈魂跟上\n無論說什麼\n僅你可見";

    const state = {
      t: 0,
      light: 0.35,
      lightTarget: SlowlyRandom.float(),
      lightTimer: 0,
      lightInterval: 4.5,
      papers: [],
      firstRevealDone: false
    };

    function createPaper(index) {
      const element = document.createElement("div");
      element.className = "mm_time_paper";

      const text = document.createElement("div");
      text.className = "mm_time_text";

      if (index === 0) {
        text.textContent = HELP_TEXT;
        element.style.zIndex = "999";
        element.dataset.type = "help";
      } else {
        text.textContent = pickSleepLine();
        element.dataset.type = "time";
      }

      element.appendChild(text);

      const base = {
        x: SlowlyRandom.float(-40, window.innerWidth - 180),
        y: SlowlyRandom.float(-40, window.innerHeight - 260),
        rot: SlowlyRandom.float(-22, 22),
        scale: SlowlyRandom.float(0.92, 1.08),
        phase: SlowlyRandom.float(0, Math.PI * 2),
        aged: 0,
        agedTarget: 0
      };

      element.dataset.base = JSON.stringify(base);
      element.style.left = `${base.x}px`;
      element.style.top = `${base.y}px`;
      element.style.transform =
        `rotate(${base.rot}deg) scale(${base.scale})`;

      if (!element.style.zIndex) {
        element.style.zIndex = String(index);
      }

      element.addEventListener("click", () => {
        const next = JSON.parse(element.dataset.base);
        next.agedTarget = 1;
        element.dataset.base = JSON.stringify(next);

        const textEl = element.querySelector(".mm_time_text");

        if (!state.firstRevealDone && element.dataset.type === "help") {
          textEl?.classList.add("mm_time_revealed");
          state.firstRevealDone = true;
          return;
        }

        if (
          state.firstRevealDone &&
          element.dataset.type === "time" &&
          SlowlyRandom.chance(0.45)
        ) {
          textEl?.classList.add("mm_time_revealed");
        }
      });

      scene.appendChild(element);
      state.papers.push(element);
    }

    for (let index = 0; index < 16; index += 1) {
      createPaper(index);
    }

    timeLayerLoop = FrameLoop.create({
      callback() {
        state.t += 0.016;
        state.lightTimer += 0.016;

        if (state.lightTimer > state.lightInterval) {
          state.lightTarget = SlowlyRandom.float();
          state.lightTimer = 0;
          state.lightInterval = SlowlyRandom.float(3, 6);
        }

        state.light += (state.lightTarget - state.light) * 0.008;

        state.papers.forEach(element => {
          const base = JSON.parse(element.dataset.base);
          const drift =
            Math.sin(state.t * 0.55 + base.phase) * 42 * state.light;

          element.style.boxShadow =
            `${drift}px 12px 26px rgba(0,0,0,.22)`;

          base.aged += (base.agedTarget - base.aged) * 0.02;
          element.style.filter =
            `sepia(${0.12 + base.aged * 0.55}) ` +
            `brightness(${1 - base.aged * 0.07})`;

          element.dataset.base = JSON.stringify(base);
        });
      }
    });

    timeLayerLoop.start();
  }

  /* ===============================
     初始化
  ================================ */
  renderToday();
  await autoCleanupCapsules();
  await loadEntry(todayKey());
  await renderMonthList();
  agingFrameLoop.start();

  document.getElementById("diary")?.classList.remove("preload");

  window.addEventListener("beforeunload", () => {
    agingFrameLoop.stop();
    timeLayerLoop?.stop();
    agingTicker.stop();
    unsubscribeCapsuleChanges();
  });
});
