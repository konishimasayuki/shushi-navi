# 収支管理システム

パチンコ・パチスロ収支管理システム（Next.js + React + Upstash Redis）

## Upstashのセットアップ

1. https://console.upstash.com/ でアカウント作成 → 「Create Database」
2. Type は Regional、リージョンは近い場所(東京など)を選択
3. 作成したデータベースの「REST API」タブに表示される
   `UPSTASH_REDIS_REST_URL` と `UPSTASH_REDIS_REST_TOKEN` をコピー

## ローカル開発

`.env.local.example` を `.env.local` にリネームして、上でコピーした2つの値を貼り付ける。

```bash
npm install
npm run dev
```

## Vercelへのデプロイ

1. このリポジトリをVercelにインポート（Framework Presetは自動でNext.jsになる）
2. Vercelのプロジェクト設定 → Environment Variables に
   `UPSTASH_REDIS_REST_URL` と `UPSTASH_REDIS_REST_TOKEN` を追加
3. Deploy

## データの永続化について

打ち子・店舗・機種・タグ・稼働記録・現金出納帳・小役カウンターの7項目は
`/api/data` 経由でUpstash Redisに保存されます。初回アクセス時は自動でデモデータが
Redisに投入され、以降は誰がアクセスしても同じデータが共有・保持されます。

## ロール

- 管理者(`b`/`b`): 打ち子登録・店舗/機種/タグのマスタ管理が可能
- オーナー(`z`/`z`): 全体閲覧
- 打ち子: 設定画面で登録した名前・ID・パスワードでログイン。自分の稼働記録のみ入力可能

## 今後の予定

- 打ち子ごとのアクセス制御の強化（サーバーサイドでのセッション検証）
- 稼働記録データが増えてきた場合のページネーション
