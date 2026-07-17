"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  DEMO_PLAYERS,
  DEMO_SHOPS,
  DEMO_MACHINES,
  DEMO_TAGS,
  DEMO_RECORDS,
  DEMO_CASH,
  INITIAL_KOYAKU,
} from "../lib/seedData";

/* ============================================================
   収支管理システム - パチンコ・パチスロ収支管理システム
   出資者(オーナー)が資金提供 → 打ち子がその資金で稼働
   カレンダー / 稼働記録 / 期待値(仕事量) / 現金出納帳 / 貯玉出納帳 / 設定
   データはUpstash Redis(/api/data経由)で永続化。
   起動直後はlib/seedDataの初期値を仮表示し、Redisから取得でき次第置き換わる。
   ============================================================ */

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { margin: 0; }
input, select, textarea, button { font-family: inherit; }
input:focus, select:focus, textarea:focus { outline: 2px solid #E8B54A; outline-offset: 1px; }
@keyframes ledIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes drawerIn { from { transform: translateX(100%); } to { transform: none; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

/* アプリ名（決定したらここを変更するだけで全画面に反映） */
const APP_NAME = "収支管理システム";
/* オーナー用デモアカウント（全体を閲覧できるが、設定(打ち子登録等)は管理者のみ） */
const DEMO_ACCOUNT = { id: "z", pw: "z" };
/* 管理者アカウント（打ち子の登録・店舗/機種/タグ管理などマスタ管理が可能） */
const ADMIN_ACCOUNT = { id: "b", pw: "b" };

const C = {
  bg: "#0E0F16",
  panel: "#181A24",
  panel2: "#1F2230",
  line: "#2A2E40",
  text: "#E8EAF2",
  sub: "#8B90A5",
  gold: "#E8B54A",
  plus: "#3DDC97",
  minus: "#FF5A6E",
  pachi: "#FF6B8A",
  slot: "#5AB0FF",
};

const yen = (n) => (n < 0 ? "-" : "") + "¥" + Math.abs(n).toLocaleString("ja-JP");
const signYen = (n) => (n > 0 ? "+" : n < 0 ? "-" : "±") + "¥" + Math.abs(n).toLocaleString("ja-JP");
const abbrev = (n) => {
  const a = Math.abs(n);
  const s = n > 0 ? "+" : "-";
  if (a >= 10000) {
    const v = a / 10000;
    return s + (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + "万";
  }
  return s + Math.round(a / 1000) + "k";
};
const num = (n) => Number(n) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  const [, m, dd] = d.split("-");
  return `${m}/${dd}`;
};

const RATES = {
  pachinko: [
    { id: "p4", label: "4円", unit: "玉" },
    { id: "p1", label: "1円", unit: "玉" },
    { id: "p05", label: "0.5円", unit: "玉" },
  ],
  slot: [
    { id: "s20", label: "20円", unit: "枚" },
    { id: "s5", label: "5円", unit: "枚" },
    { id: "s2", label: "2円", unit: "枚" },
  ],
};
const rateLabel = (id) =>
  [...RATES.pachinko, ...RATES.slot].find((r) => r.id === id) || RATES.pachinko[0];

/* 交換率（円/玉） */
const EXCHANGE_RATES = [
  { v: 4.0, label: "等価（4.0円）" },
  { v: 3.64, label: "3.64円（27.5玉）" },
  { v: 3.57, label: "3.57円（28玉）" },
  { v: 3.33, label: "3.33円（30玉）" },
  { v: 3.03, label: "3.03円（33玉）" },
  { v: 2.5, label: "2.5円（40玉）" },
];

/* デモデータ・初期値は lib/seedData.js に集約（APIルートの初回シードと共有するため） */
const CASH_CATEGORIES = { in: ["出資金", "その他入金"], out: ["分配金", "経費", "その他出金"] };

let _uid = 100;
const uid = (p) => p + ++_uid + Date.now().toString(36);

/* レート → 1玉/1枚あたりの円価値（等価基準） */
const RATE_VALUE = { p4: 4, p1: 1, p05: 0.5, s20: 20, s5: 5, s2: 2 };

/* ============================================================
   ジャグラー設定推測用 内蔵スペックDB
   ※確率・機械割は公表値ベースの参考値
   ============================================================ */
const JUGGLERS = [
  {
    id: "my5",
    name: "マイジャグラーV",
    big: [273.1, 270.8, 266.4, 254.0, 240.1, 229.1],
    reg: [409.6, 385.5, 336.1, 290.0, 268.6, 229.1],
    grape: [5.9, 5.85, 5.8, 5.78, 5.76, 5.66],
    wari: [97.0, 98.0, 99.9, 102.8, 105.3, 107.2],
  },
  {
    id: "im",
    name: "アイムジャグラーEX",
    big: [273.1, 269.7, 269.7, 259.0, 259.0, 255.0],
    reg: [439.8, 399.6, 331.0, 315.1, 255.0, 255.0],
    grape: [6.02, 6.02, 6.02, 6.02, 6.02, 5.78],
    wari: [97.0, 98.0, 99.5, 101.1, 103.3, 105.5],
  },
  {
    id: "fk2",
    name: "ファンキージャグラー2",
    big: [266.4, 259.0, 256.0, 249.2, 240.1, 219.9],
    reg: [439.8, 407.1, 366.1, 322.8, 299.3, 262.1],
    grape: [5.94, 5.92, 5.9, 5.88, 5.83, 5.75],
    wari: [97.0, 98.0, 99.2, 101.4, 103.6, 106.0],
  },
];

/* ============================================================
   小役カウンター プリセット
   ============================================================ */
const KOYAKU_PRESETS = [
  {
    id: "juggler",
    name: "ジャグラー",
    counters: [
      { id: "grape", label: "🍇ぶどう", color: "#4CC764" },
      { id: "cherry", label: "🍒チェリー", color: "#E8493C" },
      { id: "doku_big", label: "単独BIG", color: "#F5C93B" },
      { id: "judai_big", label: "重複BIG", color: "#F2A93B" },
      { id: "nakache_big", label: "中チェBIG", color: "#E8823B" },
      { id: "doku_reg", label: "単独REG", color: "#5AB0FF" },
      { id: "judai_reg", label: "重複REG", color: "#3B8FE8" },
    ],
  },
  {
    id: "generic",
    name: "汎用機種",
    counters: [
      { id: "bell", label: "🔔ベル", color: "#F5C93B" },
      { id: "suika", label: "🍉スイカ", color: "#4CC764" },
      { id: "cherry", label: "🍒チェリー", color: "#E8493C" },
      { id: "chance", label: "チャンス目", color: "#A855F7" },
      { id: "weak", label: "弱レア役", color: "#E8446E" },
      { id: "strong", label: "強レア役", color: "#8B90A0" },
      { id: "at", label: "AT", color: "#5AB0FF" },
    ],
  },
];

/* ベイズ推定: 各設定の尤度から事後確率を算出（事前確率は一様） */
function estimateSetting(spec, games, big, reg, grape) {
  const G = num(games);
  if (G <= 0) return null;
  const useGrape = grape !== "" && num(grape) > 0;
  const logls = spec.big.map((_, i) => {
    let ll = 0;
    const add = (count, denom) => {
      const p = 1 / denom;
      const c = num(count);
      ll += c * Math.log(p) + (G - c) * Math.log(1 - p);
    };
    add(big, spec.big[i]);
    add(reg, spec.reg[i]);
    if (useGrape) add(grape, spec.grape[i]);
    return ll;
  });
  const mx = Math.max(...logls);
  const ws = logls.map((l) => Math.exp(l - mx));
  const sum = ws.reduce((a, b) => a + b, 0);
  const probs = ws.map((w) => w / sum);
  const expWari = probs.reduce((s, p, i) => s + p * spec.wari[i], 0);
  const best = probs.indexOf(Math.max(...probs));
  return { probs, expWari, best };
}

/* ---------- 画像圧縮（canvas・最大1200px・JPEG品質0.7） ---------- */
const MAX_PHOTOS = 3;
const compressImage = (file, maxSize = 1200, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });

/* ============================================================
   仕事量（期待値）計算ロジック - ボーダー理論ベース簡易版
   ・ボーダーは等価基準の公表値を入力
   ・1回転の獲得期待玉 = 250 ÷ ボーダー
   ・1回転の消費玉     = 250 ÷ 回転率
   ・消費単価 = 持玉比率×交換単価 + 現金比率×4円
   ・仕事量 = 回転数 ×（獲得玉×交換単価 − 消費玉×消費単価）
   ============================================================ */
function calcShigoto({ border, kaiten, spins, exchange, mochiRatio }) {
  const B = num(border);
  const R = num(kaiten);
  const N = num(spins);
  const ex = num(exchange) || 4;
  const mr = Math.min(100, Math.max(0, num(mochiRatio))) / 100;
  if (B <= 0 || R <= 0) return { evCash: 0, evMochi: 0, evBlend: 0, shigoto: 0 };
  const getTama = 250 / B;
  const useTama = 250 / R;
  const evCash = getTama * ex - useTama * 4;
  const evMochi = (getTama - useTama) * ex;
  const evBlend = mr * evMochi + (1 - mr) * evCash;
  return { evCash, evMochi, evBlend, shigoto: N * evBlend };
}

/* ============================================================
   スロット用 期待値（差枚）計算 - 設定ごとの機械割から算出
   ・差枚期待 = ゲーム数 × 3枚 ×（機械割 − 100%）
   ・shigoto  = 差枚期待 × 単価（円/枚）
   ============================================================ */
function calcSlotShigoto({ games, wari, unitYen }) {
  const G = num(games);
  const W = num(wari);
  const uy = num(unitYen) || 20;
  if (G <= 0 || W <= 0) return { diffMai: 0, shigoto: 0 };
  const diffMai = G * 3 * (W / 100 - 1);
  return { diffMai, shigoto: diffMai * uy };
}

/* ---------- 共通UIパーツ ---------- */
const Card = ({ children, style }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, ...style }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 11, color: C.sub, marginBottom: 4, letterSpacing: "0.06em" }}>{children}</div>
);

const inputStyle = {
  width: "100%",
  background: C.panel2,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  color: C.text,
  fontSize: 16,
  padding: "10px 12px",
  appearance: "none",
  WebkitAppearance: "none",
};

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, letterSpacing: "0.12em", margin: "18px 2px 8px" }}>
    {children}
  </div>
);

const primaryBtn = {
  background: `linear-gradient(180deg, ${C.gold}, #C99A2E)`,
  color: "#1a1400",
  border: "none",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 800,
  padding: "14px 0",
  cursor: "pointer",
  letterSpacing: "0.1em",
  width: "100%",
};

const smallDeleteBtn = {
  background: "none",
  border: `1px solid ${C.line}`,
  color: C.sub,
  fontSize: 10,
  borderRadius: 6,
  padding: "3px 8px",
  cursor: "pointer",
};

/* LED風数値表示（ホールのデータカウンター風） */
const Led = ({ value, size = 40, color }) => {
  const col = color || (value > 0 ? C.plus : value < 0 ? C.minus : C.text);
  return (
    <span
      style={{
        fontFamily: "'DotGothic16', monospace",
        fontSize: size,
        color: col,
        textShadow: `0 0 12px ${col}66, 0 0 28px ${col}33`,
        letterSpacing: "0.04em",
        animation: "ledIn 0.4s ease",
      }}
    >
      {signYen(value)}
    </span>
  );
};

