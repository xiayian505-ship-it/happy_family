// engine/map.js
(function (global) {
  const Game = global.Game;

  /* ------------------------------------------------------------
     初始化地圖（使用 steps 格，標題 title，是否為Boss地圖 isBoss）
  ------------------------------------------------------------ */
  Game.startMap = function (steps, isBoss, title) {
    // 消耗 1 體力
    if (!Game.consumeStamina(1)) return;

    Game.mapActive = true;
    Game.isBossMap = isBoss;
    Game.path = [];
    Game.pos = 0;

    // 標題
    const mapTitle = document.getElementById("mapTitle");
    if (mapTitle) {
      mapTitle.innerText = title || "Forest Deer · Unknown Path";
    }

    // 步數
    const mapSteps = document.getElementById("mapSteps");
    const mapPos = document.getElementById("mapPos");

    if (mapSteps) mapSteps.innerText = steps;
    if (mapPos) mapPos.innerText = Game.pos;

    // 路徑初始化
    Game.path = [];
    for (let i = 0; i < steps; i++) {
      Game.path.push(i === 0 ? "起點" : (i === steps - 1 ? "終點" : "·"));
    }

    Game.renderMapPath();

    Game.showView("mapView");

    const mapLog = document.getElementById("mapLog");
    if (mapLog) mapLog.innerText = "準備出發。";
  };


  /* ------------------------------------------------------------
     渲染路徑（把 Game.path 顯示成 <span>）
  ------------------------------------------------------------ */
  Game.renderMapPath = function () {
    const pathDiv = document.getElementById("path");
    if (!pathDiv) return;

    pathDiv.innerHTML = "";

    Game.path.forEach((t, i) => {
      const span = document.createElement("span");
      span.innerText = t;

      if (i === Game.pos) span.classList.add("here");

      pathDiv.appendChild(span);
    });
  };


  /* ------------------------------------------------------------
     前進 1 步
  ------------------------------------------------------------ */
  Game.moveStep = function () {
    if (!Game.mapActive) {
      alert("目前不在地圖中。");
      return;
    }

    const mapStepsEl = document.getElementById("mapSteps");
    let steps = mapStepsEl ? parseInt(mapStepsEl.innerText, 10) : 20;

    if (Game.pos >= steps - 1) {
      const mapLog = document.getElementById("mapLog");
      if (mapLog) mapLog.innerText = "已到達終點。";
      return;
    }

    Game.pos++;

    // 事件：每 3 格觸發一次
    if (Game.pos % 3 === 0) {
      Game.triggerEvent();
    }

    // 抵達終點
    if (Game.pos === steps - 1) {
      Game.finishMap(Game.isBossMap);
      return;
    }

    Game.renderMapPath();

    const mapPos = document.getElementById("mapPos");
    if (mapPos) mapPos.innerText = Game.pos;
  };


  /* ------------------------------------------------------------
     骰子前進（暫時等於 moveStep）
  ------------------------------------------------------------ */
  Game.roll = function () {
    Game.moveStep();
  };


  /* ------------------------------------------------------------
     結束地圖（返回故事）
  ------------------------------------------------------------ */
  Game.finishMap = function (fromBoss) {
    Game.mapActive = false;
    Game.path = [];
    Game.pos = 0;

    const mapLog = document.getElementById("mapLog");
    if (mapLog) mapLog.innerText = "探索結束。";

    Game.showView("storyView");

    // 故事引擎的 afterMap（如果有）
    if (global.Story && typeof global.Story.afterMap === "function") {
      global.Story.afterMap(fromBoss);
    }
  };


  /* ------------------------------------------------------------
     事件系統（暫放，之後獨立拆 event.js）
  ------------------------------------------------------------ */
  Game.triggerEvent = function () {
    const box = document.getElementById("eventBox");
    const text = document.getElementById("eventText");

    if (box) box.style.display = "block";
    if (text) text.innerText = "你在霧中察覺到什麼……";
  };

  Game.closeEvent = function () {
    const box = document.getElementById("eventBox");
    if (box) box.style.display = "none";
  };

})(window);