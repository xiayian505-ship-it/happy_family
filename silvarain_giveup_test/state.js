// engine/state.js
(function (global) {
  // 全域遊戲狀態（不負責畫面與流程，只是「數值」）
  const Game = {
    // 位置／戰鬥狀態
    pos: 0,

    // HP＆攻擊
    maxHp: 15,
    hp: 15,
    attackDamage: 3,

    // 貨幣＆戰績
    gold: 100,
    winCount: 0,
    deathCount: 0,

    // 護符
    charm: 0,

    // 體力系統
    stamina: 20,
    maxStamina: 20,
    lastRecoverTime: Date.now(),

    // 地圖狀態
    mapActive: false,
    isBossMap: false,
    path: [],
    nextHpMilestone: 5,

    // 故事位置
    storyIndex: 0
  };

  // 掛到全域，讓其他檔案可以用 window.Game
  global.Game = Game;
})(window);