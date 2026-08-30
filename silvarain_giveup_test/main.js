// engine/main.js
(function (global) {
  const Story = global.Story;
  const UI = global.UI;
  const MapEngine = global.MapEngine;
  const Battle = global.Battle;

  // 遊戲狀態
  const Game = {
    mode: "story",  // story / map / battle
    returnLabel: null, // map 或 battle 結束要回到的故事位置

    start() {
      this.mode = "story";
      UI.showStoryUI();
      Story.start();  // 從第一句開始
    },

    // Story 要求下一句時由 main 來判斷
    nextStory() {
      const line = Story.getCurrentLine();

      if (!line) return;

      switch (line.type) {
        case "text":
          UI.showText(line);
          Story.pointer++;
          break;

        case "choice":
          UI.showChoices(line.choices, (choice) => {
            Story.jump(choice.goto);
            this.nextStory();
          });
          break;

        case "label":
          Story.pointer++;
          this.nextStory();
          break;

        case "map":
          this.startMap(line);
          break;

        case "battle":
          this.startBattle(line);
          break;

        default:
          Story.pointer++;
          this.nextStory();
      }
    },

    // ===== MAP =====
    startMap(mapInfo) {
      this.mode = "map";

      UI.showMapUI();
      MapEngine.startMap(
        mapInfo.steps,
        mapInfo.boss || false,
        () => this.endMap(mapInfo.after)
      );
    },

    endMap(returnLabel) {
      this.mode = "story";
      UI.showStoryUI();

      if (returnLabel) Story.jump(returnLabel);
      this.nextStory();
    },

    // ===== BATTLE =====
    startBattle(info) {
      this.mode = "battle";
      UI.showBattleUI();

      Battle.start(info.id, (result) => {
        this.endBattle(info.after);
      });
    },

    endBattle(returnLabel) {
      this.mode = "story";
      UI.showStoryUI();

      if (returnLabel) Story.jump(returnLabel);
      this.nextStory();
    }
  };

  global.Game = Game;

})(window);