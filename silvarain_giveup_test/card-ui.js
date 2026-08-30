// ui/card-ui.js
(function (global) {

  const CardUI = {
    handEl: null,          // 手牌 DOM
    onSelectCallback: null, // 點擊卡牌的 callback

    /* ============================
       初始化（必須呼叫一次）
    ============================= */
    init() {
      this.handEl = document.getElementById("hand");
      if (!this.handEl) {
        console.warn("[CardUI] 找不到 #hand，請確認 HTML 已建立");
      }
    },

    /* ============================
       渲染手牌
       cards = [
         { id:"atk1", type:"attack", value:4, cost:1, img:"" },
         ...
       ]
    ============================= */
    renderHand(cards) {
      if (!this.handEl) return;

      this.handEl.innerHTML = "";

      cards.forEach((card, index) => {
        const el = document.createElement("div");
        el.className = `card ${card.type}`;

        el.innerHTML = `
          <img class="card-img" src="${card.img || ""}">
          <div class="card-value">${card.value}</div>
          <div class="card-type">${card.type}</div>
        `;

        // 點擊卡牌
        el.addEventListener("click", () => {
          if (this.onSelectCallback) {
            this.onSelectCallback(card, index);
          }
        });

        this.handEl.appendChild(el);
      });
    },

    /* ============================
       設定點擊卡牌的 callback
    ============================= */
    onSelect(callback) {
      this.onSelectCallback = callback;
    },

    /* ============================
       更新資訊（第二階段用）
    ============================= */
    updateState(state) {
      // 未來整合戰鬥時用
    },

    /* ============================
       顯示訊息（寫 battleLog）
    ============================= */
    showMessage(msg) {
      const logEl = document.getElementById("battleLog");
      if (logEl) logEl.textContent = msg;
    }
  };

  global.CardUI = CardUI;

})(window);