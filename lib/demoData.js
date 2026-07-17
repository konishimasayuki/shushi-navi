/* ============================================================
   オーナーデモ専用データ (z/z ログイン時のみ使用)
   ここのデータはUpstash Redisには一切保存されない、完全にローカルの
   お試し表示用データ。ログインのたびに毎回この内容にリセットされる。
   ============================================================ */

/* n日前の日付をYYYY-MM-DD形式で返す（実行日基準の相対日付にして、期間フィルタの
   1ヶ月/3ヶ月/6ヶ月/1年/全期間がいつ見ても意味のある範囲になるようにしている） */
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const DEMO_PLAYERS = [
  { id: "pl1", name: "タカ", loginId: "taka", password: "1234" },
  { id: "pl2", name: "ケン", loginId: "ken", password: "1234" },
  { id: "pl3", name: "オーナー", loginId: "owner", password: "1234" },
];

export const DEMO_SHOPS = [
  { id: "sh1", name: "マルハン博多" },
  { id: "sh2", name: "ワンダーランド香椎" },
  { id: "sh3", name: "楽園大宮" },
];

/* 機種マスタ ※スペック値は公表値ベースの参考値 */
export const DEMO_MACHINES = [
  { id: "m1", name: "e Re:ゼロ2", kind: "pachinko", border: 17.5, oneRProb: 9.8, oneRDedama: 140, sapo: -0.2 },
  { id: "m2", name: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", border: 17.5, oneRProb: 9.5, oneRDedama: 137, sapo: -0.15 },
  { id: "m3", name: "P大工の源さん超韋駄天2", kind: "pachinko", border: 17.8, oneRProb: 10.2, oneRDedama: 145, sapo: -0.2 },
  { id: "m4", name: "スマスロ北斗の拳", kind: "slot", stages: 6, waris: [98.0, 98.9, 100.5, 104.6, 108.5, 113.0] },
  { id: "m5", name: "Lヴァルヴレイヴ", kind: "slot", stages: 6, waris: [97.9, 99.1, 100.8, 105.4, 110.1, 114.9] },
  { id: "m6", name: "スマスロ モンキーターンV", kind: "slot", stages: 6, waris: [97.8, 98.9, 100.7, 104.2, 108.1, 112.2] },
  { id: "m7", name: "マイジャグラーV", kind: "slot", stages: 6, waris: [97.0, 98.0, 99.9, 102.8, 105.3, 107.2] },
];

export const DEMO_TAGS = [
  { id: "t1", name: "設定狙い" },
  { id: "t2", name: "期待値" },
  { id: "t3", name: "リセット狙い" },
];

/* 約1年分・84件の稼働記録（グラフの期間フィルタ確認用に日付を分散させている） */
export const DEMO_RECORDS = [
  { id: "r1", date: daysAgo(2), playerId: "pl2", shop: "楽園大宮", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 10184, tamaUse: 0, tamaGet: 0, shigoto: -4697, tags: [], memo: "" },
  { id: "r2", date: daysAgo(5), playerId: "pl1", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 40000, cashout: 103716, tamaUse: 0, tamaGet: 1200, shigoto: 33623, tags: [], memo: "" },
  { id: "r3", date: daysAgo(8), playerId: "pl1", shop: "楽園大宮", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 40000, cashout: 21520, tamaUse: 0, tamaGet: 0, shigoto: -9091, tags: ["設定狙い"], memo: "" },
  { id: "r4", date: daysAgo(13), playerId: "pl1", shop: "楽園大宮", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 25000, cashout: 8884, tamaUse: 0, tamaGet: 0, shigoto: -6747, tags: ["リセット狙い"], memo: "" },
  { id: "r5", date: daysAgo(17), playerId: "pl2", shop: "ワンダーランド香椎", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 15000, cashout: 11203, tamaUse: 0, tamaGet: 0, shigoto: -3557, tags: ["リセット狙い"], memo: "" },
  { id: "r6", date: daysAgo(21), playerId: "pl1", shop: "楽園大宮", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 50000, cashout: 137257, tamaUse: 0, tamaGet: 500, shigoto: 50677, tags: [], memo: "" },
  { id: "r7", date: daysAgo(25), playerId: "pl2", shop: "楽園大宮", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 23687, tamaUse: 0, tamaGet: 0, shigoto: -2661, tags: [], memo: "" },
  { id: "r8", date: daysAgo(28), playerId: "pl2", shop: "ワンダーランド香椎", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 15000, cashout: 24900, tamaUse: 0, tamaGet: 800, shigoto: 3322, tags: ["設定狙い"], memo: "" },
  { id: "r9", date: daysAgo(31), playerId: "pl1", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 50000, cashout: 113844, tamaUse: 0, tamaGet: 1200, shigoto: 26177, tags: ["リセット狙い"], memo: "" },
  { id: "r10", date: daysAgo(37), playerId: "pl1", shop: "ワンダーランド香椎", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 20000, cashout: 62949, tamaUse: 0, tamaGet: 0, shigoto: 18526, tags: [], memo: "" },
  { id: "r11", date: daysAgo(40), playerId: "pl1", shop: "ワンダーランド香椎", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 25000, cashout: 2321, tamaUse: 0, tamaGet: 0, shigoto: -8324, tags: ["設定狙い"], memo: "" },
  { id: "r12", date: daysAgo(43), playerId: "pl2", shop: "マルハン博多", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 30000, cashout: 17975, tamaUse: 0, tamaGet: 0, shigoto: -3317, tags: [], memo: "" },
  { id: "r13", date: daysAgo(46), playerId: "pl1", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 5450, tamaUse: 0, tamaGet: 0, shigoto: -13951, tags: [], memo: "" },
  { id: "r14", date: daysAgo(50), playerId: "pl2", shop: "ワンダーランド香椎", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 30000, cashout: 15340, tamaUse: 0, tamaGet: 0, shigoto: -8182, tags: [], memo: "" },
  { id: "r15", date: daysAgo(54), playerId: "pl2", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 35000, cashout: 1813, tamaUse: 0, tamaGet: 0, shigoto: -16818, tags: [], memo: "" },
  { id: "r16", date: daysAgo(57), playerId: "pl1", shop: "楽園大宮", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 50000, cashout: 121528, tamaUse: 0, tamaGet: 0, shigoto: 39188, tags: [], memo: "" },
  { id: "r17", date: daysAgo(61), playerId: "pl1", shop: "楽園大宮", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 14413, tamaUse: 0, tamaGet: 0, shigoto: -8084, tags: [], memo: "" },
  { id: "r18", date: daysAgo(67), playerId: "pl1", shop: "ワンダーランド香椎", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 20000, cashout: 4199, tamaUse: 0, tamaGet: 0, shigoto: -5479, tags: ["期待値"], memo: "" },
  { id: "r19", date: daysAgo(71), playerId: "pl1", shop: "楽園大宮", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 35000, cashout: 107561, tamaUse: 0, tamaGet: 0, shigoto: 49610, tags: [], memo: "" },
  { id: "r20", date: daysAgo(77), playerId: "pl2", shop: "楽園大宮", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 40000, cashout: 126338, tamaUse: 0, tamaGet: 0, shigoto: 56498, tags: [], memo: "" },
  { id: "r21", date: daysAgo(82), playerId: "pl2", shop: "ワンダーランド香椎", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 20000, cashout: 3461, tamaUse: 0, tamaGet: 0, shigoto: -10573, tags: [], memo: "" },
  { id: "r22", date: daysAgo(85), playerId: "pl1", shop: "楽園大宮", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 50000, cashout: 65336, tamaUse: 0, tamaGet: 0, shigoto: 10153, tags: ["期待値"], memo: "" },
  { id: "r23", date: daysAgo(89), playerId: "pl1", shop: "マルハン博多", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 20000, cashout: 11684, tamaUse: 0, tamaGet: 0, shigoto: -6191, tags: ["期待値"], memo: "" },
  { id: "r24", date: daysAgo(95), playerId: "pl1", shop: "ワンダーランド香椎", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 20000, cashout: 4951, tamaUse: 0, tamaGet: 0, shigoto: -6011, tags: [], memo: "" },
  { id: "r25", date: daysAgo(100), playerId: "pl1", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 80984, tamaUse: 0, tamaGet: 2000, shigoto: 24654, tags: [], memo: "" },
  { id: "r26", date: daysAgo(105), playerId: "pl2", shop: "マルハン博多", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 15000, cashout: 20603, tamaUse: 0, tamaGet: 500, shigoto: 933, tags: [], memo: "" },
  { id: "r27", date: daysAgo(109), playerId: "pl1", shop: "マルハン博多", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 20000, cashout: 36586, tamaUse: 0, tamaGet: 0, shigoto: 7076, tags: [], memo: "" },
  { id: "r28", date: daysAgo(113), playerId: "pl2", shop: "マルハン博多", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 25000, cashout: 97658, tamaUse: 0, tamaGet: 300, shigoto: 27554, tags: [], memo: "" },
  { id: "r29", date: daysAgo(118), playerId: "pl2", shop: "楽園大宮", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 30000, cashout: 3991, tamaUse: 0, tamaGet: 0, shigoto: -8584, tags: [], memo: "" },
  { id: "r30", date: daysAgo(121), playerId: "pl2", shop: "ワンダーランド香椎", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 40000, cashout: 21187, tamaUse: 0, tamaGet: 0, shigoto: -12888, tags: [], memo: "" },
  { id: "r31", date: daysAgo(124), playerId: "pl2", shop: "ワンダーランド香椎", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 25000, cashout: 3357, tamaUse: 0, tamaGet: 0, shigoto: -12853, tags: [], memo: "" },
  { id: "r32", date: daysAgo(130), playerId: "pl2", shop: "ワンダーランド香椎", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 50000, cashout: 92256, tamaUse: 0, tamaGet: 2000, shigoto: 20422, tags: [], memo: "" },
  { id: "r33", date: daysAgo(133), playerId: "pl2", shop: "楽園大宮", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 40000, cashout: 25233, tamaUse: 0, tamaGet: 0, shigoto: -10783, tags: ["リセット狙い"], memo: "" },
  { id: "r34", date: daysAgo(138), playerId: "pl1", shop: "マルハン博多", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 20000, cashout: 2062, tamaUse: 0, tamaGet: 0, shigoto: -3293, tags: [], memo: "" },
  { id: "r35", date: daysAgo(143), playerId: "pl2", shop: "ワンダーランド香椎", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 35000, cashout: 91807, tamaUse: 0, tamaGet: 2000, shigoto: 26739, tags: [], memo: "" },
  { id: "r36", date: daysAgo(148), playerId: "pl2", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 50000, cashout: 22013, tamaUse: 0, tamaGet: 0, shigoto: -10463, tags: [], memo: "" },
  { id: "r37", date: daysAgo(151), playerId: "pl1", shop: "ワンダーランド香椎", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 30000, cashout: 15104, tamaUse: 0, tamaGet: 0, shigoto: -5823, tags: [], memo: "" },
  { id: "r38", date: daysAgo(157), playerId: "pl2", shop: "ワンダーランド香椎", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 50000, cashout: 125577, tamaUse: 0, tamaGet: 2000, shigoto: 45952, tags: ["期待値"], memo: "" },
  { id: "r39", date: daysAgo(160), playerId: "pl2", shop: "マルハン博多", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 25000, cashout: 58157, tamaUse: 0, tamaGet: 2000, shigoto: 10169, tags: ["設定狙い"], memo: "" },
  { id: "r40", date: daysAgo(166), playerId: "pl2", shop: "ワンダーランド香椎", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 35000, cashout: 1852, tamaUse: 0, tamaGet: 0, shigoto: -21651, tags: [], memo: "" },
  { id: "r41", date: daysAgo(169), playerId: "pl2", shop: "ワンダーランド香椎", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 25000, cashout: 51024, tamaUse: 0, tamaGet: 1200, shigoto: 19103, tags: [], memo: "" },
  { id: "r42", date: daysAgo(174), playerId: "pl2", shop: "マルハン博多", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 30000, cashout: 9915, tamaUse: 0, tamaGet: 0, shigoto: -9610, tags: [], memo: "" },
  { id: "r43", date: daysAgo(179), playerId: "pl1", shop: "楽園大宮", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 30000, cashout: 13922, tamaUse: 0, tamaGet: 0, shigoto: -5720, tags: [], memo: "" },
  { id: "r44", date: daysAgo(183), playerId: "pl1", shop: "ワンダーランド香椎", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 25000, cashout: 48025, tamaUse: 0, tamaGet: 500, shigoto: 13193, tags: [], memo: "" },
  { id: "r45", date: daysAgo(186), playerId: "pl2", shop: "マルハン博多", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 35000, cashout: 108802, tamaUse: 0, tamaGet: 2000, shigoto: 26171, tags: ["設定狙い"], memo: "" },
  { id: "r46", date: daysAgo(189), playerId: "pl1", shop: "マルハン博多", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 20000, cashout: 43995, tamaUse: 0, tamaGet: 500, shigoto: 10982, tags: [], memo: "" },
  { id: "r47", date: daysAgo(193), playerId: "pl1", shop: "楽園大宮", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 20000, cashout: 1513, tamaUse: 0, tamaGet: 0, shigoto: -6676, tags: [], memo: "" },
  { id: "r48", date: daysAgo(198), playerId: "pl2", shop: "楽園大宮", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 15000, cashout: 8721, tamaUse: 0, tamaGet: 0, shigoto: -1507, tags: [], memo: "" },
  { id: "r49", date: daysAgo(201), playerId: "pl1", shop: "ワンダーランド香椎", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 1758, tamaUse: 0, tamaGet: 0, shigoto: -18711, tags: [], memo: "" },
  { id: "r50", date: daysAgo(205), playerId: "pl1", shop: "ワンダーランド香椎", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 30000, cashout: 9145, tamaUse: 0, tamaGet: 0, shigoto: -10050, tags: [], memo: "" },
  { id: "r51", date: daysAgo(208), playerId: "pl2", shop: "ワンダーランド香椎", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 25000, cashout: 14537, tamaUse: 0, tamaGet: 0, shigoto: -1593, tags: ["期待値"], memo: "" },
  { id: "r52", date: daysAgo(214), playerId: "pl2", shop: "マルハン博多", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 25000, cashout: 50757, tamaUse: 0, tamaGet: 800, shigoto: 15148, tags: [], memo: "" },
  { id: "r53", date: daysAgo(219), playerId: "pl1", shop: "楽園大宮", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 15000, cashout: 37741, tamaUse: 0, tamaGet: 300, shigoto: 10574, tags: [], memo: "" },
  { id: "r54", date: daysAgo(225), playerId: "pl2", shop: "マルハン博多", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 25000, cashout: 80736, tamaUse: 0, tamaGet: 300, shigoto: 23955, tags: [], memo: "" },
  { id: "r55", date: daysAgo(230), playerId: "pl2", shop: "楽園大宮", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 25000, cashout: 4741, tamaUse: 0, tamaGet: 0, shigoto: -10011, tags: ["設定狙い"], memo: "" },
  { id: "r56", date: daysAgo(234), playerId: "pl1", shop: "マルハン博多", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 72606, tamaUse: 0, tamaGet: 0, shigoto: 26318, tags: [], memo: "" },
  { id: "r57", date: daysAgo(239), playerId: "pl1", shop: "ワンダーランド香椎", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 25000, cashout: 70883, tamaUse: 0, tamaGet: 800, shigoto: 21170, tags: [], memo: "" },
  { id: "r58", date: daysAgo(244), playerId: "pl2", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 35000, cashout: 77334, tamaUse: 0, tamaGet: 0, shigoto: 21262, tags: [], memo: "" },
  { id: "r59", date: daysAgo(248), playerId: "pl1", shop: "マルハン博多", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 30000, cashout: 92208, tamaUse: 0, tamaGet: 800, shigoto: 18242, tags: [], memo: "" },
  { id: "r60", date: daysAgo(253), playerId: "pl1", shop: "マルハン博多", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 50000, cashout: 121632, tamaUse: 0, tamaGet: 500, shigoto: 40863, tags: [], memo: "" },
  { id: "r61", date: daysAgo(256), playerId: "pl2", shop: "楽園大宮", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 25000, cashout: 1054, tamaUse: 0, tamaGet: 0, shigoto: -18383, tags: [], memo: "" },
  { id: "r62", date: daysAgo(260), playerId: "pl2", shop: "楽園大宮", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 20000, cashout: 46975, tamaUse: 0, tamaGet: 2000, shigoto: 9232, tags: [], memo: "" },
  { id: "r63", date: daysAgo(264), playerId: "pl1", shop: "マルハン博多", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 25000, cashout: 7945, tamaUse: 0, tamaGet: 0, shigoto: -7686, tags: [], memo: "" },
  { id: "r64", date: daysAgo(268), playerId: "pl2", shop: "マルハン博多", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 20000, cashout: 15442, tamaUse: 0, tamaGet: 0, shigoto: -5446, tags: ["期待値"], memo: "" },
  { id: "r65", date: daysAgo(274), playerId: "pl2", shop: "マルハン博多", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 25000, cashout: 16496, tamaUse: 0, tamaGet: 0, shigoto: -4284, tags: ["設定狙い"], memo: "" },
  { id: "r66", date: daysAgo(280), playerId: "pl2", shop: "楽園大宮", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 15000, cashout: 58571, tamaUse: 0, tamaGet: 0, shigoto: 28016, tags: [], memo: "" },
  { id: "r67", date: daysAgo(285), playerId: "pl1", shop: "マルハン博多", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 40000, cashout: 25650, tamaUse: 0, tamaGet: 0, shigoto: -4920, tags: [], memo: "" },
  { id: "r68", date: daysAgo(289), playerId: "pl1", shop: "ワンダーランド香椎", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 30000, cashout: 95260, tamaUse: 0, tamaGet: 300, shigoto: 41117, tags: [], memo: "" },
  { id: "r69", date: daysAgo(294), playerId: "pl1", shop: "ワンダーランド香椎", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 25000, cashout: 44745, tamaUse: 0, tamaGet: 0, shigoto: 13849, tags: [], memo: "" },
  { id: "r70", date: daysAgo(297), playerId: "pl2", shop: "マルハン博多", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 40000, cashout: 135644, tamaUse: 0, tamaGet: 0, shigoto: 53919, tags: [], memo: "" },
  { id: "r71", date: daysAgo(301), playerId: "pl2", shop: "ワンダーランド香椎", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 94469, tamaUse: 0, tamaGet: 0, shigoto: 33477, tags: [], memo: "" },
  { id: "r72", date: daysAgo(304), playerId: "pl2", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 50000, cashout: 19611, tamaUse: 0, tamaGet: 0, shigoto: -8551, tags: [], memo: "" },
  { id: "r73", date: daysAgo(309), playerId: "pl2", shop: "ワンダーランド香椎", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 30000, cashout: 86344, tamaUse: 0, tamaGet: 800, shigoto: 27657, tags: [], memo: "" },
  { id: "r74", date: daysAgo(315), playerId: "pl1", shop: "ワンダーランド香椎", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 25000, cashout: 10789, tamaUse: 0, tamaGet: 0, shigoto: -10230, tags: [], memo: "" },
  { id: "r75", date: daysAgo(320), playerId: "pl1", shop: "ワンダーランド香椎", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 25000, cashout: 85179, tamaUse: 0, tamaGet: 0, shigoto: 29298, tags: [], memo: "" },
  { id: "r76", date: daysAgo(323), playerId: "pl2", shop: "マルハン博多", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 15000, cashout: 32979, tamaUse: 0, tamaGet: 2000, shigoto: 11250, tags: [], memo: "" },
  { id: "r77", date: daysAgo(327), playerId: "pl2", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 35000, cashout: 9876, tamaUse: 0, tamaGet: 0, shigoto: -6475, tags: ["期待値"], memo: "" },
  { id: "r78", date: daysAgo(332), playerId: "pl1", shop: "ワンダーランド香椎", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 20000, cashout: 55697, tamaUse: 0, tamaGet: 500, shigoto: 15232, tags: [], memo: "" },
  { id: "r79", date: daysAgo(336), playerId: "pl2", shop: "ワンダーランド香椎", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 40000, cashout: 66842, tamaUse: 0, tamaGet: 0, shigoto: 16933, tags: [], memo: "" },
  { id: "r80", date: daysAgo(342), playerId: "pl1", shop: "楽園大宮", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 30000, cashout: 67459, tamaUse: 0, tamaGet: 0, shigoto: 10793, tags: [], memo: "" },
  { id: "r81", date: daysAgo(348), playerId: "pl2", shop: "マルハン博多", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 40000, cashout: 19090, tamaUse: 0, tamaGet: 0, shigoto: -9403, tags: [], memo: "" },
  { id: "r82", date: daysAgo(354), playerId: "pl1", shop: "ワンダーランド香椎", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 20000, cashout: 3555, tamaUse: 0, tamaGet: 0, shigoto: -9066, tags: [], memo: "" },
  { id: "r83", date: daysAgo(358), playerId: "pl1", shop: "マルハン博多", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 25000, cashout: 5235, tamaUse: 0, tamaGet: 0, shigoto: -12583, tags: [], memo: "" },
  { id: "r84", date: daysAgo(363), playerId: "pl1", shop: "ワンダーランド香椎", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 15000, cashout: 43947, tamaUse: 0, tamaGet: 0, shigoto: 17803, tags: ["リセット狙い"], memo: "" },];

/* 約1年分の現金出納帳デモデータ */
export const DEMO_CASH = [
  { id: "c1", date: daysAgo(400), type: "in", category: "出資金", amount: 500000, memo: "初期出資（オーナー）" },
  { id: "c2", date: daysAgo(370), type: "out", category: "経費", amount: 3000, memo: "交通費・雑費" },
  { id: "c3", date: daysAgo(340), type: "out", category: "経費", amount: 4500, memo: "交通費・雑費" },
  { id: "c4", date: daysAgo(310), type: "out", category: "経費", amount: 2800, memo: "交通費・雑費" },
  { id: "c5", date: daysAgo(280), type: "out", category: "経費", amount: 5200, memo: "交通費・雑費" },
  { id: "c6", date: daysAgo(250), type: "out", category: "経費", amount: 3600, memo: "交通費・雑費" },
  { id: "c7", date: daysAgo(220), type: "out", category: "経費", amount: 4000, memo: "交通費・雑費" },
  { id: "c8", date: daysAgo(190), type: "out", category: "経費", amount: 3300, memo: "交通費・雑費" },
  { id: "c9", date: daysAgo(160), type: "out", category: "経費", amount: 2900, memo: "交通費・雑費" },
  { id: "c10", date: daysAgo(130), type: "out", category: "経費", amount: 4800, memo: "交通費・雑費" },
  { id: "c11", date: daysAgo(100), type: "out", category: "経費", amount: 3100, memo: "交通費・雑費" },
  { id: "c12", date: daysAgo(70), type: "out", category: "経費", amount: 3900, memo: "交通費・雑費" },
  { id: "c13", date: daysAgo(40), type: "out", category: "経費", amount: 4200, memo: "交通費・雑費" },
  { id: "c14", date: daysAgo(15), type: "out", category: "経費", amount: 3500, memo: "交通費・雑費" },
  { id: "c15", date: daysAgo(180), type: "in", category: "出資金", amount: 200000, memo: "追加出資（オーナー）" },];

export const DEMO_KOYAKU = {
  preset: "generic",
  mode: "A",
  genzan: false,
  memo: "",
  jugglerMachine: "my5",
  modes: {
    A: { startGames: "", totalGames: "", counts: {} },
    B: { startGames: "", totalGames: "", counts: {} },
  },
};
