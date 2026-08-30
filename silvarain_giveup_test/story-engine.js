// story/story-engine.js
(function (global) {
  const Game = global.Game || {};
  const UI = global.UI;

  const Story = {
    lines: [],
    pointer: 0,
    nextAfterMap: null,
    isLocked: false,
  };

  /* ------------------------------------------------------------
     把所有 choice.goto 的 label 轉成真正的 index
  ------------------------------------------------------------ */
  Story.resolveGoto = function () {
    Story.lines.forEach((line) => {
      if (line.type === "choice") {
        line.choices.forEach(c => {
          if (typeof c.goto === "string") {
            const target = Story.findLabel(c.goto);
            if (target !== null) c.goto = target;  // ← 轉成數字 index
          }
        });
      }
    });
  };

  /* ------------------------------------------------------------
     渲染目前行
  ------------------------------------------------------------ */
  Story.render = function () {
    if (!Story.lines.length) return;

    const line = Story.lines[Story.pointer];
    UI.clearChoices();

    // 文字
    if (line.type === "text") {
      UI.showText(line);
      return;
    }

    // 選項
    if (line.type === "choice") {
      UI.showText({ name: "", text: "…" });
      UI.showChoices(line.choices, (gotoIndex) => {
        Story.pointer = gotoIndex;
        Story.render();
      });
      return;
    }
  };

  /* ------------------------------------------------------------
     下一句
  ------------------------------------------------------------ */
  Story.nextLine = function () {
    if (Story.isLocked) return;
    Story.isLocked = true;
    setTimeout(() => Story.isLocked = false, 100);

    Story.pointer++;
    if (Story.pointer >= Story.lines.length)
      Story.pointer = Story.lines.length - 1;

    const line = Story.lines[Story.pointer];
    if (!line) return;

    // goto
    if (line.type === "goto") {
      Story.pointer = line.target;
      Story.render();
      return;
    }

    // 地圖
    if (line.type === "map") {
      Story.nextAfterMap = Story.findLabel(line.after);
      Game.startMap(line.steps, line.boss, line.title);
      return;
    }

// 戰鬥（改用新的戰鬥 UI）
if (line.type === "battle") {

  // 隱藏敘事
  document.getElementById("storyView").classList.remove("active");

  // 顯示新戰鬥 UI
  const bp = document.getElementById("battlePanel");
  bp.classList.add("active");
  bp.style.display = "flex";

  Game.openBattleUI(line.boss, () => {

    // 戰鬥結束 → 關閉 battlePanel
    bp.classList.remove("active");
    bp.style.display = "none";

    // 回到敘事
    document.getElementById("storyView").classList.add("active");

    Story.nextLine();
  });

  return;
}


    Story.render();
  };

  /* ------------------------------------------------------------
     地圖返回
  ------------------------------------------------------------ */
  Story.afterMap = function () {
    if (Story.nextAfterMap !== null) {
      Story.pointer = Story.nextAfterMap;
      Story.render();
    }
  };

  /* ------------------------------------------------------------
     找 label 對應的 index
  ------------------------------------------------------------ */
  Story.findLabel = function (labelName) {
    for (let i = 0; i < Story.lines.length; i++) {
      if (Story.lines[i].label === labelName) return i;
    }
    return null;
  };

  /* ------------------------------------------------------------
     註冊全域
  ------------------------------------------------------------ */
  global.Story = Story;

  global.Game.nextLine = Story.nextLine;
  global.Game.afterMap = Story.afterMap;

  /* ------------------------------------------------------------
     開始故事（※ 這裡新增 resolveGoto）
  ------------------------------------------------------------ */
  global.Game.startStory = function (lines) {
    Story.lines = lines;
    Story.pointer = 0;

    Story.resolveGoto();   // ⭐ 最重要！修復所有選項卡住的 bug

    Story.render();
  };

  /* ------------------------------------------------------------
   章節開場畫面
  ------------------------------------------------------------ */
  global.Game.showChapterScreen = function (title, sub, img) {
    const box = document.getElementById("chapterScreen");
    document.getElementById("chTitle").textContent = title || "";
    document.getElementById("chSub").textContent = sub || "";
    document.getElementById("chImg").src = img || "";

    box.style.display = "block";
    box.onclick = function () {
      box.style.display = "none";
      box.onclick = null;
      global.Game.nextLine();
    };
  };

  /* ------------------------------------------------------------
   第一章開場（保留你的版本）
  ------------------------------------------------------------ */
  global.Game.startChapter1 = function () {
    Story.pointer = Story.findLabel("CH1_START");

    global.Game.showChapterScreen(
      "Chapter 1",
      "有些相遇，從來都不是巧合",
      ""
    );
  };

})(window);