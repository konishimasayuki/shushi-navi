import { Redis } from "@upstash/redis";

/* Vercelの環境変数(UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)から自動で読み込む */
export const redis = Redis.fromEnv();
