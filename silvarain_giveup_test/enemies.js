// data/enemies.js
(function (global) {
  const EnemyData = {
    mob1: {
      name: "普通敵人·霧影獸",
      hp: 12,
      atk: [1, 3]
    },
    mob2: {
      name: "普通敵人·沼行者",
      hp: 15,
      atk: [1, 4]
    },
    elite1: {
      name: "菁英敵人·森語守衛",
      hp: 22,
      atk: [2, 5]
    },
    boss1: {
      name: "BOSS·霧鹿",
      hp: 35,
      atk: [3, 6]
    },
    boss2: {
      name: "BOSS·古樹回響",
      hp: 100,
      atk: [4, 8]
    }
  };

  global.EnemyData = EnemyData;
})(window);