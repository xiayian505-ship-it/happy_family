// engine/stamina.js
(function (global) {
  const Game = global.Game;

  // ===== 檢查體力自動回復（每分鐘 +1） =====
  Game.checkStaminaRecover = function () {
    const now = Date.now();
    if (now - Game.lastRecoverTime >= 60000) {
      Game.stamina = Math.min(Game.maxStamina, Game.stamina + 1);
      Game.lastRecoverTime = now;
      if (Game.updateStaminaDisplay) Game.updateStaminaDisplay();
    }
  };

  // ===== 消耗體力 =====
  Game.consumeStamina = function (amount) {
    Game.checkStaminaRecover();

    if (Game.stamina < amount) {
      alert("體力不足，無法行動。");
      return false;
    }

    Game.stamina -= amount;

    if (Game.updateStaminaDisplay) Game.updateStaminaDisplay();
    return true;
  };

})(window);