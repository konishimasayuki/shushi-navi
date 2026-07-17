/* n日前の日付をYYYY-MM-DD形式で返す（デモデータを実行日基準の相対日付にするため） */
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

/* ※日付は実行日からの相対日付(daysAgo)。期間フィルタ(1ヶ月/3ヶ月/6ヶ月/1年/全期間)で
   それぞれ異なる範囲になるよう、直近〜1年以上前まで意図的に分散させている */
export const DEMO_RECORDS = [
  { id: "r1", date: daysAgo(3), playerId: "pl1", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 30000, cashout: 82000, tamaUse: 0, tamaGet: 1500, shigoto: 6000, startTime: "09:00", endTime: "15:30", tags: ["期待値"], memo: "朝イチ台" },
  { id: "r2", date: daysAgo(6), playerId: "pl2", shop: "ワンダーランド香椎", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 40000, cashout: 12000, tamaUse: 0, tamaGet: 0, shigoto: 4500, startTime: "10:00", endTime: "18:00", tags: ["設定狙い"], memo: "" },
  { id: "r3", date: daysAgo(11), playerId: "pl1", shop: "マルハン博多", machine: "eフィーバー機動戦士ガンダムSEED", kind: "pachinko", rate: "p4", invest: 15000, cashout: 0, tamaUse: 1500, tamaGet: 5200, shigoto: 5000, memo: "貯玉使用→伸びた" },
  { id: "r4", date: daysAgo(18), playerId: "pl2", shop: "ワンダーランド香椎", machine: "Lヴァルヴレイヴ", kind: "slot", rate: "s20", invest: 25000, cashout: 98000, tamaUse: 0, tamaGet: 800, shigoto: 7000, tags: ["リセット狙い"], memo: "" },
  { id: "r5", date: daysAgo(25), playerId: "pl1", shop: "楽園大宮", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 50000, cashout: 21000, tamaUse: 0, tamaGet: 0, shigoto: 8000, memo: "回るけど当たらず" },
  { id: "r6", date: daysAgo(28), playerId: "pl2", shop: "マルハン博多", machine: "スマスロ モンキーターンV", kind: "slot", rate: "s20", invest: 20000, cashout: 64000, tamaUse: 0, tamaGet: 1200, shigoto: 5500, memo: "" },
  { id: "r7", date: daysAgo(55), playerId: "pl1", shop: "楽園大宮", machine: "マイジャグラーV", kind: "slot", rate: "s20", invest: 20000, cashout: 5000, tamaUse: 0, tamaGet: 0, shigoto: 3000, memo: "設定1臭い" },
  { id: "r8", date: daysAgo(100), playerId: "pl2", shop: "マルハン博多", machine: "e Re:ゼロ2", kind: "pachinko", rate: "p4", invest: 40000, cashout: 60000, tamaUse: 0, tamaGet: 900, shigoto: 4000, memo: "" },
  { id: "r9", date: daysAgo(200), playerId: "pl1", shop: "ワンダーランド香椎", machine: "スマスロ北斗の拳", kind: "slot", rate: "s20", invest: 30000, cashout: 10000, tamaUse: 0, tamaGet: 0, shigoto: -2000, memo: "" },
  { id: "r10", date: daysAgo(380), playerId: "pl2", shop: "楽園大宮", machine: "P大工の源さん超韋駄天2", kind: "pachinko", rate: "p4", invest: 25000, cashout: 45000, tamaUse: 0, tamaGet: 0, shigoto: 3500, memo: "1年以上前の記録" },
];

export const DEMO_CASH = [
  { id: "c1", date: daysAgo(400), type: "in", category: "出資金", amount: 300000, memo: "初期出資（オーナー）" },
  { id: "c2", date: daysAgo(9), type: "out", category: "経費", amount: 3000, memo: "交通費" },
];

export const INITIAL_KOYAKU = {
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

/* Redisキー名の一覧（APIルートとクライアントで共有） */
export const DATA_KEYS = ["players", "shops", "machines", "tags", "records", "cashEntries", "koyaku"];

/* 初回アクセス時にRedisへ投入する初期値一式 */
export const SEED_DATA = {
  players: DEMO_PLAYERS,
  shops: DEMO_SHOPS,
  machines: DEMO_MACHINES,
  tags: DEMO_TAGS,
  records: DEMO_RECORDS,
  cashEntries: DEMO_CASH,
  koyaku: INITIAL_KOYAKU,
};
