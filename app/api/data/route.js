import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";
import { DATA_KEYS, SEED_DATA } from "../../../lib/seedData";

const KEY_PREFIX = "pachi:";

/* GET /api/data
   全7項目をRedisから取得して返す。まだ何も無ければデモデータで初期化(シード)する */
export async function GET() {
  try {
    const values = await redis.mget(...DATA_KEYS.map((k) => KEY_PREFIX + k));

    const result = {};
    const toSeed = {};

    DATA_KEYS.forEach((key, i) => {
      if (values[i] === null || values[i] === undefined) {
        result[key] = SEED_DATA[key];
        toSeed[key] = SEED_DATA[key];
      } else {
        result[key] = values[i];
      }
    });

    /* 初回アクセス分だけ書き込む */
    const seedKeys = Object.keys(toSeed);
    if (seedKeys.length > 0) {
      await Promise.all(seedKeys.map((key) => redis.set(KEY_PREFIX + key, toSeed[key])));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/data error:", err);
    return NextResponse.json({ error: "failed to load data" }, { status: 500 });
  }
}

/* POST /api/data  body: { key: "players" | "records" | ..., value: <any> }
   指定したキー1つだけをRedisに保存する */
export async function POST(request) {
  try {
    const body = await request.json();
    const { key, value } = body || {};

    if (!DATA_KEYS.includes(key)) {
      return NextResponse.json({ error: `unknown key: ${key}` }, { status: 400 });
    }

    await redis.set(KEY_PREFIX + key, value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/data error:", err);
    return NextResponse.json({ error: "failed to save data" }, { status: 500 });
  }
}
