/* ============================================================
   実運用アカウント（管理者・打ち子）用の初期値
   ここは Upstash Redis に初回だけ書き込まれる「空の状態」。
   オーナーデモ(z/z)専用の見本データは lib/demoData.js を参照。
   ============================================================ */

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

/* 初回アクセス時にRedisへ投入する初期値一式（実運用は空スタート） */
export const SEED_DATA = {
  players: [],
  shops: [],
  machines: [],
  tags: [],
  records: [],
  cashEntries: [],
  koyaku: INITIAL_KOYAKU,
};
