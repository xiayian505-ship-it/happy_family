// battle-ui.js

(function (global) {

const EnemyData = global.EnemyData || {};

  const Game = global.Game || (global.Game = {});

  /* ------------------------------------------------------------
    卡片定義（你之後要加職業技能，就改這裡）
  ------------------------------------------------------------ */
  const CARD_POOL = [
    { id: "atk4",   type: "attack", value: 4, label: "attack", colorClass: "battle-card-attack", cost: 1 },
    { id: "atk4b",  type: "attack", value: 4, label: "attack", colorClass: "battle-card-attack", cost: 1 },
    { id: "guard4", type: "guard",  value: 4, label: "guard",  colorClass: "battle-card-guard",  cost: 1 },
    { id: "ene1",   type: "energy", value: 1, label: "energy", colorClass: "battle-card-energy", cost: 0 },
    { id: "heal3",  type: "heal",   value: 3, label: "heal",   colorClass: "battle-card-heal",   cost: 1 },
    // 你可以在這裡繼續加卡片
  ];

  /* ------------------------------------------------------------
    簡易 Boss 資料（模式：攻擊 / 防禦 / 蓄力）
  ------------------------------------------------------------ */
  const BOSS_DATA = {
    // 預設 boss
    default: {
      name: "未知敵人",
      maxHP: 25,
      atkMin: 3,
      atkMax: 6,
      guardValue: 3,
      chargeBonus: 4,
      pattern: ["attack", "attack", "guard", "charge"]
    }
    // 之後可以加 bossId: {...}
  };

  /* ------------------------------------------------------------
    內部狀態
  ------------------------------------------------------------ */
  const BattleUI = {
    dom: {},
    state: {
      inBattle: false,
      onFinish: null,

      player: {
        maxHP: 20,
        hp: 20,
        energyMax: 3,
        energy: 3,
        shield: 0
      },

      enemy: {
        name: "",
        maxHP: 20,
        hp: 20,
        shield: 0,
        pattern: [],
        patternIndex: 0,
        charge: 0
      },

      deck: [],
      discard: [],
      hand: [],
      handSize: 4
    }
  };

  /* ------------------------------------------------------------
    工具：洗牌
  ------------------------------------------------------------ */
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /* ------------------------------------------------------------
    初始化 DOM（只做一次）
  ------------------------------------------------------------ */
  function initDom() {
    if (BattleUI.dom.panel) return;

    BattleUI.dom.panel   = document.getElementById("battlePanel");
    BattleUI.dom.hp      = document.getElementById("battlePlayerHP");
    BattleUI.dom.energy  = document.getElementById("battleEnergy");
    BattleUI.dom.shield  = document.getElementById("battleShield");
    BattleUI.dom.enemyHPText = document.getElementById("battleEnemyHPText");
    BattleUI.dom.enemyHPBar  = document.getElementById("battleEnemyHPBar");
    BattleUI.dom.enemyHPFill = document.getElementById("battleEnemyHPFill");
    BattleUI.dom.cards   = document.getElementById("battleCards");
    BattleUI.dom.log     = document.getElementById("battleLog");
    BattleUI.dom.btnEnd  = document.getElementById("btnEndTurn");
    BattleUI.dom.btnLeave= document.getElementById("btnLeaveBattle");

    if (!BattleUI.dom.panel) {
      console.error("battlePanel 沒找到，請確認 HTML 結構。");
    }

    BattleUI.dom.btnEnd.addEventListener("click", onEndTurnClicked);
    BattleUI.dom.btnLeave.addEventListener("click", onLeaveClicked);
  }

  /* ------------------------------------------------------------
    對外入口：開始戰鬥
    bossId: 劇本傳進來的 line.boss，可以是字串或物件
    onFinish: 戰鬥結束後呼叫（回到故事）
  ------------------------------------------------------------ */
  BattleUI.start = function (bossId, onFinish) {
    initDom();

let bossCfg;

// ✅ 優先使用 enemies.js
if (typeof bossId === "string" && EnemyData[bossId]) {
  const src = EnemyData[bossId];
  bossCfg = {
    name: src.name,
    maxHP: src.hp,
    atkMin: src.atk[0],
    atkMax: src.atk[1],
    guardValue: 4,
    chargeBonus: 4,

    // 先給一組通用模式，之後再客製
    pattern: ["attack", "charge", "attack", "guard"]
  };
} else {
  bossCfg = BOSS_DATA.default;
}

    BattleUI.state.inBattle = true;
    BattleUI.state.onFinish = onFinish;

    // 玩家狀態（之後可從 Game.player 帶入）
    const p = BattleUI.state.player;
    p.maxHP = p.maxHP || 20;
    p.hp    = p.maxHP;
    p.energyMax = 3;
    p.energy    = 3;
    p.shield    = 0;

    // 敵人狀態
    const e = BattleUI.state.enemy;
    e.name   = bossCfg.name;
    e.maxHP  = bossCfg.maxHP;
    e.hp     = bossCfg.maxHP;
    e.shield = 0;
    e.pattern = bossCfg.pattern.slice();
    e.patternIndex = 0;
    e.charge = 0;
    e.atkMin = bossCfg.atkMin;
    e.atkMax = bossCfg.atkMax;
    e.guardValue = bossCfg.guardValue;
    e.chargeBonus = bossCfg.chargeBonus;

    // 建立牌庫
    BattleUI.state.deck = CARD_POOL.slice();
    BattleUI.state.discard = [];
    BattleUI.state.hand = [];
    shuffle(BattleUI.state.deck);

    // 顯示 UI
    BattleUI.dom.panel.style.display = "block";
    clearLog();
    logLine(`你遇到了「${e.name}」！`);

    startPlayerTurn();
  };

  /* ------------------------------------------------------------
    玩家回合開始：補滿能量、抽牌
  ------------------------------------------------------------ */
  function startPlayerTurn() {
    const s = BattleUI.state;
    s.player.energy = s.player.energyMax;
    // 抽到手牌滿
    drawToFullHand();
    updateAll();
    logLine("輪到你行動。點擊卡片使用。");
  }

  function drawToFullHand() {
    const s = BattleUI.state;
    while (s.hand.length < s.handSize) {
      if (s.deck.length === 0) {
        // 牌庫空了，丟棄堆洗回來
        if (s.discard.length === 0) break;
        s.deck = s.discard.slice();
        s.discard = [];
        shuffle(s.deck);
      }
      const card = s.deck.pop();
      s.hand.push(card);
    }
  }

  /* ------------------------------------------------------------
    使用卡片
  ------------------------------------------------------------ */
  function onCardClicked(cardIdx) {
    const s = BattleUI.state;
    if (!s.inBattle) return;

    const card = s.hand[cardIdx];
    if (!card) return;

    if (s.player.energy < card.cost) {
      logLine("能量不足，無法使用這張牌。");
      return;
    }

    // 扣能量
    s.player.energy -= card.cost;

    switch (card.type) {
      case "attack":
        doAttack(card.value);
        break;
      case "guard":
        doGuard(card.value);
        break;
      case "energy":
        doEnergy(card.value);
        break;
      case "heal":
        doHeal(card.value);
        break;
    }

    // 用過的牌丟到棄牌堆
    s.hand.splice(cardIdx, 1);
    s.discard.push(card);

    updateAll();
    checkWinOrLose();
  }

  function doAttack(value) {
    const s = BattleUI.state;
    let dmg = value;
    if (s.enemy.shield > 0) {
      const absorbed = Math.min(s.enemy.shield, dmg);
      s.enemy.shield -= absorbed;
      dmg -= absorbed;
      logLine(`你攻擊了敵人，先打掉了 ${absorbed} 點護盾。`);
    }
    if (dmg > 0) {
      s.enemy.hp = Math.max(0, s.enemy.hp - dmg);
      logLine(`你造成了 ${dmg} 點傷害。`);
    }
  }

  function doGuard(value) {
    const s = BattleUI.state;
    s.player.shield += value;
    logLine(`你提高了 ${value} 點護盾。`);
  }

  function doEnergy(value) {
    const s = BattleUI.state;
    s.player.energy += value;
    logLine(`你獲得了 ${value} 點能量。`);
  }

  function doHeal(value) {
    const s = BattleUI.state;
    const before = s.player.hp;
    s.player.hp = Math.min(s.player.maxHP, s.player.hp + value);
    const real = s.player.hp - before;
    logLine(`你回復了 ${real} 點 HP。`);
  }

  /* ------------------------------------------------------------
    結束回合 → 敵人行動
  ------------------------------------------------------------ */
  function onEndTurnClicked() {
    if (!BattleUI.state.inBattle) return;
    enemyAction();
  }

  function enemyAction() {
    const s = BattleUI.state;
    const e = s.enemy;

    if (!e.pattern.length) {
      e.pattern = ["attack"];
    }

    const mode = e.pattern[e.patternIndex];
    e.patternIndex = (e.patternIndex + 1) % e.pattern.length;

    switch (mode) {
      case "attack":
        enemyAttack(false);
        break;
      case "guard":
        enemyGuard();
        break;
      case "charge":
        enemyCharge();
        break;
      default:
        enemyAttack(false);
    }

    updateAll();
    checkWinOrLose();

    if (s.inBattle) {
      // 若還沒結束，進入下一個玩家回合
      startPlayerTurn();
    }
  }

  function enemyAttack(isCharged) {
    const s = BattleUI.state;
    const e = s.enemy;
    let base = randInt(e.atkMin, e.atkMax);
    if (isCharged) base += e.chargeBonus + e.charge;
    else base += e.charge;
    e.charge = 0;

    let dmg = base;
    if (s.player.shield > 0) {
      const absorbed = Math.min(s.player.shield, dmg);
      s.player.shield -= absorbed;
      dmg -= absorbed;
      logLine(`敵人攻擊，被你的護盾抵消 ${absorbed} 點。`);
    }
    if (dmg > 0) {
      s.player.hp = Math.max(0, s.player.hp - dmg);
      logLine(`敵人對你造成了 ${dmg} 點傷害。`);
    } else {
      logLine("敵人的攻擊被你完全擋下。");
    }
  }

  function enemyGuard() {
    const s = BattleUI.state;
    const e = s.enemy;
    e.shield += e.guardValue;
    logLine(`敵人提高了 ${e.guardValue} 點護盾。`);
  }

  function enemyCharge() {
    const s = BattleUI.state;
    const e = s.enemy;
    e.charge += e.chargeBonus;
    logLine("敵人正在蓄力，下一次攻擊會更痛！");
  }

  function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  /* ------------------------------------------------------------
    離開戰鬥（按鈕）
  ------------------------------------------------------------ */
  function onLeaveClicked() {
    if (!BattleUI.state.inBattle) return;
    endBattle(false); // 視為逃跑 / 失敗
  }

  /* ------------------------------------------------------------
    勝負判定與結束
  ------------------------------------------------------------ */
  function checkWinOrLose() {
    const s = BattleUI.state;
    if (s.enemy.hp <= 0) {
      logLine("你贏了這場戰鬥。");
      endBattle(true);
    } else if (s.player.hp <= 0) {
      logLine("你倒下了……");
      endBattle(false);
    }
  }

  function endBattle(isWin) {
    const s = BattleUI.state;
    s.inBattle = false;
    BattleUI.dom.panel.style.display = "none";

    if (typeof s.onFinish === "function") {
      // 你之後如果想要把勝負傳回故事，也可以改成 s.onFinish(isWin)
      s.onFinish();
    }
  }

  /* ------------------------------------------------------------
    畫面更新
  ------------------------------------------------------------ */
  function updateAll() {
    updateStats();
    renderCards();
  }

  function updateStats() {
    const s = BattleUI.state;
    const p = s.player;
    const e = s.enemy;

    BattleUI.dom.hp.textContent     = `${p.hp} / ${p.maxHP}`;
    BattleUI.dom.energy.textContent = `${p.energy}`;
    BattleUI.dom.shield.textContent = `${p.shield}`;

    BattleUI.dom.enemyHPText.textContent = `${e.hp} / ${e.maxHP}`;

    const ratio = e.maxHP > 0 ? (e.hp / e.maxHP) : 0;
    BattleUI.dom.enemyHPFill.style.width = (ratio * 100) + "%";
  }

  function renderCards() {
    const s = BattleUI.state;
    const box = BattleUI.dom.cards;
    box.innerHTML = "";

    s.hand.forEach((card, idx) => {
      const div = document.createElement("div");
      div.className = `battle-card ${card.colorClass}`;
      if (s.player.energy < card.cost) {
        div.classList.add("disabled");
      }

      div.innerHTML = `
        <div class="battle-card-header"></div>
        <div class="battle-card-value">${card.value}</div>
        <div class="battle-card-label">${card.label}</div>
      `;

      div.addEventListener("click", () => onCardClicked(idx));
      box.appendChild(div);
    });
  }

  /* ------------------------------------------------------------
    Log 區
  ------------------------------------------------------------ */
  function clearLog() {
    if (BattleUI.dom.log) {
      BattleUI.dom.log.textContent = "";
    }
  }

  function logLine(text) {
    if (!BattleUI.dom.log) return;
    BattleUI.dom.log.textContent += (text + "\n");
    BattleUI.dom.log.scrollTop = BattleUI.dom.log.scrollHeight;
  }

  /* ------------------------------------------------------------
    對外註冊
  ------------------------------------------------------------ */
  Game.BattleUI = BattleUI;

  // 給 story-engine 用的入口：
  Game.openBattleUI = function (boss, onFinish) {
    BattleUI.start(boss, onFinish);
  };

})(window);