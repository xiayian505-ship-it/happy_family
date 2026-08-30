// engine/battle-core.js
(function (global) {

  const BattleCore = {
    player: {
      maxHp: 20,
      hp: 20,
      shield: 0
    },

    enemy: {
      id: null,
      name: "",
      maxHp: 0,
      hp: 0,
      atkRange: [1, 3]
    },

    onEnd: null, // callback 由 battle.js 設定

    // 開始戰鬥
    start(enemyId) {
      const data = global.EnemyData[enemyId];
      this.enemy.id = enemyId;
      this.enemy.name = data.name;
      this.enemy.maxHp = data.hp;
      this.enemy.hp = data.hp;
      this.enemy.atkRange = data.atk.slice();

      // 重設玩家
      this.player.hp = this.player.maxHp;
      this.player.shield = 0;

      return {
        player: this.player,
        enemy: this.enemy
      };
    },

    // 玩家攻擊
    playerAttack() {
      const dmg = this.random(2, 5);
      const actual = Math.max(1, dmg);

      this.enemy.hp -= actual;
      if (this.enemy.hp <= 0) {
        this.enemy.hp = 0;
        this.finish(true);
      }

      return { dmg: actual };
    },

    // 玩家防禦
    playerGuard() {
      const shieldGain = 4;
      this.player.shield += shieldGain;

      return { shield: shieldGain };
    },

    // 敵人攻擊
    enemyTurn() {
      const [min, max] = this.enemy.atkRange;
      const dmg = this.random(min, max);

      let taken = dmg;

      // 先消耗護盾
      if (this.player.shield > 0) {
        const absorbed = Math.min(this.player.shield, dmg);
        this.player.shield -= absorbed;
        taken -= absorbed;
      }

      // 造成傷害
      this.player.hp -= taken;
      if (this.player.hp <= 0) {
        this.player.hp = 0;
        this.finish(false);
      }

      return { dmg: taken };
    },

    // 戰鬥結束
    finish(isWin) {
      if (this.onEnd) {
        this.onEnd({ win: isWin, enemyId: this.enemy.id });
      }
    },

    random(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  };

  global.BattleCore = BattleCore;

})(window);