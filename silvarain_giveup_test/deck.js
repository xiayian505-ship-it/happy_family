// deck.js 簡化版牌堆管理
(function (global) {

  const Deck = {
    baseDeck: [
      { id:"atk1",  type:"attack", value:4, cost:1 },
      { id:"atk2",  type:"attack", value:4, cost:1 },
      { id:"atk3",  type:"attack", value:4, cost:1 },
      { id:"atk4",  type:"attack", value:4, cost:1 },

      { id:"grd1", type:"guard",  value:4, cost:1 },
      { id:"grd2", type:"guard",  value:4, cost:1 },

      { id:"heal1", type:"heal",  value:3, cost:1 },

      { id:"ene1", type:"energy", value:1, cost:0 }
    ],

    deck: [],   // 遊玩中用的牌堆（每回合重置）
    hand: [],   // 手牌（每回合 3 張）

    // 重置牌堆
    resetDeck() {
      this.deck = JSON.parse(JSON.stringify(this.baseDeck));
    },

    // 隨機抽 n 張，其中至少一張攻擊
    drawHand(n = 3) {
      this.resetDeck();

      const result = [];

      // 先抽 1 張 attack（保證至少一張攻擊）
      const attacks = this.deck.filter(c => c.type === "attack");
      const atkCard = attacks[Math.floor(Math.random() * attacks.length)];
      result.push(atkCard);

      // 從 deck 移除該卡
      this.deck = this.deck.filter(c => c.id !== atkCard.id);

      // 再抽剩下的
      while (result.length < n && this.deck.length > 0) {
        const idx = Math.floor(Math.random() * this.deck.length);
        result.push(this.deck[idx]);
        this.deck.splice(idx, 1);
      }

      this.hand = result;
      return result;
    },

    // 出牌後從手牌中移除
    removeCard(index) {
      this.hand.splice(index, 1);
    }
  };

  global.Deck = Deck;

})(window);