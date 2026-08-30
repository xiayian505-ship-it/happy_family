// story/chapter1.js
(function (global) {
  const Story = global.Story;

  Story.lines.push(

  // ===== 第一章入口 =====
  { label: "CH1_START" },

  // ===== Chapter Title =====
  { type: "text", name: "旁白", text: "選中之人踏上旅途，尋夢將至——終會依附彼岸。" },
  { type: "text", name: "旁白", text: "迷霧散盡，鹿雨森默然守候——靜待你的歸來。" },
  { type: "text", name: "旁白", text: "微光流轉於林，浮沉入夢。生命之樹低語：『此地，為你停留。』" },

    // ===== Chapter 1-1 =====
    { type: "text", name: "旁白", text: "鹿雨森的雨，不曾真正停過。" },
    { type: "text", name: "旁白", text: "璐瑤當然還不知道——更不知道，他會被這裡深深吸引。" },

    { type: "text", name: "旁白", text: "他跟著燐珣穿越濃霧籠罩的沼澤。腳下踏過的每一步明明陌生、卻又無比熟悉。" },
    { type: "text", name: "旁白", text: "周身滿是濕氣，但卻沒有一絲涼意。" },
    { type: "text", name: "旁白", text: "即便困惑，他仍跟在燐珣身邊。從睜眼看到這個世界起，疑問就沒有停止過。" },

    { type: "text", name: "旁白", text: "他忽然想起一個從一開始就被自己忽略的問題——如果這裡不屬於自己，那自己又從何而來？" },

    // ===== 生命之樹 =====
    { type: "text", name: "旁白", text: "直至一棵參天大樹映入眼簾，燐珣的腳步才終於停下。" },
    { type: "text", name: "旁白", text: "那棵大樹高達天際，枝葉層層交疊，綠得濃郁，將整片大地籠罩其中。" },

    { type: "text", name: "麻糬", text: "璐瑤，這是生命之樹。或者你想叫它中央公寓也行。總之，這是我們住的地方。" },
    { type: "text", name: "璐瑤", text: "我也住這裡？" },

    { type: "text", name: "旁白", text: "他奇怪地看著眼前的大樹——自己這個初來乍到、外貌格格不入的人，也住得進去？" },

    // ===== 棠月登場 =====
    { type: "text", name: "棠月", text: "起碼你絕對不會是住在星落城，或塵埃谷。哥哥，你終於來了！" },
    { type: "text", name: "璐瑤", text: "哥哥？我？" },

    { type: "text", name: "棠月", text: "吼，燐珣你又沒講清楚！" },
    { type: "text", name: "旁白", text: "雖然話中指的是燐珣，但女孩開口對象卻是麻糬——這點細節，璐瑤沒有漏看。" },

    { type: "text", name: "旁白", text: "同時他也發現：燐珣似乎不好接近？" },

    { type: "text", name: "麻糬", text: "不是我的錯喔！妳也知道，阿珣本來就是這樣。" },
    { type: "text", name: "棠月", text: "也是。" },

    { type: "text", name: "棠月", text: "那麼，哥哥，自我介紹一下，我是棠月！" },
    { type: "text", name: "旁白", text: "棠月、棠月……璐瑤低喃兩次。她的名字讓他莫名感到熟悉。" },

    { type: "text", name: "旁白", text: "甚至不只名字——自從他睜眼的那刻開始，一切都讓他奇異地熟悉。" },

    // ===== 生命之樹解說 =====
    { type: "text", name: "棠月", text: "這是鹿雨森裡的生命之樹。你被祂選中了，才能住在這裡。" },
    { type: "text", name: "棠月", text: "這裡是唯一和平的中央公寓。" },

    { type: "text", name: "璐瑤", text: "和平……你們在打仗嗎？" },

    { type: "text", name: "麻糬", text: "棠月。" },

    { type: "text", name: "棠月", text: "在！" },
    { type: "text", name: "旁白", text: "明明是麻糬開口，棠月的視線卻停在燐珣身上——她欲言又止。" },

    { type: "text", name: "旁白", text: "璐瑤也跟著棠月的視線，看向麻糬。" },

    { type: "text", name: "麻糬", text: "棠月，燐珣該工作了。" },
    { type: "text", name: "棠月", text: "沒問題，哥哥交給我！拜拜，工作狂！" },

    { type: "text", name: "旁白", text: "聽見『工作狂』，燐珣腳步頓了一下。他沒有回應，只稍微偏頭，視線掃過璐瑤一瞬，便與麻糬一起離開。" },

    // ===== 小小選項（自然嵌入）=====
    {
      type: "choice",
      choices: [
        { text: "……他到底要去哪？", goto: "CH1_AFTER_REN" },
        { text: "他常常這樣嗎？", goto: "CH1_AFTER_REN" }
      ]
    },

    { label: "CH1_AFTER_REN" },

    { type: "text", name: "璐瑤", text: "燐珣是去……打仗？" },
    { type: "text", name: "棠月", text: "以後你會知道的，哥哥。這裡可是鹿雨森，是唯一的中立區。" },

    { type: "text", name: "棠月", text: "打仗的是星落城和塵埃谷，她們打了百年都不分勝負。不過，不用擔心。" },

    { type: "text", name: "旁白", text: "璐瑤點點頭。語氣雖輕鬆，但他總覺得棠月藏了很多事。" },

    { type: "text", name: "璐瑤", text: "可要是打到這裡來呢？" },
    { type: "text", name: "棠月", text: "剛剛你踏過來的那片沼澤，只有燐珣能穿越。沒有他，誰也到不了鹿雨森。" },

    { type: "text", name: "璐瑤", text: "可是……我明明到了這裡。" },
    { type: "text", name: "棠月", text: "是燐珣帶著你來的呀。" },

    { type: "text", name: "旁白", text: "璐瑤愣住。想反駁，卻發現……確實是這麼回事。" },

    { type: "text", name: "璐瑤", text: "那，為什麼叫我哥哥？" },

    { type: "text", name: "棠月", text: "因為——哥哥就是哥哥啊！" },

    { type: "text", name: "旁白", text: "那聲音沒有任何解釋，卻有著無法質疑的堅定。" },
    { type: "text", name: "旁白", text: "璐瑤還想說什麼，但那句『我們第一次見面吧？』卻怎麼也說不出口。" },

    { type: "text", name: "旁白", text: "雨聲漸強，霧色更濃，世界彷彾成了兩個時空。" },

    // ===== Chapter 1-2 =====
    { type: "text", name: "旁白", text: "細雨再次落下，綿延不斷，像是要讓世界被水覆蓋。" },
    { type: "text", name: "旁白", text: "璐瑤轉頭看向生命之樹，心底浮現一股暖意。枝葉隨風搖曳，像是在歡迎他回家。" },

    { type: "text", name: "旁白", text: "疑惑卻更深。他不記得來過這裡，但景象卻彷彿刻進靈魂。" },

    { type: "text", name: "旁白", text: "無論是燐珣、麻糬、棠月……對他，都不像初識。" },
    { type: "text", name: "旁白", text: "明明他什麼也不記得。" },

    { type: "text", name: "旁白", text: "雨水落在他髮絲，又滑到臉頰上，冰涼。" },

    { type: "text", name: "旁白", text: "霧氣、細雨……氣候，不自然。" },
    { type: "text", name: "旁白", text: "不自然？為什麼會這麼想？如果這樣不自然——那，什麼才自然？" },

{ type: "text", name: "???", text: "『悄然拭去的，是誰曾經的名？』" },

{ type: "text", name: "旁白", text: "那低喃來自哪裡？" },

// ===== 劇情插入戰鬥 =====
{ type: "battle", boss: "boss2" },

{ type: "text", name: "旁白", text: "一片落葉飄下，他伸手接住。瞬間似有什麼掠過視線——那是鹿？還是別的什麼？" },

    { type: "text", name: "旁白", text: "他瞇著眼想看清，霧氣卻更濃。指尖微微發顫。" },

    { type: "text", name: "旁白", text: "記得這裡嗎？他不知道。" },
    { type: "text", name: "旁白", text: "但下一秒，他踏向生命之樹。" },

    { type: "text", name: "旁白", text: "也許，他真的是回來了。" },
    { type: "text", name: "旁白", text: "也許，有些相遇，從來都不是巧合。" },

    // ===== End =====
    { type: "text", name: "旁白", text: "第一章 Fin" },

    {
      type: "choice",
      choices: [
        { text: "← 回到序章", goto: "PROLOGUE_START" },
        { text: "→ 前往第二章", goto: "CH2_START" }
      ]
    },

    { label: "CH1_END" }

  );   // ← push 結束

})(window);   // ← IIFE 結束