/* ひらがな→カタカナ変換して正規化（機種名などのかな/カタカナ両対応検索用） */
const hiraToKata = (s) =>
  String(s || "").replace(/[\u3041-\u3096]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
const normKana = (s) => hiraToKata(s).toLowerCase();

/* 機種名など「かな/カタカナどちらで打っても検索できる」候補付き入力欄 */
const MachinePicker = ({ value, onChange, options, placeholder, style }) => {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const q = normKana(value);
    const uniq = [...new Set(options)];
    if (!q) return uniq.slice(0, 8);
    return uniq.filter((o) => normKana(o).includes(q)).slice(0, 8);
  }, [value, options]);
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{ ...style, width: "100%" }}
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: C.panel2,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            marginTop: 4,
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 25,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {filtered.map((o, i) => (
            <div
              key={o + i}
              onMouseDown={() => {
                onChange(o);
                setOpen(false);
              }}
              style={{
                padding: "10px 12px",
                fontSize: 13,
                cursor: "pointer",
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.line}` : "none",
                color: C.text,
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================ */
const MENU = [
  { id: "home", label: "ホーム", icon: "🏠" },
  { id: "input", label: "稼働入力", icon: "✏️" },
  { id: "history", label: "稼働履歴", icon: "📋" },
  { id: "ev", label: "期待値計算", icon: "📈" },
  { id: "koyaku", label: "小役カウント", icon: "🔢" },
  { id: "cash", label: "現金出納帳", icon: "💴" },
  { id: "tama", label: "貯玉出納帳", icon: "🎱" },
  { id: "settings", label: "設定", icon: "⚙️" },
];

/* ログイン情報の永続化（※このプレビュー画面はブラウザストレージがブロックされているため
   保持されないが、実際にVercel等へデプロイした環境では正しく永続化される） */
const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem("pachiUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveStoredUser = (u) => {
  try {
    if (u) localStorage.setItem("pachiUser", JSON.stringify(u));
    else localStorage.removeItem("pachiUser");
  } catch {
    /* このプレビュー環境ではストレージが使えないため何もしない */
  }
};

export default function App() {
  const [user, setUser] = useState(loadStoredUser);
  const loginUser = (u) => {
    setUser(u);
    saveStoredUser(u);
  };
  const logoutUser = () => {
    setUser(null);
    saveStoredUser(null);
  };
  /* window.confirm はプレビュー環境でブロックされ動作しないため、アプリ内蔵の確認モーダルを使う */
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onYes }
  const askConfirm = (message, onYes) => setConfirmDialog({ message, onYes });
  const [tab, setTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [players, setPlayers] = useState(DEMO_PLAYERS);
  const [shops, setShops] = useState(DEMO_SHOPS);
  const [machines, setMachines] = useState(DEMO_MACHINES);
  const [tags, setTags] = useState(DEMO_TAGS);
  const [records, setRecords] = useState(DEMO_RECORDS);
  const [cashEntries, setCashEntries] = useState(DEMO_CASH);
  const [koyaku, setKoyaku] = useState(INITIAL_KOYAKU);
  const [toast, setToast] = useState("");

  /* ---------- Upstash Redis連携（/api/data経由） ----------
     起動直後はlib/seedDataの値を仮表示 → サーバーから取得でき次第上書きする。
     hydratedRefがtrueになった後の変更だけを自動でサーバーに保存する（初回の取得直後の
     再保存＝無駄な書き込みを防ぐため） */
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d || d.error) return;
        if (d.players) setPlayers(d.players);
        if (d.shops) setShops(d.shops);
        if (d.machines) setMachines(d.machines);
        if (d.tags) setTags(d.tags);
        if (d.records) setRecords(d.records);
        if (d.cashEntries) setCashEntries(d.cashEntries);
        if (d.koyaku) setKoyaku(d.koyaku);
      })
      .catch((err) => {
        console.error("データの取得に失敗しました（Upstashの環境変数を確認してください）:", err);
      })
      .finally(() => {
        if (!cancelled) hydratedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (key, value) => {
    if (!hydratedRef.current) return; // 初回取得が終わるまでは保存しない
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).catch((err) => console.error(`${key}の保存に失敗しました:`, err));
  };

  useEffect(() => persist("players", players), [players]);
  useEffect(() => persist("shops", shops), [shops]);
  useEffect(() => persist("machines", machines), [machines]);
  useEffect(() => persist("tags", tags), [tags]);
  useEffect(() => persist("records", records), [records]);
  useEffect(() => persist("cashEntries", cashEntries), [cashEntries]);
  useEffect(() => persist("koyaku", koyaku), [koyaku]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const playerName = (id) => players.find((p) => p.id === id)?.name || "?";

  /* ---------- 集計 ---------- */
  const stats = useMemo(() => {
    const total = records.reduce((s, r) => s + (r.cashout - r.invest), 0);
    const ym = today().slice(0, 7);
    const month = records
      .filter((r) => r.date.startsWith(ym))
      .reduce((s, r) => s + (r.cashout - r.invest), 0);
    const wins = records.filter((r) => r.cashout - r.invest > 0).length;
    const winRate = records.length ? Math.round((wins / records.length) * 100) : 0;

    const manual = cashEntries.reduce((s, e) => s + (e.type === "in" ? e.amount : -e.amount), 0);
    const cashBalance = manual + total;

    const byPlayer = {};
    records.forEach((r) => {
      if (!byPlayer[r.playerId]) byPlayer[r.playerId] = { playerId: r.playerId, profit: 0, count: 0 };
      byPlayer[r.playerId].profit += r.cashout - r.invest;
      byPlayer[r.playerId].count++;
    });
    const perPlayer = Object.values(byPlayer).sort((a, b) => b.profit - a.profit);

    const byTama = {};
    records.forEach((r) => {
      const key = r.shop + "|" + r.rate;
      if (!byTama[key]) byTama[key] = { shop: r.shop, rate: r.rate, balance: 0 };
      byTama[key].balance += num(r.tamaGet) - num(r.tamaUse);
    });
    const tamaBalances = Object.values(byTama);

    return { total, month, count: records.length, winRate, cashBalance, perPlayer, tamaBalances };
  }, [records, cashEntries]);

  const totalShigoto = useMemo(
    () => Math.round(records.reduce((s, r) => s + num(r.shigoto), 0)),
    [records]
  );

  /* マスタ＋実績から候補リストを合成 */
  const shopNames = useMemo(
    () => [...new Set([...shops.map((s) => s.name), ...records.map((r) => r.shop)])],
    [shops, records]
  );
  const machineOptions = useMemo(() => {
    const fromRecords = [...new Set(records.map((r) => r.machine))]
      .filter((n) => !machines.some((m) => m.name === n))
      .map((n) => ({ id: "rec-" + n, name: n, kind: null, border: "" }));
    return [...machines, ...fromRecords];
  }, [machines, records]);

  /* ---------- 操作 ---------- */
  const addRecord = (rec) => {
    setRecords((prev) => [...prev, { ...rec, id: uid("r") }].sort((a, b) => a.date.localeCompare(b.date)));
    showToast("稼働記録を保存しました");
    setTab("history");
  };
  const deleteRecord = (id) => {
    askConfirm("この稼働記録を削除しますか？", () => {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast("削除しました");
    });
  };
  const addCash = (e) => {
    setCashEntries((prev) => [...prev, { ...e, id: uid("c") }].sort((a, b) => a.date.localeCompare(b.date)));
    showToast("出納帳に記帳しました");
  };
  const deleteCash = (id) => {
    askConfirm("この記帳を削除しますか？", () => {
      setCashEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("削除しました");
    });
  };

  const go = (id) => {
    setTab(id);
    setMenuOpen(false);
  };

  /* 設定(マスタ管理・打ち子登録)は管理者のみ表示 */
  const visibleMenu = MENU.filter((m) => m.id !== "settings" || user?.role === "admin");
  const currentLabel = visibleMenu.find((m) => m.id === tab)?.label || "";

  if (!user) {
    return <LoginScreen players={players} onLogin={loginUser} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily:
          "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif",
        paddingBottom: 40,
      }}
    >
      <style>{FONT_CSS}</style>

      {/* ヘッダー */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(14,15,22,0.92)",
          backdropFilter: "blur(10px)",
          padding: "12px 14px",
          borderBottom: `1px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.06em", color: C.gold }}>
            {APP_NAME}
          </div>
          <div style={{ fontSize: 10, color: C.sub }}>{currentLabel}・DEMO版</div>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="メニューを開く"
          style={{
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            color: C.gold,
            fontSize: 20,
            width: 44,
            height: 44,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ☰
        </button>
      </header>

      {/* ドロワーメニュー */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <nav
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 250,
              background: C.panel,
              borderLeft: `1px solid ${C.line}`,
              padding: "16px 12px calc(16px + env(safe-area-inset-bottom))",
              animation: "drawerIn 0.25s ease",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 6px 14px",
                borderBottom: `1px solid ${C.line}`,
                marginBottom: 8,
              }}
            >
              <b style={{ fontSize: 14, color: C.gold, letterSpacing: "0.08em" }}>メニュー</b>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="メニューを閉じる"
                style={{ background: "none", border: "none", color: C.sub, fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            {visibleMenu.map((m) => (
              <button
                key={m.id}
                onClick={() => go(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: tab === m.id ? C.gold + "1A" : "none",
                  border: "none",
                  borderRadius: 10,
                  color: tab === m.id ? C.gold : C.text,
                  fontSize: 15,
                  fontWeight: tab === m.id ? 700 : 500,
                  padding: "13px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
            <div style={{ marginTop: "auto" }}>
              <button
                onClick={() => {
                  askConfirm("ログアウトしますか？", () => {
                    setMenuOpen(false);
                    logoutUser();
                  });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  background: "none",
                  border: "none",
                  borderTop: `1px solid ${C.line}`,
                  color: C.sub,
                  fontSize: 14,
                  padding: "14px 12px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 16 }}>🚪</span>
                ログアウト
              </button>
              <div style={{ fontSize: 10, color: C.sub, padding: "4px 6px 0" }}>
                DEMO版・データは保存されません
              </div>
            </div>
          </nav>
        </div>
      )}

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "14px 14px 20px" }}>
        {tab === "home" && (
          <Home stats={stats} playerName={playerName} totalShigoto={totalShigoto} records={records} />
        )}
        {tab === "input" && (
          <InputForm
            players={players}
            shopNames={shopNames}
            machineOptions={machineOptions}
            tags={tags}
            onSave={addRecord}
            user={user}
          />
        )}
        {tab === "history" && <History records={records} playerName={playerName} onDelete={deleteRecord} />}
        {tab === "ev" && <Kitaichi machineOptions={machineOptions} />}
        {tab === "koyaku" && <KoyakuCounter data={koyaku} setData={setKoyaku} askConfirm={askConfirm} />}
        {tab === "cash" && (
          <CashBook records={records} cashEntries={cashEntries} onAdd={addCash} onDelete={deleteCash} />
        )}
        {tab === "tama" && <TamaBook records={records} />}
        {tab === "settings" && (
          <Settings
            players={players}
            setPlayers={setPlayers}
            shops={shops}
            setShops={setShops}
            machines={machines}
            setMachines={setMachines}
            tags={tags}
            setTags={setTags}
            records={records}
            showToast={showToast}
            askConfirm={askConfirm}
          />
        )}
      </main>

      {/* 確認モーダル（window.confirmの代替） */}
      {confirmDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: "22px 20px",
              width: "100%",
              maxWidth: 320,
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 18, textAlign: "center" }}>
              {confirmDialog.message}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex: 1,
                  background: C.panel2,
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  color: C.text,
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "12px 0",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  const fn = confirmDialog.onYes;
                  setConfirmDialog(null);
                  fn && fn();
                }}
                style={{
                  flex: 1,
                  background: C.minus,
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "12px 0",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トースト */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.gold,
            color: "#1a1400",
            fontSize: 13,
            fontWeight: 700,
            padding: "10px 18px",
            borderRadius: 999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            zIndex: 50,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   収支カレンダー
   ============================================================ */
function ProfitCalendar({ records, playerName }) {
  const [ym, setYm] = useState(today().slice(0, 7));
  const [selected, setSelected] = useState(today());

  const daily = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      map[r.date] = (map[r.date] || 0) + (r.cashout - r.invest);
    });
    return map;
  }, [records]);

  const [y, m] = ym.split("-").map(Number);
  const startDow = new Date(y, m - 1, 1).getDay();
  const daysIn = new Date(y, m, 0).getDate();

  const moveMonth = (d) => {
    const nd = new Date(y, m - 1 + d, 1);
    setYm(`${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`);
    setSelected(null);
  };

  const monthRecs = records.filter((r) => r.date.startsWith(ym));
  const monthProfit = monthRecs.reduce((s, r) => s + (r.cashout - r.invest), 0);
  const dayKeys = [...new Set(monthRecs.map((r) => r.date))];
  const winDays = dayKeys.filter((d) => daily[d] > 0).length;
  const loseDays = dayKeys.filter((d) => daily[d] < 0).length;

  const selectedRecs = selected ? records.filter((r) => r.date === selected) : [];

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  const dow = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <Card style={{ padding: "12px 10px" }}>
      {/* 月ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 8px" }}>
        <button
          onClick={() => moveMonth(-1)}
          aria-label="前の月"
          style={{ ...smallDeleteBtn, fontSize: 14, padding: "5px 12px" }}
        >
          ◀
        </button>
        <div style={{ textAlign: "center" }}>
          <b style={{ fontSize: 15, letterSpacing: "0.08em" }}>
            {y}年{m}月
          </b>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            <b style={{ color: monthProfit >= 0 ? C.plus : C.minus }}>{signYen(monthProfit)}</b>
            <span style={{ color: C.sub }}>
              　{winDays}勝{loseDays}敗
            </span>
          </div>
        </div>
        <button
          onClick={() => moveMonth(1)}
          aria-label="次の月"
          style={{ ...smallDeleteBtn, fontSize: 14, padding: "5px 12px" }}
        >
          ▶
        </button>
      </div>

      {/* 曜日 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {dow.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 10,
              color: i === 0 ? C.minus : i === 6 ? C.slot : C.sub,
              padding: "2px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日セル */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={"e" + i} />;
          const dateStr = `${ym}-${String(d).padStart(2, "0")}`;
          const p = daily[dateStr];
          const has = p !== undefined;
          const isSel = selected === dateStr;
          const isToday = dateStr === today();
          return (
            <button
              key={dateStr}
              onClick={() => setSelected(isSel ? null : dateStr)}
              style={{
                background: isSel ? C.gold + "26" : has ? C.panel2 : "transparent",
                border: `1px solid ${isSel ? C.gold : isToday ? C.sub : has ? C.line : "transparent"}`,
                borderRadius: 8,
                padding: "4px 0 3px",
                minHeight: 42,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 11, color: isToday ? C.gold : C.sub, fontWeight: isToday ? 800 : 500 }}>
                {d}
              </span>
              {has && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: p > 0 ? C.plus : p < 0 ? C.minus : C.sub,
                    lineHeight: 1.1,
                  }}
                >
                  {p === 0 ? "±0" : abbrev(p)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 選択日の詳細 */}
      {selected && selectedRecs.length > 0 && (
        <div style={{ marginTop: 10, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
          <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 6 }}>
            {fmtDate(selected)} の稼働（{selectedRecs.length}件・
            {signYen(selectedRecs.reduce((s, r) => s + r.cashout - r.invest, 0))}）
          </div>
          {selectedRecs.map((r) => {
            const p = r.cashout - r.invest;
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                  padding: "6px 4px",
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.machine}
                  </div>
                  <div style={{ fontSize: 10, color: C.sub }}>
                    {playerName(r.playerId)}・{r.shop}
                  </div>
                </div>
                <b style={{ color: p >= 0 ? C.plus : C.minus, marginLeft: 8 }}>{signYen(p)}</b>
              </div>
            );
          })}
        </div>
      )}
      {selected && selectedRecs.length === 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: C.sub, textAlign: "center" }}>
          {fmtDate(selected)} の稼働記録はありません
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   仕事量 vs 収支 累積グラフ
   ============================================================ */
const PERIODS = [
  { id: "all", label: "全期間", months: null },
  { id: "m1", label: "1ヶ月", months: 1 },
  { id: "m3", label: "3ヶ月", months: 3 },
  { id: "m6", label: "6ヶ月", months: 6 },
  { id: "y1", label: "1年", months: 12 },
];

const niceStep = (rough) => {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(rough, 1))));
  const r = rough / pow;
  const f = r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10;
  return f * pow;
};
const manLabel = (v) => {
  if (v === 0) return "0";
  const m = v / 10000;
  return (Math.abs(m) >= 1 ? (Number.isInteger(m) ? m : m.toFixed(1)) : m.toFixed(1)) + "万";
};

function ShigotoChart({ records }) {
  const [period, setPeriod] = useState("all");

  const { points, totalP, totalS } = useMemo(() => {
    const p = PERIODS.find((x) => x.id === period);
    let cutoff = null;
    if (p.months) {
      const d = new Date();
      d.setMonth(d.getMonth() - p.months);
      cutoff = d.toISOString().slice(0, 10);
    }
    const recs = records
      .filter((r) => !cutoff || r.date >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
    let cp = 0;
    let cs = 0;
    const pts = recs.map((r) => {
      cp += r.cashout - r.invest;
      cs += num(r.shigoto);
      return { date: r.date, p: cp, s: cs };
    });
    return { points: pts, totalP: cp, totalS: Math.round(cs) };
  }, [records, period]);

  /* 描画領域 */
  const W = 340;
  const H = 200;
  const padL = 8;
  const padR = 48;
  const padT = 12;
  const padB = 26;

  let chart = null;
  if (points.length > 0) {
    const all = [0, ...points.map((d) => d.p), ...points.map((d) => d.s)];
    const rawMin = Math.min(...all);
    const rawMax = Math.max(...all);
    const step = niceStep((rawMax - rawMin) / 4 || 10000);
    const tickMin = Math.floor(rawMin / step) * step;
    const tickMax = Math.ceil(rawMax / step) * step;
    const ticks = [];
    for (let t = tickMin; t <= tickMax + 1; t += step) ticks.push(t);

    const n = points.length;
    const x = (i) => padL + (n === 1 ? (W - padL - padR) / 2 : ((W - padL - padR) * i) / (n - 1));
    const y = (v) => padT + ((tickMax - v) / (tickMax - tickMin || 1)) * (H - padT - padB);

    /* 起点(0,0)を先頭に付ける */
    const withStart = [{ date: points[0].date, p: 0, s: 0 }, ...points];
    const xs = (i) =>
      padL + ((W - padL - padR) * i) / (withStart.length - 1);
    const lineP = withStart.map((d, i) => `${xs(i)},${y(d.p)}`).join(" ");
    const lineS = withStart.map((d, i) => `${xs(i)},${y(d.s)}`).join(" ");

    const xLabels = [];
    if (n >= 1) xLabels.push({ i: 0, t: fmtDate(points[0].date) });
    if (n >= 3) xLabels.push({ i: Math.floor((n - 1) / 2), t: fmtDate(points[Math.floor((n - 1) / 2)].date) });
    if (n >= 2) xLabels.push({ i: n - 1, t: fmtDate(points[n - 1].date) });

    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* グリッド線 + Y軸ラベル */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? C.sub : C.line}
              strokeWidth={t === 0 ? 1.2 : 1}
              strokeDasharray={t === 0 ? "" : "3 4"}
            />
            <text x={W - padR + 6} y={y(t) + 3.5} fontSize="10" fill={C.sub}>
              {manLabel(t)}
            </text>
          </g>
        ))}
        {/* 期待値（仕事量）線 */}
        <polyline points={lineS} fill="none" stroke={C.gold} strokeWidth="2" strokeLinejoin="round" />
        {/* 収支線 */}
        <polyline points={lineP} fill="none" stroke={C.slot} strokeWidth="2.4" strokeLinejoin="round" />
        {/* 最新点 */}
        <circle cx={xs(withStart.length - 1)} cy={y(points[n - 1].s)} r="3" fill={C.gold} />
        <circle cx={xs(withStart.length - 1)} cy={y(points[n - 1].p)} r="3.4" fill={C.slot} />
        {/* X軸ラベル */}
        {xLabels.map((l) => (
          <text
            key={l.i}
            x={xs(l.i + 1)}
            y={H - 8}
            fontSize="10"
            fill={C.sub}
            textAnchor={l.i === 0 ? "start" : l.i === points.length - 1 ? "end" : "middle"}
          >
            {l.t}
          </text>
        ))}
      </svg>
    );
  }

  return (
    <Card style={{ padding: "16px 14px 12px" }}>
      {/* ヘッダー: 収支総額 / 期待値総額 */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <Label>収支総額</Label>
          <div
            style={{
              fontFamily: "'DotGothic16', monospace",
              fontSize: 30,
              lineHeight: 1.1,
              color: totalP > 0 ? C.slot : totalP < 0 ? C.minus : C.text,
              textShadow: `0 0 14px ${totalP >= 0 ? C.slot : C.minus}44`,
            }}
          >
            {signYen(totalP)}
          </div>
        </div>
        <div style={{ textAlign: "right", borderLeft: `1px solid ${C.line}`, paddingLeft: 14 }}>
          <Label>期待値総額</Label>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.gold }}>{signYen(totalS)}</div>
          <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>
            乖離{" "}
            <b style={{ color: totalP - totalS >= 0 ? C.plus : C.minus }}>{signYen(totalP - totalS)}</b>
          </div>
        </div>
      </div>

      {/* グラフ */}
      <div style={{ marginTop: 10 }}>
        {chart || (
          <div style={{ fontSize: 12, color: C.sub, textAlign: "center", padding: "30px 0" }}>
            この期間の稼働記録がありません
          </div>
        )}
      </div>

      {/* 凡例 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, fontSize: 11, marginTop: 2 }}>
        <span style={{ color: C.slot }}>
          <span style={{ display: "inline-block", width: 18, height: 2.4, background: C.slot, verticalAlign: "middle", marginRight: 5, borderRadius: 2 }} />
          収支
        </span>
        <span style={{ color: C.gold }}>
          <span style={{ display: "inline-block", width: 18, height: 2.4, background: C.gold, verticalAlign: "middle", marginRight: 5, borderRadius: 2 }} />
          期待値
        </span>
      </div>

      {/* 期間フィルタ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 4,
          background: C.panel2,
          borderRadius: 10,
          padding: 4,
          marginTop: 10,
        }}
      >
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              background: period === p.id ? C.slot : "none",
              border: "none",
              borderRadius: 8,
              color: period === p.id ? "#08131f" : C.sub,
              fontSize: 12,
              fontWeight: period === p.id ? 800 : 500,
              padding: "8px 0",
              cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
   ホーム（ダッシュボード）
   ============================================================ */
function Home({ stats, playerName, totalShigoto, records }) {
  return (
    <div>
      {/* 収支 × 期待値グラフ */}
      <ShigotoChart records={records} />

      {/* ミニ統計 */}
      <div style={{ display: "flex", justifyContent: "center", gap: 22, margin: "10px 0 0", fontSize: 12, color: C.sub }}>
        <span>
          今月 <b style={{ color: stats.month >= 0 ? C.plus : C.minus }}>{signYen(stats.month)}</b>
        </span>
        <span>
          稼働 <b style={{ color: C.text }}>{stats.count}回</b>
        </span>
        <span>
          勝率 <b style={{ color: C.text }}>{stats.winRate}%</b>
        </span>
      </div>

      {/* カレンダー */}
      <SectionTitle>収支カレンダー</SectionTitle>
      <ProfitCalendar records={records} playerName={playerName} />

      {/* 残高 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <Card>
          <Label>現金残高（出納帳）</Label>
          <div style={{ fontSize: 20, fontWeight: 800, color: stats.cashBalance >= 0 ? C.text : C.minus }}>
            {yen(stats.cashBalance)}
          </div>
        </Card>
        <Card>
          <Label>貯玉・貯メダル</Label>
          {stats.tamaBalances.filter((t) => t.balance > 0).length === 0 ? (
            <div style={{ fontSize: 13, color: C.sub }}>残高なし</div>
          ) : (
            stats.tamaBalances
              .filter((t) => t.balance > 0)
              .map((t) => (
                <div key={t.shop + t.rate} style={{ fontSize: 12, marginBottom: 2 }}>
                  <span style={{ color: C.sub }}>{t.shop} </span>
                  <b>
                    {t.balance.toLocaleString()}
                    {rateLabel(t.rate).unit}
                  </b>
                </div>
              ))
          )}
        </Card>
      </div>

      {/* 打ち子別 */}
      <SectionTitle>打ち子別 収支</SectionTitle>
      <Card style={{ padding: 0 }}>
        {stats.perPlayer.map((p, i) => (
          <div
            key={p.playerId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderBottom: i < stats.perPlayer.length - 1 ? `1px solid ${C.line}` : "none",
            }}
          >
            <div>
              <b>{playerName(p.playerId)}</b>
              <span style={{ fontSize: 11, color: C.sub, marginLeft: 8 }}>{p.count}回</span>
            </div>
            <b style={{ color: p.profit >= 0 ? C.plus : C.minus }}>{signYen(p.profit)}</b>
          </div>
        ))}
        {stats.perPlayer.length === 0 && (
          <div style={{ padding: 14, fontSize: 13, color: C.sub }}>稼働記録を入力すると表示されます</div>
        )}
      </Card>
    </div>
  );
}

