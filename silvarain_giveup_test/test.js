// card-ui 測試手牌
const testHand = [
  { id: "atk1", type: "attack", value: 4, cost: 1, img: "" },
  { id: "grd1", type: "guard",  value: 4, cost: 1, img: "" },
  { id: "ene1", type: "energy", value: 1, cost: 0, img: "" },
  { id: "heal1", type: "heal",  value: 3, cost: 1, img: "" }
];

// 初始化 card-ui
CardUI.init();

// 顯示手牌
CardUI.renderHand(testHand);

// 點到哪張卡 → 印出
CardUI.onSelect((card, index) => {
  console.log("你選擇了：", card.id, card);
});