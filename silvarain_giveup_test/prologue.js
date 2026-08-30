// story/prologue.js
(function (global) {
  const Story = global.Story;

  Story.lines.push(
    // ===== 序章標題 =====
    { type: "text", name: "旁白", text: "夢墜於霧中，鹿角乍見於日落之際。" },
    { type: "text", name: "旁白", text: "雨漫林間，幽徑浮現，似遠、似近，亦如幻境。" },
    { type: "text", name: "旁白", text: "無聲的召喚，引你而行——那是一場迷失？或者，命定歸途？" },
    { type: "battle", boss: "boss2" },//插入戰鬥用這行

    // ===== 正文開場 =====
    { type: "text", name: "旁白", text: "『此地，為你停留。』微風掠過樹梢，霧氣氤氳，如夢似幻。" },
    { type: "text", name: "旁白", text: "他緩緩睜眼，視線朦朧，隱約中似乎看見……？" },
    { type: "text", name: "旁白", text: "想看清時卻又消失。霧氣瀰漫，耳邊只有水聲、風聲與自己微弱的心跳聲。" },

    // ===== 第一個玩家選項 =====
    {
      type: "choice",
      choices: [
        { text: "剛剛那是⋯⋯？", goto: "P0_WAKE" },
        { text: "聽到的，是誰的聲音？", goto: "P0_WAKE" },
        { text: "這裡，是哪？", goto: "P0_WAKE" }
      ]
    },

    { label: "P0_WAKE" },
    { type: "text", name: "旁白", text: "一道少年的聲音自身後響起。" },

    // ===== 燐珣登場 =====
    { type: "text", name: "？？", text: "醒了。" },
    { type: "text", name: "旁白", text: "於是，他循聲轉頭，眨了眨眼，然後看到了他——鈷藍髮、赤紅瞳，狼耳微動。" },
    { type: "text", name: "旁白", text: "肩上趴著一隻長著翅膀的小老鼠。" },
    { type: "text", name: "旁白", text: "這裡不是自己熟悉的世界⋯⋯但卻異常熟悉。" },

    // ===== 璐瑤說話 =====
    { type: "text", name: "你", text: "你……是誰？" },
    { type: "text", name: "？？", text: "你又回到了鹿雨森。" },
    { type: "text", name: "你", text: "你認錯人了？" },
    { type: "text", name: "？？", text: "你又回到了鹿雨森。" },

    { type: "text", name: "旁白", text: "『又』？難道，這不是他第一次來？" },
    { type: "text", name: "你", text: "我們……以前見過？" },

    // ===== 麻糬登場 =====
    { type: "text", name: "麻糬", text: "他是燐珣，我是麻糬，你呢？" },
    { type: "text", name: "璐瑤", text: "璐瑤……吧？" },
    { type: "text", name: "麻糬", text: "果然是璐瑤。" },
    { type: "text", name: "旁白", text: "燐珣冷冷看了麻糬一眼，示意閉嘴。" },

    // ===== 行動開始 =====
    { type: "text", name: "燐珣", text: "走。" },
    { type: "text", name: "旁白", text: "明明像命令，璐瑤卻下意識點頭。他不知道為何自己對這少年有種奇異的信任。" },

    // ===== 霧散，沼澤出現 =====
    { type: "text", name: "旁白", text: "霧氣散去，巨大的沼澤浮現，如沈默的守護者般矗立在前。" },
    { type: "text", name: "燐珣", text: "由祂決定。" },
    { type: "text", name: "旁白", text: "他手中不知何時出現一盞燈籠，光芒微微跳動。" },

    { type: "text", name: "璐瑤", text: "決定什麼？" },
    { type: "text", name: "燐珣", text: "鹿雨森。不管哪一次，都是鹿雨森。" },

    { type: "text", name: "旁白", text: "……他忽然意識到：自己似乎知道燈籠在指引方向，可他又不該知道。" },

    // ===== 心中波動 =====
    { type: "text", name: "麻糬", text: "璐瑤果然還是回到鹿雨森。" },

    { type: "text", name: "旁白", text: "他看著狼耳與小小的翅膀——自己，真的屬於這裡嗎？" },
    { type: "text", name: "旁白", text: "還是……其實不屬於？但為何，卻又覺得他們像家人？" },

    { type: "text", name: "旁白", text: "或許，自己不是迷路，而是踏上歸途。" },
    { type: "text", name: "旁白", text: "自己是誰？忘了什麼？錯過了什麼？「璐瑤」真的是自己的名字嗎？" },

    // ===== 序章結尾 =====
    { type: "text", name: "旁白", text: "序章 Fin" },

  /* ------------------------------------------------------------
    // ===== 章節跳轉 =====
    {
      type: "choice",
      choices: [
        { text: "→ 前往第一章", goto: "CH1_START" }
      ]
    },
  ------------------------------------------------------------ */
  
  {
  type: "choice",
  choices: [
    {
      text: "→ 前往第一章",
      action: () => Game.startChapter1()
    }
  ]
},
  
    // 序章起點
    { label: "PROLOGUE_START" }

  ); 

})(window);