/* ============================================================
   稼働入力（行リスト形式・右下の✓で保存）
   ============================================================ */
const rowIcon = { width: 26, textAlign: "center", fontSize: 17, flexShrink: 0, opacity: 0.85 };
const bareInput = {
  flex: 1,
  minWidth: 0,
  background: "transparent",
  border: "none",
  color: C.text,
  fontSize: 16,
  padding: "14px 0",
};
const bareSelect = { ...bareInput, appearance: "none", WebkitAppearance: "none" };
const rowStyle2 = (last) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 14px",
  borderBottom: last ? "none" : `1px solid ${C.line}`,
});

const calcDuration = (s, e) => {
  if (!s || !e) return null;
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  let min = eh * 60 + em - (sh * 60 + sm);
  if (min < 0) min += 24 * 60;
  if (min === 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return (h > 0 ? `${h}時間 ` : "") + `${m}分`;
};

function InputForm({ players, shopNames, machineOptions, tags, onSave, user }) {
  const lockedPlayerId = user?.role === "player" ? user.playerId : null;
  const [form, setForm] = useState({
    date: today(),
    startTime: "",
    endTime: "",
    playerId: lockedPlayerId || players[0]?.id || "",
    shop: "",
    machine: "",
    kind: "pachinko",
    rate: "p4",
    invest: "",
    cashout: "",
    shigoto: "",
    tamaUse: "",
    tamaGet: "",
    tags: [],
    photos: [],
    memo: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addPhotos = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const remain = MAX_PHOTOS - form.photos.length;
    if (remain <= 0) return;
    try {
      const compressed = await Promise.all(files.slice(0, remain).map((f) => compressImage(f)));
      setForm((f) => ({ ...f, photos: [...f.photos, ...compressed].slice(0, MAX_PHOTOS) }));
    } catch (e) {
      alert("写真の取り込みに失敗しました");
    }
  };
  const removePhoto = (i) => setForm((f) => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }));
  const setKind = (kind) => setForm((f) => ({ ...f, kind, rate: kind === "pachinko" ? "p4" : "s20" }));
  const toggleTag = (name) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(name) ? f.tags.filter((t) => t !== name) : [...f.tags, name],
    }));

  /* 機種マスタに一致したら種別を自動セット */
  const onMachineChange = (v) => {
    const hit = machineOptions.find((m) => m.name === v && m.kind);
    setForm((f) => ({
      ...f,
      machine: v,
      ...(hit ? { kind: hit.kind, rate: hit.kind === "pachinko" ? "p4" : "s20" } : {}),
    }));
  };

  const profit = num(form.cashout) - num(form.invest);
  const unit = rateLabel(form.rate).unit;
  const duration = calcDuration(form.startTime, form.endTime);

  /* --- 仕事量 自動計算（機種マスタのスペックから） --- */
  const [auto, setAuto] = useState({ setting: "1", games: "", kaiten: "", spins: "" });
  const setA = (k, v) => setAuto((a) => ({ ...a, [k]: v }));
  const specMachine = machineOptions.find(
    (m) =>
      m.name === form.machine &&
      ((m.kind === "slot" && m.waris && m.waris.some((w) => num(w) > 0)) ||
        (m.kind === "pachinko" && num(m.oneRProb) > 0 && num(m.oneRDedama) > 0))
  );
  let autoVal = null;
  if (specMachine) {
    const unitYen = RATE_VALUE[form.rate] || 4;
    if (specMachine.kind === "slot") {
      const wari = Number(specMachine.waris[num(auto.setting) - 1]) || 0;
      if (wari > 0 && num(auto.games) > 0) {
        /* 差枚期待 = G数 × 3枚 × (機械割 − 100%) */
        autoVal = num(auto.games) * 3 * (wari / 100 - 1) * unitYen;
      }
    } else {
      const R = num(auto.kaiten);
      if (R > 0 && num(auto.spins) > 0) {
        /* 1回転の期待増減玉 = 1R出玉 ÷ 1Rトータル確率 + サポ増減 − 250 ÷ 回転率 */
        const getTama = num(specMachine.oneRDedama) / num(specMachine.oneRProb) + (Number(specMachine.sapo) || 0);
        autoVal = num(auto.spins) * (getTama - 250 / R) * unitYen;
      }
    }
  }
  const applyAuto = () => {
    if (autoVal === null) return;
    set("shigoto", String(Math.round(autoVal)));
  };

  const save = () => {
    if (!form.shop.trim() || !form.machine.trim()) {
      alert("店舗名と機種名を入力してください");
      return;
    }
    onSave({
      ...form,
      shop: form.shop.trim(),
      machine: form.machine.trim(),
      invest: num(form.invest),
      cashout: num(form.cashout),
      shigoto: num(form.shigoto),
      tamaUse: num(form.tamaUse),
      tamaGet: num(form.tamaGet),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 90 }}>
      <SectionTitle>稼働結果を入力</SectionTitle>

      {/* 日時・打ち子 */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={rowStyle2(false)}>
          <span style={rowIcon}>📅</span>
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={bareInput} />
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            style={{ ...bareInput, flex: "none", width: 78, color: form.startTime ? C.text : C.sub }}
          />
          <span style={{ color: C.sub }}>〜</span>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => set("endTime", e.target.value)}
            style={{ ...bareInput, flex: "none", width: 78, color: form.endTime ? C.text : C.sub }}
          />
        </div>
        <div style={rowStyle2(false)}>
          <span style={rowIcon}>⏱</span>
          <span style={{ ...bareInput, color: duration ? C.text : C.sub, fontSize: 14 }}>
            {duration ? `${duration}（稼働時間）` : "稼働時間（開始〜終了から自動計算）"}
          </span>
        </div>
        <div style={rowStyle2(true)}>
          <span style={rowIcon}>👤</span>
          {lockedPlayerId ? (
            <span style={{ ...bareInput, color: C.text }}>
              {players.find((p) => p.id === lockedPlayerId)?.name || "?"}
              <span style={{ fontSize: 10, color: C.sub, marginLeft: 8 }}>（ログイン中）</span>
            </span>
          ) : (
            <select value={form.playerId} onChange={(e) => set("playerId", e.target.value)} style={bareSelect}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </Card>

      {/* 金額 */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={rowStyle2(false)}>
          <span style={{ ...rowIcon, color: C.minus, opacity: 1 }}>📤</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.invest}
            onChange={(e) => set("invest", e.target.value)}
            placeholder="投資額"
            style={bareInput}
          />
          <span style={{ width: 1, alignSelf: "stretch", background: C.line }} />
          <span style={{ ...rowIcon, color: C.slot, opacity: 1 }}>📥</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.cashout}
            onChange={(e) => set("cashout", e.target.value)}
            placeholder="回収金額"
            style={bareInput}
          />
        </div>
        <div style={rowStyle2(false)}>
          <span style={{ ...rowIcon, color: C.gold, opacity: 1 }}>￥</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.shigoto}
            onChange={(e) => set("shigoto", e.target.value)}
            placeholder="期待値・仕事量（整数）"
            style={bareInput}
          />
          <span style={{ fontSize: 10, color: C.sub, whiteSpace: "nowrap" }}>期待値計算で算出</span>
        </div>
        <div style={rowStyle2(true)}>
          <span style={rowIcon}>💰</span>
          <span style={{ ...bareInput, fontSize: 14, color: C.sub }}>この稼働の収支</span>
          <b style={{ fontSize: 16, color: profit > 0 ? C.plus : profit < 0 ? C.minus : C.text }}>
            {signYen(profit)}
          </b>
        </div>
      </Card>

      {/* 種類・店舗・機種 */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={rowStyle2(false)}>
          <span style={rowIcon}>🎯</span>
          <select value={form.kind} onChange={(e) => setKind(e.target.value)} style={bareSelect}>
            <option value="pachinko">パチンコ</option>
            <option value="slot">スロット</option>
          </select>
          <select
            value={form.rate}
            onChange={(e) => set("rate", e.target.value)}
            style={{ ...bareSelect, flex: "none", width: 82, textAlign: "right", color: C.sub }}
          >
            {RATES[form.kind].map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div style={rowStyle2(false)}>
          <span style={rowIcon}>🏢</span>
          <input
            value={form.shop}
            onChange={(e) => set("shop", e.target.value)}
            placeholder="店舗"
            list="shop-list"
            style={bareInput}
          />
          <span style={{ color: C.sub }}>›</span>
          <datalist id="shop-list">
            {shopNames.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div style={rowStyle2(true)}>
          <span style={rowIcon}>🎰</span>
          <MachinePicker
            value={form.machine}
            onChange={onMachineChange}
            options={machineOptions.map((m) => m.name)}
            placeholder="機種（かな・カタカナどちらでも検索可）"
            style={bareInput}
          />
        </div>
      </Card>

      {/* 仕事量 自動計算（機種マスタにスペックがある場合のみ表示） */}
      {specMachine && (
        <Card style={{ border: `1px solid ${C.gold}55`, background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})` }}>
          <Label>⚡ 仕事量 自動計算（{specMachine.kind === "slot" ? "設定別機械割" : "1Rトータル確率"}）</Label>
          {specMachine.kind === "slot" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
              <div>
                <Label>推定設定</Label>
                <select value={auto.setting} onChange={(e) => setA("setting", e.target.value)} style={inputStyle}>
                  {specMachine.waris.map((w, i) =>
                    num(w) > 0 ? (
                      <option key={i} value={i + 1}>
                        設定{i + 1}（{w}%）
                      </option>
                    ) : null
                  )}
                </select>
              </div>
              <div>
                <Label>総ゲーム数</Label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={auto.games}
                  onChange={(e) => setA("games", e.target.value)}
                  placeholder="例）5000"
                  style={inputStyle}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
              <div>
                <Label>実測回転率（回/千円）</Label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={auto.kaiten}
                  onChange={(e) => setA("kaiten", e.target.value)}
                  placeholder="例）19.5"
                  style={inputStyle}
                />
              </div>
              <div>
                <Label>通常回転数（回）</Label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={auto.spins}
                  onChange={(e) => setA("spins", e.target.value)}
                  placeholder="例）3000"
                  style={inputStyle}
                />
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <div>
              <Label>算出仕事量</Label>
              <b
                style={{
                  fontFamily: "'DotGothic16', monospace",
                  fontSize: 22,
                  color: autoVal === null ? C.sub : autoVal >= 0 ? C.gold : C.minus,
                }}
              >
                {autoVal === null ? "—" : signYen(Math.round(autoVal))}
              </b>
            </div>
            <button
              onClick={applyAuto}
              disabled={autoVal === null}
              style={{
                background: autoVal === null ? C.panel2 : C.gold,
                color: autoVal === null ? C.sub : "#1a1400",
                border: "none",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 13,
                padding: "10px 16px",
                cursor: autoVal === null ? "default" : "pointer",
              }}
            >
              仕事量欄へ反映
            </button>
          </div>
        </Card>
      )}

      {/* 貯玉 */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={rowStyle2(true)}>
          <span style={rowIcon}>🎱</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.tamaUse}
            onChange={(e) => set("tamaUse", e.target.value)}
            placeholder={`貯玉使用（${unit}）`}
            style={bareInput}
          />
          <span style={{ width: 1, alignSelf: "stretch", background: C.line }} />
          <input
            type="number"
            inputMode="numeric"
            value={form.tamaGet}
            onChange={(e) => set("tamaGet", e.target.value)}
            placeholder={`貯玉獲得（${unit}）`}
            style={{ ...bareInput, paddingLeft: 10 }}
          />
        </div>
      </Card>

      {/* タグ */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ ...rowStyle2(true), flexWrap: "wrap", padding: "12px 14px", gap: 8 }}>
          <span style={rowIcon}>🏷️</span>
          {tags.length === 0 && <span style={{ fontSize: 13, color: C.sub }}>タグは設定から追加できます</span>}
          {tags.map((t) => {
            const on = form.tags.includes(t.name);
            return (
              <button
                key={t.id}
                onClick={() => toggleTag(t.name)}
                style={{
                  background: on ? C.gold + "26" : C.panel2,
                  border: `1px solid ${on ? C.gold : C.line}`,
                  borderRadius: 999,
                  color: on ? C.gold : C.sub,
                  fontSize: 12,
                  fontWeight: on ? 700 : 500,
                  padding: "7px 14px",
                  cursor: "pointer",
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 写真（最大3枚） */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ ...rowStyle2(true), padding: "12px 14px", alignItems: "flex-start" }}>
          <span style={{ ...rowIcon, marginTop: 20 }}>📷</span>
          <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {form.photos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={p}
                  alt={`添付写真${i + 1}`}
                  style={{ width: 66, height: 66, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.line}`, display: "block" }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  aria-label="写真を削除"
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: C.minus,
                    color: "#fff",
                    border: "none",
                    fontSize: 11,
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {form.photos.length < MAX_PHOTOS && (
              <label
                style={{
                  width: 66,
                  height: 66,
                  border: `1.5px dashed ${C.sub}`,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.sub,
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ＋
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    addPhotos(e.target.files);
                    e.target.value = "";
                  }}
                  style={{ display: "none" }}
                />
              </label>
            )}
            <span style={{ fontSize: 10, color: C.sub, width: "100%" }}>
              台データや釘の写真など（{form.photos.length}/{MAX_PHOTOS}枚）
            </span>
          </div>
        </div>
      </Card>

      {/* メモ */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={rowStyle2(true)}>
          <span style={rowIcon}>📝</span>
          <input
            value={form.memo}
            onChange={(e) => set("memo", e.target.value)}
            placeholder="メモを入力する"
            style={bareInput}
          />
        </div>
      </Card>

      {/* 保存（フローティング✓） */}
      <button
        onClick={save}
        aria-label="保存する"
        style={{
          position: "fixed",
          right: 18,
          bottom: 26,
          width: 62,
          height: 62,
          borderRadius: "50%",
          background: `linear-gradient(180deg, ${C.gold}, #C99A2E)`,
          color: "#1a1400",
          border: "none",
          fontSize: 28,
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(0,0,0,0.55)",
          zIndex: 35,
        }}
      >
        ✓
      </button>
    </div>
  );
}

/* ============================================================
   稼働履歴
   ============================================================ */
function History({ records, playerName, onDelete }) {
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  const [viewer, setViewer] = useState(null); // 拡大表示中の写真dataURL
  return (
    <div>
      <SectionTitle>稼働履歴（{records.length}件）</SectionTitle>
      {sorted.length === 0 && (
        <Card>
          <div style={{ fontSize: 13, color: C.sub }}>まだ稼働記録がありません。稼働入力から登録できます。</div>
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((r) => {
          const profit = r.cashout - r.invest;
          const kindColor = r.kind === "pachinko" ? C.pachi : C.slot;
          const unit = rateLabel(r.rate).unit;
          return (
            <Card key={r.id} style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.sub }}>
                    {fmtDate(r.date)}
                    {r.startTime && r.endTime ? ` ${r.startTime}〜${r.endTime}` : ""}・{playerName(r.playerId)}・{r.shop}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, margin: "3px 0" }}>{r.machine}</div>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: kindColor }}>
                      {r.kind === "pachinko" ? "パチンコ" : "スロット"} {rateLabel(r.rate).label}
                    </span>
                    <span style={{ color: C.sub }}>
                      　投資{yen(r.invest)} / 換金{yen(r.cashout)}
                    </span>
                  </div>
                  {num(r.shigoto) !== 0 && (
                    <div style={{ fontSize: 11, color: C.gold, marginTop: 2 }}>
                      仕事量 {signYen(num(r.shigoto))}
                    </div>
                  )}
                  {r.tags && r.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 10,
                            color: C.sub,
                            border: `1px solid ${C.line}`,
                            borderRadius: 999,
                            padding: "1px 8px",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.photos && r.photos.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      {r.photos.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          alt={`写真${i + 1}`}
                          onClick={() => setViewer(p)}
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: `1px solid ${C.line}`,
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {(r.tamaUse > 0 || r.tamaGet > 0) && (
                    <div style={{ fontSize: 11, color: C.gold, marginTop: 2 }}>
                      貯玉 {r.tamaUse > 0 ? `使用${r.tamaUse.toLocaleString()}${unit} ` : ""}
                      {r.tamaGet > 0 ? `獲得${r.tamaGet.toLocaleString()}${unit}` : ""}
                    </div>
                  )}
                  {r.memo && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>📝 {r.memo}</div>}
                </div>
                <div style={{ textAlign: "right", marginLeft: 10 }}>
                  <b style={{ fontSize: 16, color: profit >= 0 ? C.plus : C.minus }}>{signYen(profit)}</b>
                  <div>
                    <button onClick={() => onDelete(r.id)} style={{ ...smallDeleteBtn, marginTop: 6 }}>
                      削除
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 写真拡大表示 */}
      {viewer && (
        <div
          onClick={() => setViewer(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "fadeIn 0.15s ease",
          }}
        >
          <img
            src={viewer}
            alt="拡大写真"
            style={{ maxWidth: "100%", maxHeight: "88vh", borderRadius: 12 }}
          />
          <button
            onClick={() => setViewer(null)}
            aria-label="閉じる"
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: C.panel,
              border: `1px solid ${C.line}`,
              color: C.text,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   期待値（仕事量）計算タブ
   ============================================================ */
function Kitaichi({ machineOptions }) {
  const [kind, setKind] = useState("pachinko"); // pachinko | slot

  /* --- パチンコ用（ボーダー理論・電卓） --- */
  const [pForm, setPForm] = useState({
    border: "",
    kaiten: "",
    spins: "",
    exchange: 4.0,
    mochiRatio: 50,
  });
  const setP = (k, v) => setPForm((f) => ({ ...f, [k]: v }));
  const pRes = calcShigoto(pForm);
  const pValid = num(pForm.border) > 0 && num(pForm.kaiten) > 0;

  /* --- スロット用（機種→設定→ゲーム数・電卓） --- */
  const slotMachines = machineOptions.filter((m) => m.kind === "slot");
  const [sForm, setSForm] = useState({
    machine: "",
    rate: "s20",
    setting: "1",
    games: "",
  });
  const setS = (k, v) => setSForm((f) => ({ ...f, [k]: v }));
  const sSpecMachine = slotMachines.find(
    (m) => m.name === sForm.machine && m.waris && m.waris.some((w) => num(w) > 0)
  );
  const sWari = sSpecMachine ? Number(sSpecMachine.waris[num(sForm.setting) - 1]) || 0 : 0;
  const sRes = calcSlotShigoto({ games: sForm.games, wari: sWari, unitYen: RATE_VALUE[sForm.rate] });
  const sValid = !!sSpecMachine && sWari > 0 && num(sForm.games) > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionTitle>仕事量（期待値）計算</SectionTitle>
      <div style={{ fontSize: 11, color: C.sub, margin: "-6px 2px 0" }}>
        数値を入れると仕事量を即計算します。記録の蓄積は「稼働入力」から行ってください
      </div>

      {/* パチンコ / スロット 切り替え */}
      <div style={{ display: "flex", background: C.panel, borderRadius: 999, padding: 4 }}>
        {[
          { id: "pachinko", label: "パチンコ" },
          { id: "slot", label: "スロット" },
        ].map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 999,
              border: "none",
              background: kind === k.id ? (k.id === "pachinko" ? C.pachi : C.slot) : "transparent",
              color: kind === k.id ? "#0a0a0a" : C.sub,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {k.label}
          </button>
        ))}
      </div>

      {kind === "pachinko" ? (
        <>
          <div style={{ fontSize: 11, color: C.sub, margin: "-2px 2px 0" }}>
            ボーダーは等価基準の公表値を入力してください（簡易版・ボーダー理論）
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <Label>ボーダー（回/千円・等価）</Label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={pForm.border}
                onChange={(e) => setP("border", e.target.value)}
                placeholder="例）17.5"
                style={inputStyle}
              />
            </div>
            <div>
              <Label>実測回転率（回/千円）</Label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={pForm.kaiten}
                onChange={(e) => setP("kaiten", e.target.value)}
                placeholder="例）19.5"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <Label>通常回転数（回）</Label>
              <input
                type="number"
                inputMode="numeric"
                value={pForm.spins}
                onChange={(e) => setP("spins", e.target.value)}
                placeholder="例）3000"
                style={inputStyle}
              />
            </div>
            <div>
              <Label>交換率</Label>
              <select value={pForm.exchange} onChange={(e) => setP("exchange", e.target.value)} style={inputStyle}>
                {EXCHANGE_RATES.map((r) => (
                  <option key={r.v} value={r.v}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>持玉比率 {pForm.mochiRatio}%（持ち玉・貯玉で回した割合）</Label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={pForm.mochiRatio}
              onChange={(e) => setP("mochiRatio", e.target.value)}
              style={{ width: "100%", accentColor: C.gold }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.sub }}>
              <span>全て現金投資</span>
              <span>全て持ち玉</span>
            </div>
          </div>

          <Card style={{ textAlign: "center", background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})` }}>
            <Label>仕事量（この稼働で積んだ期待値）</Label>
            <Led value={Math.round(pRes.shigoto)} size={34} />
            {pValid && (
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, fontSize: 11, color: C.sub }}>
                <span>
                  現金 <b style={{ color: pRes.evCash >= 0 ? C.plus : C.minus }}>{pRes.evCash.toFixed(1)}円/回</b>
                </span>
                <span>
                  持玉 <b style={{ color: pRes.evMochi >= 0 ? C.plus : C.minus }}>{pRes.evMochi.toFixed(1)}円/回</b>
                </span>
                <span>
                  実効 <b style={{ color: pRes.evBlend >= 0 ? C.plus : C.minus }}>{pRes.evBlend.toFixed(1)}円/回</b>
                </span>
              </div>
            )}
          </Card>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, color: C.sub, margin: "-2px 2px 0" }}>
            機種を選び、設定とゲーム数を入れると設定別の機械割から差枚期待・仕事量を算出します
          </div>

          <div>
            <Label>レート</Label>
            <select value={sForm.rate} onChange={(e) => setS("rate", e.target.value)} style={inputStyle}>
              {RATES.slot.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>機種名（かな・カタカナどちらでも検索可）</Label>
            <MachinePicker
              value={sForm.machine}
              onChange={(v) => setS("machine", v)}
              options={slotMachines.map((m) => m.name)}
              placeholder="例）マイジャグラーV"
              style={inputStyle}
            />
            {sForm.machine.trim() && !sSpecMachine && (
              <div style={{ fontSize: 11, color: C.minus, marginTop: 6 }}>
                この機種はスペック（設定別機械割）が未登録です。設定タブの機種マスタで登録してください
              </div>
            )}
          </div>

          {sSpecMachine && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <Label>設定</Label>
                <select value={sForm.setting} onChange={(e) => setS("setting", e.target.value)} style={inputStyle}>
                  {sSpecMachine.waris.map((w, i) =>
                    num(w) > 0 ? (
                      <option key={i} value={i + 1}>
                        設定{i + 1}（{w}%）
                      </option>
                    ) : null
                  )}
                </select>
              </div>
              <div>
                <Label>ゲーム数</Label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={sForm.games}
                  onChange={(e) => setS("games", e.target.value)}
                  placeholder="例）5000"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <Card style={{ textAlign: "center", background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})` }}>
            <Label>仕事量（差枚期待から算出）</Label>
            <Led value={Math.round(sRes.shigoto)} size={34} />
            {sValid && (
              <div style={{ fontSize: 11, color: C.sub, marginTop: 10 }}>
                差枚期待 <b style={{ color: sRes.diffMai >= 0 ? C.plus : C.minus }}>{Math.round(sRes.diffMai).toLocaleString()}枚</b>
                　設定{sForm.setting}（{sWari}%）
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/* ============================================================
   現金出納帳
   ============================================================ */
function CashBook({ records, cashEntries, onAdd, onDelete }) {
  const [form, setForm] = useState({ date: today(), type: "in", category: "出資金", amount: "", memo: "" });
  const set = (k, v) =>
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "type") next.category = CASH_CATEGORIES[v][0];
      return next;
    });

  const rows = useMemo(() => {
    const auto = [];
    records.forEach((r) => {
      if (r.invest > 0)
        auto.push({ id: r.id + "-out", date: r.date, category: "稼働投資", memo: `${r.shop} ${r.machine}`, out: r.invest, in: 0, auto: true });
      if (r.cashout > 0)
        auto.push({ id: r.id + "-in", date: r.date, category: "換金", memo: `${r.shop} ${r.machine}`, out: 0, in: r.cashout, auto: true });
    });
    const manual = cashEntries.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      memo: e.memo,
      in: e.type === "in" ? e.amount : 0,
      out: e.type === "out" ? e.amount : 0,
      auto: false,
    }));
    const all = [...auto, ...manual].sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    return all.map((r) => {
      bal += r.in - r.out;
      return { ...r, balance: bal };
    });
  }, [records, cashEntries]);

  const balance = rows.length ? rows[rows.length - 1].balance : 0;

  const save = () => {
    if (!num(form.amount)) {
      alert("金額を入力してください");
      return;
    }
    onAdd({ ...form, amount: num(form.amount) });
    setForm({ date: today(), type: "in", category: "出資金", amount: "", memo: "" });
  };

  return (
    <div>
      <SectionTitle>現金出納帳</SectionTitle>
      <Card style={{ textAlign: "center" }}>
        <Label>現在残高</Label>
        <Led value={balance} size={30} color={balance >= 0 ? C.text : C.minus} />
      </Card>

      <Card style={{ marginTop: 10 }}>
        <Label>記帳する（出資金・分配・経費など）</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inputStyle} />
          <select value={form.type} onChange={(e) => set("type", e.target.value)} style={inputStyle}>
            <option value="in">入金</option>
            <option value="out">出金</option>
          </select>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} style={inputStyle}>
            {CASH_CATEGORIES[form.type].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            placeholder="金額"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            style={inputStyle}
          />
        </div>
        <input
          placeholder="摘要（メモ）"
          value={form.memo}
          onChange={(e) => set("memo", e.target.value)}
          style={{ ...inputStyle, marginTop: 8 }}
        />
        <button
          onClick={save}
          style={{ ...primaryBtn, marginTop: 10, fontSize: 14, padding: "11px 0", borderRadius: 10 }}
        >
          記帳する
        </button>
      </Card>

      <SectionTitle>帳簿（稼働分は自動連動）</SectionTitle>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px 1fr 70px 70px 76px",
            fontSize: 10,
            color: C.sub,
            padding: "8px 10px",
            borderBottom: `1px solid ${C.line}`,
            letterSpacing: "0.05em",
          }}
        >
          <span>日付</span>
          <span>摘要</span>
          <span style={{ textAlign: "right" }}>入金</span>
          <span style={{ textAlign: "right" }}>出金</span>
          <span style={{ textAlign: "right" }}>残高</span>
        </div>
        {[...rows].reverse().map((r) => (
          <div
            key={r.id}
            style={{
              display: "grid",
              gridTemplateColumns: "44px 1fr 70px 70px 76px",
              fontSize: 11,
              padding: "9px 10px",
              borderBottom: `1px solid ${C.line}`,
              alignItems: "center",
            }}
          >
            <span style={{ color: C.sub }}>{fmtDate(r.date)}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ color: r.auto ? C.sub : C.gold, fontSize: 10 }}>{r.category}</span>
              <span
                style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: C.text }}
              >
                {r.memo || "—"}
              </span>
              {!r.auto && (
                <button
                  onClick={() => onDelete(r.id)}
                  style={{ background: "none", border: "none", color: C.minus, fontSize: 9, padding: 0, cursor: "pointer" }}
                >
                  削除
                </button>
              )}
            </span>
            <span style={{ textAlign: "right", color: r.in ? C.plus : C.line }}>
              {r.in ? r.in.toLocaleString() : "—"}
            </span>
            <span style={{ textAlign: "right", color: r.out ? C.minus : C.line }}>
              {r.out ? r.out.toLocaleString() : "—"}
            </span>
            <span style={{ textAlign: "right", fontWeight: 700, color: r.balance >= 0 ? C.text : C.minus }}>
              {r.balance.toLocaleString()}
            </span>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding: 14, fontSize: 13, color: C.sub }}>記帳がありません</div>}
      </Card>
    </div>
  );
}

