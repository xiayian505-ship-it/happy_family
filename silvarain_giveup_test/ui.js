// ui/ui.js
(function (global) {

  const Game = global.Game || (global.Game = {});

  /* ============================================================
      你原本的 UI（HP、金幣、體力、視圖切換）
  ============================================================ */

  Game.updateHpDisplay = function () {
    const hpEl = document.getElementById("hpDisplay");
    const maxHpEl = document.getElementById("maxHpDisplay");
    if (hpEl) hpEl.innerText = Game.hp;
    if (maxHpEl) maxHpEl.innerText = Game.maxHp;

    const php = document.getElementById("php");
    const maxPhp = document.getElementById("maxPhp");
    if (php) php.innerText = Game.hp;
    if (maxPhp) maxPhp.innerText = Game.maxHp;
  };

  Game.updateGoldDisplay = function () {
    const g1 = document.getElementById("goldDisplay");
    const g2 = document.getElementById("gold");
    if (g1) g1.innerText = Game.gold;
    if (g2) g2.innerText = Game.gold;
  };

  Game.updateStaminaDisplay = function () {
    const s = document.getElementById("staminaDisplay");
    if (s) s.innerText = Game.stamina;
  };

  Game.showView = function (id) {
    const views = document.querySelectorAll(".view");
    views.forEach(v => v.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
  };

  Game.backToStory = function () {
    Game.showView("storyView");
  };


  /* ============================================================
      方案 B：Story 專用 UI
      —— 這裡才是 UI.clearChoices / showText / showChoices
  ============================================================ */

  const UI = {};

  UI.showView = function(id) {
    const views = document.querySelectorAll(".view");
    views.forEach(v => v.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
  };

  UI.clearChoices = function() {
    const choiceList = document.getElementById("choiceList");
    if (choiceList) choiceList.innerHTML = "";
  };

  UI.showText = function(line) {
    const textBox = document.getElementById("storyText");
    const nameBox = document.getElementById("storyName");

    if (nameBox) nameBox.innerText = line.name || "";
    if (textBox) textBox.innerText = line.text || "";

    UI.clearChoices();
  };

  UI.showChoices = function(choices, onSelect) {
    const choiceList = document.getElementById("choiceList");
    if (!choiceList) return;

    UI.clearChoices();

    choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "choiceBtn";
      btn.innerText = c.text;
      btn.onclick = () => onSelect && onSelect(c.goto);
      choiceList.appendChild(btn);
    });
  };

  global.UI = UI;

})(window);