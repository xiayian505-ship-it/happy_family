// battle.js（卡牌版本）
(function (global) {

  const Battle = {

    start(enemyId, returnLabel) {
      this.returnLabel = returnLabel;

      BattleCore.onEnd = () => {
        global.Game.endBattle(this.returnLabel);
      };

      const info = BattleCore.start(enemyId);
      BattleUI.showStart(info);

      // ★ 開始時抽牌
      const hand = Deck.drawHand(3);
      CardUI.renderHand(hand);

      CardUI.onSelect((card, index) => {
        Battle.useCard(card, index);
      });
    },

    // ==========================
    //       使用卡牌
    // ==========================
    useCard(card, index) {

      if (BattleCore.player.energy < card.cost) {
        BattleUI.log("能量不足！");
        return;
      }

      // 扣能量
      BattleCore.player.energy -= card.cost;

      // 執行卡片效果
      switch(card.type) {

        case "attack":
          const atk = BattleCore.playerAttack();
          BattleUI.log(`你造成 ${atk.dmg} 傷害！`);
          break;

        case "guard":
          const g = BattleCore.playerGuard();
          BattleUI.log(`你獲得 ${g.shield} 護盾`);
          break;

        case "energy":
          BattleCore.player.energy += 1;
          BattleUI.log("能量 +1");
          break;

        case "heal":
          BattleCore.player.hp = Math.min(BattleCore.player.maxHp, BattleCore.player.hp + 3);
          BattleUI.log("回復 3 點生命");
          break;
      }

      // 更新 UI
      BattleUI.updateHp(
        BattleCore.player.hp,
        BattleCore.player.maxHp,
        BattleCore.enemy.hp,
        BattleCore.enemy.maxHp
      );

      // 從手牌移除
      Deck.removeCard(index);
      CardUI.renderHand(Deck.hand);
    },

    // ==========================
    //       玩家結束回合
    // ==========================
    endPlayerTurn() {
      // 敵人行動
      const enemyAtk = BattleCore.enemyTurn();

      BattleUI.log(`敵人造成 ${enemyAtk.dmg} 傷害！`);

      BattleUI.updateHp(
        BattleCore.player.hp,
        BattleCore.player.maxHp,
        BattleCore.enemy.hp,
        BattleCore.enemy.maxHp
      );

      // 新回合 → 抽 3 張
      const hand = Deck.drawHand(3);
      CardUI.renderHand(hand);

      CardUI.onSelect((card, index) => {
        Battle.useCard(card, index);
      });
    },

    // ==========================
    //        離開戰鬥
    // ==========================
    abortBattle() {
      global.Game.endBattle(this.returnLabel);
    },

    // ==========================
    //  （可選）單獨敵人行動
    // ==========================
    enemyAction() {
      const enemyAtk = BattleCore.enemyTurn();

      BattleUI.log(`敵人造成 ${enemyAtk.dmg} 傷害！`);

      BattleUI.updateHp(
        BattleCore.player.hp,
        BattleCore.player.maxHp,
        BattleCore.enemy.hp,
        BattleCore.enemy.maxHp
      );
    }
  };

  global.Battle = Battle;

})(window);