/* ============================================================
   貯玉出納帳（店舗×レート別・稼働記録から自動集計）
   ============================================================ */
function TamaBook({ records }) {
  const groups = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (!num(r.tamaUse) && !num(r.tamaGet)) return;
      const key = r.shop + "|" + r.rate;
      if (!map[key]) map[key] = { shop: r.shop, rate: r.rate, rows: [] };
      map[key].rows.push(r);
    });
    return Object.values(map).map((g) => {
      const rows = [...g.rows].sort((a, b) => a.date.localeCompare(b.date));
      let bal = 0;
      const withBal = rows.map((r) => {
        bal += num(r.tamaGet) - num(r.tamaUse);
        return { ...r, balance: bal };
      });
      return { ...g, rows: withBal, balance: bal };
    });
  }, [records]);

  return (
    <div>
      <SectionTitle>貯玉・貯メダル出納帳</SectionTitle>
      <div style={{ fontSize: 11, color: C.sub, margin: "0 2px 10px" }}>
        稼働入力の「貯玉使用／獲得」から店舗・レート別に自動集計されます
      </div>
      {groups.length === 0 && (
        <Card>
          <div style={{ fontSize: 13, color: C.sub }}>貯玉の記録がまだありません</div>
        </Card>
      )}
      {groups.map((g) => {
        const r0 = rateLabel(g.rate);
        return (
          <Card key={g.shop + g.rate} style={{ padding: 0, marginBottom: 12, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                borderBottom: `1px solid ${C.line}`,
                background: C.panel2,
              }}
            >
              <div>
                <b style={{ fontSize: 14 }}>{g.shop}</b>
                <span style={{ fontSize: 11, color: C.gold, marginLeft: 8 }}>{r0.label}</span>
              </div>
              <b style={{ fontFamily: "'DotGothic16', monospace", fontSize: 18, color: g.balance > 0 ? C.gold : C.sub }}>
                {g.balance.toLocaleString()}
                <span style={{ fontSize: 11 }}>{r0.unit}</span>
              </b>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr 64px 64px 72px",
                fontSize: 10,
                color: C.sub,
                padding: "7px 12px",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <span>日付</span>
              <span>機種</span>
              <span style={{ textAlign: "right" }}>獲得</span>
              <span style={{ textAlign: "right" }}>使用</span>
              <span style={{ textAlign: "right" }}>残高</span>
            </div>
            {[...g.rows].reverse().map((r) => (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 64px 64px 72px",
                  fontSize: 11,
                  padding: "8px 12px",
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <span style={{ color: C.sub }}>{fmtDate(r.date)}</span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.machine}</span>
                <span style={{ textAlign: "right", color: r.tamaGet ? C.plus : C.line }}>
                  {r.tamaGet ? r.tamaGet.toLocaleString() : "—"}
                </span>
                <span style={{ textAlign: "right", color: r.tamaUse ? C.minus : C.line }}>
                  {r.tamaUse ? r.tamaUse.toLocaleString() : "—"}
                </span>
                <span style={{ textAlign: "right", fontWeight: 700 }}>{r.balance.toLocaleString()}</span>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================
   設定（アイコングリッド → 各マスタ管理）
   ============================================================ */
function Settings({ players, setPlayers, shops, setShops, machines, setMachines, tags, setTags, records, showToast, askConfirm }) {
  const [view, setView] = useState("menu"); // menu | players | shops | machines
  const [playerName, setPlayerName] = useState("");
  const [playerLoginId, setPlayerLoginId] = useState("");
  const [playerPassword, setPlayerPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const emptyMForm = {
    name: "",
    kind: "pachinko",
    border: "",
    oneRProb: "",
    oneRDedama: "",
    sapo: "",
    stages: "6",
    waris: ["", "", "", "", "", ""],
  };
  const [mForm, setMForm] = useState(emptyMForm);
  const [tagName, setTagName] = useState("");

  /* --- 打ち子 --- */
  const addPlayer = () => {
    const name = playerName.trim();
    const loginId = playerLoginId.trim();
    const password = playerPassword;
    if (!name || !loginId || !password) {
      alert("名前・ID・パスワードをすべて入力してください");
      return;
    }
    if (players.some((p) => p.name === name)) {
      alert("同じ名前の打ち子が既に登録されています");
      return;
    }
    if (players.some((p) => p.loginId === loginId)) {
      alert("そのIDは既に使われています");
      return;
    }
    setPlayers((prev) => [...prev, { id: uid("pl"), name, loginId, password }]);
    setPlayerName("");
    setPlayerLoginId("");
    setPlayerPassword("");
    showToast("打ち子を追加しました");
  };
  const deletePlayer = (id) => {
    if (records.some((r) => r.playerId === id)) {
      alert("この打ち子には稼働記録があるため削除できません");
      return;
    }
    askConfirm("この打ち子を削除しますか？", () => {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      showToast("削除しました");
    });
  };

  /* --- ホール --- */
  const addShop = () => {
    const name = shopName.trim();
    if (!name) return;
    if (shops.some((s) => s.name === name)) {
      alert("同じ名前のホールが既に登録されています");
      return;
    }
    setShops((prev) => [...prev, { id: uid("sh"), name }]);
    setShopName("");
    showToast("ホールを追加しました");
  };
  const deleteShop = (id) => {
    askConfirm("このホールをマスタから削除しますか？（既存の稼働記録はそのまま残ります）", () => {
      setShops((prev) => prev.filter((s) => s.id !== id));
      showToast("削除しました");
    });
  };

  /* --- 機種 --- */
  const addMachine = () => {
    const name = mForm.name.trim();
    if (!name) {
      alert("機種名を入力してください");
      return;
    }
    if (machines.some((m) => m.name === name)) {
      alert("同じ機種が既に登録されています");
      return;
    }
    const base = { id: uid("m"), name, kind: mForm.kind };
    if (mForm.kind === "pachinko") {
      base.border = num(mForm.border) || "";
      base.oneRProb = num(mForm.oneRProb) || "";
      base.oneRDedama = num(mForm.oneRDedama) || "";
      base.sapo = Number(mForm.sapo) || 0;
    } else {
      const st = num(mForm.stages) || 6;
      base.stages = st;
      base.waris = mForm.waris.slice(0, st).map((w) => Number(w) || "");
    }
    setMachines((prev) => [...prev, base]);
    setMForm(emptyMForm);
    showToast("機種を追加しました");
  };
  const deleteMachine = (id) => {
    askConfirm("この機種をマスタから削除しますか？（既存の稼働記録はそのまま残ります）", () => {
      setMachines((prev) => prev.filter((m) => m.id !== id));
      showToast("削除しました");
    });
  };

  /* --- タグ --- */
  const addTag = () => {
    const name = tagName.trim();
    if (!name) return;
    if (tags.some((t) => t.name === name)) {
      alert("同じ名前のタグが既に登録されています");
      return;
    }
    setTags((prev) => [...prev, { id: uid("t"), name }]);
    setTagName("");
    showToast("タグを追加しました");
  };
  const deleteTag = (id) => {
    askConfirm("このタグを削除しますか？（既存の稼働記録に付いたタグはそのまま残ります）", () => {
      setTags((prev) => prev.filter((t) => t.id !== id));
      showToast("削除しました");
    });
  };

  const rowStyle = (isLast) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "11px 14px",
    borderBottom: isLast ? "none" : `1px solid ${C.line}`,
  });

  const addRowBtn = {
    background: C.gold,
    color: "#1a1400",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    padding: "0 18px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const backBtn = (
    <button
      onClick={() => setView("menu")}
      style={{
        background: "none",
        border: "none",
        color: C.gold,
        fontSize: 14,
        fontWeight: 700,
        padding: "4px 2px",
        cursor: "pointer",
        marginBottom: 4,
      }}
    >
      ‹ 設定に戻る
    </button>
  );

  /* --- メニュー（アイコングリッド） --- */
  if (view === "menu") {
    const tiles = [
      { id: "players", icon: "👤", label: "打ち子", count: players.length },
      { id: "shops", icon: "🏢", label: "店舗", count: shops.length },
      { id: "machines", icon: "🎰", label: "機種", count: machines.length },
      { id: "tags", icon: "🏷️", label: "タグ", count: tags.length },
    ];
    return (
      <div>
        <SectionTitle>設定</SectionTitle>
        <Card style={{ padding: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {tiles.map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                style={{
                  background: C.panel2,
                  border: `1px solid ${C.line}`,
                  borderRadius: 14,
                  color: C.text,
                  padding: "22px 0 16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 32 }}>{t.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
                <span style={{ fontSize: 10, color: C.sub }}>{t.count}件</span>
              </button>
            ))}
          </div>
        </Card>
        <div style={{ fontSize: 11, color: C.sub, margin: "10px 4px 0" }}>
          機種にボーダーを登録すると、期待値計算で自動入力されます
        </div>
      </div>
    );
  }

  /* --- 打ち子管理 --- */
  if (view === "players") {
    return (
      <div>
        {backBtn}
        <SectionTitle>打ち子の設定</SectionTitle>
        <Card style={{ padding: 0 }}>
          {players.map((p) => (
            <div key={p.id} style={rowStyle(false)}>
              <div>
                <b style={{ fontSize: 14 }}>{p.name}</b>
                <div style={{ fontSize: 10, color: C.sub }}>ID: {p.loginId || "—"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: C.sub }}>
                  稼働{records.filter((r) => r.playerId === p.id).length}回
                </span>
                <button onClick={() => deletePlayer(p.id)} style={smallDeleteBtn}>
                  削除
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="打ち子の名前"
              style={inputStyle}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                value={playerLoginId}
                onChange={(e) => setPlayerLoginId(e.target.value)}
                placeholder="ログインID"
                autoCapitalize="none"
                style={inputStyle}
              />
              <input
                value={playerPassword}
                onChange={(e) => setPlayerPassword(e.target.value)}
                placeholder="パスワード"
                style={inputStyle}
              />
            </div>
            <button onClick={addPlayer} style={{ ...primaryBtn, fontSize: 14, padding: "11px 0", borderRadius: 10 }}>
              打ち子を追加する
            </button>
          </div>
        </Card>
      </div>
    );
  }

  /* --- 店舗管理 --- */
  if (view === "shops") {
    return (
      <div>
        {backBtn}
        <SectionTitle>店舗の設定</SectionTitle>
        <Card style={{ padding: 0 }}>
          {shops.map((s) => (
            <div key={s.id} style={rowStyle(false)}>
              <b style={{ fontSize: 14 }}>{s.name}</b>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: C.sub }}>
                  稼働{records.filter((r) => r.shop === s.name).length}回
                </span>
                <button onClick={() => deleteShop(s.id)} style={smallDeleteBtn}>
                  削除
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, padding: 12 }}>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="店舗名"
              style={inputStyle}
            />
            <button onClick={addShop} style={addRowBtn}>
              追加
            </button>
          </div>
        </Card>
      </div>
    );
  }

  /* --- 機種管理 --- */
  if (view === "machines") {
    return (
      <div>
        {backBtn}
        <SectionTitle>機種マスタ</SectionTitle>
      <div style={{ fontSize: 11, color: C.sub, margin: "0 2px 8px" }}>
        ボーダーを登録すると、期待値計算で機種名を選んだとき自動入力されます
      </div>
      <Card style={{ padding: 0 }}>
        {machines.map((m) => (
          <div key={m.id} style={rowStyle(false)}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {m.name}
              </div>
              <div style={{ fontSize: 10, color: m.kind === "pachinko" ? C.pachi : C.slot }}>
                {m.kind === "pachinko" ? "パチンコ" : `スロット${m.stages ? `・${m.stages}段階` : ""}`}
                {num(m.border) > 0 && <span style={{ color: C.gold }}>　ボーダー {m.border}</span>}
              </div>
              {m.kind === "pachinko" && num(m.oneRProb) > 0 && (
                <div style={{ fontSize: 10, color: C.sub }}>
                  1Rトータル 1/{m.oneRProb}・1R出玉 {m.oneRDedama}玉・サポ{m.sapo > 0 ? "+" : ""}{m.sapo}玉/回転
                </div>
              )}
              {m.kind === "slot" && m.waris && m.waris.some((w) => num(w) > 0) && (
                <div style={{ fontSize: 10, color: C.sub }}>
                  機械割 {m.waris.filter((w) => num(w) > 0).map((w, i) => `${w}`).join(" / ")}%
                </div>
              )}
            </div>
            <button onClick={() => deleteMachine(m.id)} style={{ ...smallDeleteBtn, marginLeft: 8 }}>
              削除
            </button>
          </div>
        ))}
        <div style={{ padding: 12, borderTop: `1px solid ${C.line}` }}>
          <input
            value={mForm.name}
            onChange={(e) => setMForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="機種名"
            style={inputStyle}
          />
          <select
            value={mForm.kind}
            onChange={(e) => setMForm((f) => ({ ...f, kind: e.target.value }))}
            style={{ ...inputStyle, marginTop: 8 }}
          >
            <option value="pachinko">パチンコ</option>
            <option value="slot">スロット</option>
          </select>

          {mForm.kind === "pachinko" ? (
            <>
              <div style={{ fontSize: 10, color: C.sub, margin: "10px 2px 4px" }}>
                仕事量の自動計算用スペック（ptools等の解析値を入力）
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input
                  type="number" inputMode="decimal" step="0.1"
                  value={mForm.border}
                  onChange={(e) => setMForm((f) => ({ ...f, border: e.target.value }))}
                  placeholder="ボーダー（等価）"
                  style={inputStyle}
                />
                <input
                  type="number" inputMode="decimal" step="0.01"
                  value={mForm.oneRProb}
                  onChange={(e) => setMForm((f) => ({ ...f, oneRProb: e.target.value }))}
                  placeholder="1Rトータル確率 1/n"
                  style={inputStyle}
                />
                <input
                  type="number" inputMode="numeric"
                  value={mForm.oneRDedama}
                  onChange={(e) => setMForm((f) => ({ ...f, oneRDedama: e.target.value }))}
                  placeholder="1R出玉（玉）"
                  style={inputStyle}
                />
                <input
                  type="number" inputMode="decimal" step="0.05"
                  value={mForm.sapo}
                  onChange={(e) => setMForm((f) => ({ ...f, sapo: e.target.value }))}
                  placeholder="サポ増減（玉/回転）"
                  style={inputStyle}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: C.sub, margin: "10px 2px 4px" }}>
                設定段階数と設定ごとの機械割（%）を入力
              </div>
              <select
                value={mForm.stages}
                onChange={(e) => setMForm((f) => ({ ...f, stages: e.target.value }))}
                style={inputStyle}
              >
                <option value="6">6段階設定</option>
                <option value="4">4段階設定</option>
                <option value="2">2段階設定</option>
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                {Array.from({ length: num(mForm.stages) || 6 }).map((_, i) => (
                  <input
                    key={i}
                    type="number" inputMode="decimal" step="0.1"
                    value={mForm.waris[i]}
                    onChange={(e) =>
                      setMForm((f) => {
                        const w = [...f.waris];
                        w[i] = e.target.value;
                        return { ...f, waris: w };
                      })
                    }
                    placeholder={`設定${i + 1} 割%`}
                    style={inputStyle}
                  />
                ))}
              </div>
            </>
          )}

          <button onClick={addMachine} style={{ ...primaryBtn, marginTop: 10, fontSize: 14, padding: "11px 0", borderRadius: 10 }}>
            機種を追加する
          </button>
        </div>
      </Card>
      </div>
    );
  }

  /* --- タグ管理 --- */
  return (
    <div>
      {backBtn}
      <SectionTitle>タグの設定</SectionTitle>
      <div style={{ fontSize: 11, color: C.sub, margin: "0 2px 8px" }}>
        立ち回りの種類など、稼働入力で選択できるタグを管理します
      </div>
      <Card style={{ padding: 0 }}>
        {tags.map((t) => (
          <div key={t.id} style={rowStyle(false)}>
            <b style={{ fontSize: 14 }}>🏷️ {t.name}</b>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, color: C.sub }}>
                稼働{records.filter((r) => r.tags && r.tags.includes(t.name)).length}回
              </span>
              <button onClick={() => deleteTag(t.id)} style={smallDeleteBtn}>
                削除
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div style={{ padding: 14, fontSize: 13, color: C.sub }}>タグがありません</div>
        )}
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${C.line}` }}>
          <input
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="タグ名（例：設定狙い）"
            style={inputStyle}
          />
          <button onClick={addTag} style={addRowBtn}>
            追加
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   小役カウンター（カチカチ系アプリ風デザイン）
   モードA/B独立カウント・減算モード・確率自動表示
   ============================================================ */
function KoyakuCounter({ data, setData, askConfirm }) {
  const preset = KOYAKU_PRESETS.find((p) => p.id === data.preset) || KOYAKU_PRESETS[0];
  const m = data.modes[data.mode];

  const setMode = (mode) => setData((d) => ({ ...d, mode }));
  const setField = (k, v) =>
    setData((d) => ({ ...d, modes: { ...d.modes, [d.mode]: { ...d.modes[d.mode], [k]: v } } }));
  const tap = (id) =>
    setData((d) => {
      const cur = d.modes[d.mode].counts[id] || 0;
      const next = Math.max(0, cur + (d.genzan ? -1 : 1));
      return {
        ...d,
        modes: {
          ...d.modes,
          [d.mode]: { ...d.modes[d.mode], counts: { ...d.modes[d.mode].counts, [id]: next } },
        },
      };
    });
  const bumpGames = (delta) =>
    setData((d) => {
      const cur = num(d.modes[d.mode].totalGames);
      return {
        ...d,
        modes: {
          ...d.modes,
          [d.mode]: { ...d.modes[d.mode], totalGames: String(Math.max(0, cur + delta)) },
        },
      };
    });
  const resetAll = () => {
    askConfirm(`モード${data.mode}のカウントをリセットしますか？`, () => {
      setData((d) => ({
        ...d,
        modes: { ...d.modes, [d.mode]: { startGames: "", totalGames: "", counts: {} } },
      }));
    });
  };

  const selfGames = Math.max(0, num(m.totalGames) - num(m.startGames));
  const prob = (count) => (selfGames > 0 && count > 0 ? (selfGames / count).toFixed(1) : null);

  /* ジャグラープリセットの場合: 単独/重複/中チェのBIG・REGを合算して設定推測に使う */
  const isJuggler = data.preset === "juggler";
  const jugglerSpec = JUGGLERS.find((j) => j.id === data.jugglerMachine) || JUGGLERS[0];
  const totalBig =
    num(m.counts.doku_big) + num(m.counts.judai_big) + num(m.counts.nakache_big);
  const totalReg = num(m.counts.doku_reg) + num(m.counts.judai_reg);
  const suisokuRes =
    isJuggler && selfGames > 0
      ? estimateSetting(jugglerSpec, selfGames, totalBig, totalReg, m.counts.grape || 0)
      : null;

  /* iOS風トグル */
  const Toggle = ({ on, onChange }) => (
    <button
      onClick={() => onChange(!on)}
      aria-label="減算モード切替"
      style={{
        width: 54,
        height: 32,
        borderRadius: 999,
        border: "none",
        background: on ? C.minus : "#3A3E52",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 25 : 3,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
    </button>
  );

  const darkField = {
    background: "#0A0B10",
    border: "none",
    borderRadius: 10,
    color: C.text,
    fontSize: 18,
    fontWeight: 700,
    textAlign: "right",
    padding: "10px 14px",
    width: 130,
  };

  /* カウンターを4列ずつに分割 */
  const rows = [];
  for (let i = 0; i < preset.counters.length; i += 4) rows.push(preset.counters.slice(i, i + 4));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ヘッダー: 機種プリセット + リセット */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <select
          value={data.preset}
          onChange={(e) => setData((d) => ({ ...d, preset: e.target.value }))}
          style={{
            ...inputStyle,
            flex: 1,
            textAlign: "center",
            fontWeight: 800,
            fontSize: 16,
            background: C.panel,
          }}
        >
          {KOYAKU_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ▾
            </option>
          ))}
        </select>
        <button
          onClick={resetAll}
          aria-label="リセット"
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: C.panel,
            border: `1px solid ${C.line}`,
            color: C.minus,
            fontSize: 18,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          🗑
        </button>
      </div>

      {/* ジャグラー機種選択（設定推測に使用） */}
      {isJuggler && (
        <select
          value={data.jugglerMachine}
          onChange={(e) => setData((d) => ({ ...d, jugglerMachine: e.target.value }))}
          style={{ ...inputStyle, background: C.panel2 }}
        >
          {JUGGLERS.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name}
            </option>
          ))}
        </select>
      )}

      {/* モードA/B */}
      <div style={{ display: "flex", background: C.panel, borderRadius: 999, padding: 4 }}>
        {["A", "B"].map((md) => (
          <button
            key={md}
            onClick={() => setMode(md)}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 999,
              border: "none",
              background: data.mode === md ? "#5A5F75" : "transparent",
              color: data.mode === md ? "#fff" : C.sub,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            モード{md}
          </button>
        ))}
      </div>

      {/* ゲーム数 */}
      <Card style={{ background: "#14151D", border: "none", borderRadius: 20, padding: "6px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>開始ゲーム数</span>
          <input
            type="number"
            inputMode="numeric"
            value={m.startGames}
            onChange={(e) => setField("startGames", e.target.value)}
            placeholder="0"
            style={darkField}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 8px" }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>総合ゲーム数</span>
          <input
            type="number"
            inputMode="numeric"
            value={m.totalGames}
            onChange={(e) => setField("totalGames", e.target.value)}
            placeholder="0"
            style={darkField}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0 12px" }}>
          <span style={{ fontSize: 14, color: C.sub }}>自己ゲーム: {selfGames.toLocaleString()}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", background: "#2A2D3C", borderRadius: 12, overflow: "hidden" }}>
              <button
                onClick={() => bumpGames(-1)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 20, padding: "8px 20px", cursor: "pointer", borderRight: `1px solid ${C.line}` }}
              >
                −
              </button>
              <button
                onClick={() => bumpGames(1)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: 20, padding: "8px 20px", cursor: "pointer" }}
              >
                ＋
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 減算 + カウンター */}
      <Card style={{ background: "#14151D", border: "none", borderRadius: 20, padding: "14px 14px 18px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 12,
            borderBottom: `1px solid ${C.line}`,
            marginBottom: 14,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 600 }}>
            <span style={{ color: C.minus, fontSize: 20 }}>⊖</span> 減算
          </span>
          <Toggle on={data.genzan} onChange={(v) => setData((d) => ({ ...d, genzan: v }))} />
        </div>

        {rows.map((row, ri) => (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
              marginBottom: ri < rows.length - 1 ? 22 : 0,
            }}
          >
            {row.map((c) => {
              const count = m.counts[c.id] || 0;
              const p = prob(count);
              return (
                <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 13, color: C.sub }}>{p ? `1/${p}` : "1/--"}</span>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      lineHeight: 1,
                      color: count > 0 ? "#fff" : "#5A5E70",
                    }}
                  >
                    {count}
                  </span>
                  <button
                    onClick={() => tap(c.id)}
                    aria-label={c.label}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      maxWidth: 74,
                      borderRadius: 16,
                      border: "none",
                      background: c.color,
                      cursor: "pointer",
                      marginTop: 4,
                      boxShadow: `0 3px 10px ${c.color}44`,
                    }}
                  />
                  <span style={{ fontSize: 12, color: C.text, marginTop: 2, whiteSpace: "nowrap" }}>{c.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </Card>

      {/* 設定推測（ジャグラープリセット時のみ・小役カウントと同時進行） */}
      {isJuggler && (
        <Card style={{ background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})` }}>
          <Label>設定推測（{jugglerSpec.name}・BIG/REGの合算値から算出）</Label>
          {!suisokuRes ? (
            <div style={{ fontSize: 13, color: C.sub, padding: "14px 0", textAlign: "center" }}>
              総合ゲーム数を入力するとBIG・REGカウントから自動推測します
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.sub, margin: "2px 0 10px" }}>
                <span>
                  BIG合計 <b style={{ color: C.text }}>{totalBig}</b>
                </span>
                <span>
                  REG合計 <b style={{ color: C.text }}>{totalReg}</b>
                </span>
                <span>
                  自己G数 <b style={{ color: C.text }}>{selfGames.toLocaleString()}</b>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "6px 0 12px" }}>
                <div>
                  <span style={{ fontSize: 12, color: C.sub }}>最有力 </span>
                  <b
                    style={{
                      fontFamily: "'DotGothic16', monospace",
                      fontSize: 30,
                      color: suisokuRes.best >= 3 ? C.plus : suisokuRes.best >= 2 ? C.gold : C.minus,
                      textShadow: `0 0 12px ${suisokuRes.best >= 3 ? C.plus : C.gold}44`,
                    }}
                  >
                    設定{suisokuRes.best + 1}
                  </b>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: C.sub }}>
                  期待機械割{" "}
                  <b style={{ color: suisokuRes.expWari >= 100 ? C.plus : C.minus, fontSize: 15 }}>
                    {suisokuRes.expWari.toFixed(1)}%
                  </b>
                </div>
              </div>
              {suisokuRes.probs.map((p, i) => {
                const pct = p * 100;
                const isBest = i === suisokuRes.best;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        width: 44,
                        fontSize: 12,
                        fontWeight: isBest ? 800 : 500,
                        color: isBest ? C.gold : C.sub,
                      }}
                    >
                      設定{i + 1}
                    </span>
                    <div style={{ flex: 1, height: 14, background: C.panel2, borderRadius: 7, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.max(pct, 0.5)}%`,
                          height: "100%",
                          borderRadius: 7,
                          background: isBest
                            ? `linear-gradient(90deg, ${C.gold}, #F5D488)`
                            : i >= 3
                            ? C.plus + "88"
                            : C.sub + "55",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 48,
                        textAlign: "right",
                        fontSize: 12,
                        fontWeight: isBest ? 800 : 500,
                        color: isBest ? C.gold : C.sub,
                      }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}`, fontSize: 12 }}>
                <span style={{ color: C.sub }}>高設定（4以上）の可能性</span>
                <b
                  style={{
                    color: suisokuRes.probs.slice(3).reduce((a, b) => a + b, 0) >= 0.5 ? C.plus : C.minus,
                  }}
                >
                  {(suisokuRes.probs.slice(3).reduce((a, b) => a + b, 0) * 100).toFixed(1)}%
                </b>
              </div>
            </>
          )}
          <div style={{ fontSize: 10, color: C.sub, marginTop: 10 }}>
            ※確率・機械割は公表値ベースの参考値。単独/重複/中チェを分けてカウントすると打ち分けの精度が上がります
          </div>
        </Card>
      )}

      {/* メモ */}
      <textarea
        value={data.memo}
        onChange={(e) => setData((d) => ({ ...d, memo: e.target.value }))}
        placeholder="メモ"
        rows={4}
        style={{
          background: "#14151D",
          border: "none",
          borderRadius: 20,
          color: C.text,
          fontSize: 15,
          padding: "14px 16px",
          resize: "none",
        }}
      />

      <div style={{ fontSize: 10, color: C.sub, padding: "0 2px" }}>
        確率は自己ゲーム数（総合−開始）から自動計算。減算ONでタップするとカウントが減ります。モードA/Bは独立してカウントされ、タブを移動しても保持されます
      </div>
    </div>
  );
}

/* ============================================================
   ログイン画面（デモアカウント: z / z）
   ============================================================ */
function LoginScreen({ players, onLogin }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const idTrim = id.trim();
    if (idTrim === ADMIN_ACCOUNT.id && pw === ADMIN_ACCOUNT.pw) {
      onLogin({ role: "admin", name: "管理者" });
      return;
    }
    if (idTrim === DEMO_ACCOUNT.id && pw === DEMO_ACCOUNT.pw) {
      onLogin({ role: "owner", name: "オーナー" });
      return;
    }
    const hitPlayer = (players || []).find((p) => p.loginId === idTrim && p.password === pw);
    if (hitPlayer) {
      onLogin({ role: "player", playerId: hitPlayer.id, name: hitPlayer.name });
      return;
    }
    setError("IDまたはパスワードが違います");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 50% 0%, #1B1E2E 0%, ${C.bg} 55%)`,
        color: C.text,
        fontFamily:
          "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <style>{FONT_CSS}</style>

      {/* ロゴ */}
      <div style={{ textAlign: "center", marginBottom: 34, animation: "ledIn 0.5s ease" }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🎰</div>
        <div
          style={{
            fontFamily: "'DotGothic16', monospace",
            fontSize: 34,
            color: C.gold,
            textShadow: `0 0 16px ${C.gold}66, 0 0 40px ${C.gold}33`,
            letterSpacing: "0.08em",
          }}
        >
          {APP_NAME}
        </div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 8, letterSpacing: "0.2em" }}>
          パチンコ・パチスロ収支管理システム
        </div>
      </div>

      {/* ログインフォーム */}
      <Card style={{ width: "100%", maxWidth: 360, padding: "22px 18px" }}>
        <Label>ログインID</Label>
        <input
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setError("");
          }}
          placeholder="ID"
          autoCapitalize="none"
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        <Label>パスワード</Label>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="パスワード"
          style={{ ...inputStyle, marginBottom: error ? 8 : 16 }}
        />
        {error && (
          <div style={{ fontSize: 12, color: C.minus, marginBottom: 10, textAlign: "center" }}>{error}</div>
        )}
        <button onClick={submit} style={primaryBtn}>
          ログイン
        </button>
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            background: C.panel2,
            borderRadius: 10,
            fontSize: 11,
            color: C.sub,
            textAlign: "center",
            lineHeight: 1.8,
          }}
        >
          管理者（打ち子登録・マスタ管理）　ID: <b style={{ color: C.gold }}>b</b> ／ パスワード: <b style={{ color: C.gold }}>b</b>
          <br />
          オーナー（全体閲覧）　ID: <b style={{ color: C.gold }}>z</b> ／ パスワード: <b style={{ color: C.gold }}>z</b>
          <br />
          打ち子デモ　タカ: <b style={{ color: C.gold }}>taka / 1234</b>　ケン: <b style={{ color: C.gold }}>ken / 1234</b>
        </div>
      </Card>

      <div style={{ fontSize: 10, color: C.sub, marginTop: 22 }}>DEMO版・データは保存されません</div>
    </div>
  );
}
