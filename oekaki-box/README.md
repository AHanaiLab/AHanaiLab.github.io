# お絵描きボックス

匿名でお絵描きして、事務局にだけ送る期間限定サイト。いいね・ギャラリー・認証なし。

- **フロント**: `frontend/index.html`(Canvas。ペン/消しゴム/色/太さ/戻す/やり直す、スマホ・タブレット対応)
- **API**: API Gateway(HTTP API) + Lambda(Python 3.12)
  - `GET /api/status` … 受付期間の状態(before/open/closed)
  - `POST /api/submit` … PNG(3MBまで)・ニックネーム・メッセージを保存
- **受信箱**: 非公開 S3(暗号化、`RetentionDays` 日後に自動削除)。公開側から読む手段はありません
- **期間限定**: `OpenFrom` / `OpenUntil` をサーバー側で判定。期間外は投稿を拒否し、画面も「受付終了」表示
- **荒らし対策**: スロットリング(5req/s)、ハニーポット、PNG検証、サイズ・文字数制限
- **IaC**: AWS SAM(`saqra-portal` と同じ。S3 + CloudFront 配信)

## デプロイ

```bash
OPEN_FROM=2026-10-01T00:00:00+09:00 \
OPEN_UNTIL=2026-10-31T23:59:59+09:00 \
NOTIFY_EMAIL=you@example.com \
./deploy.sh
```

`NOTIFY_EMAIL` を指定すると、SNS から届く購読確認メールを承認した後、投稿のたびに通知が届きます(省略可)。

## 事務局の受信

```bash
./fetch.sh     # ./inbox/ に PNG と JSON(ニックネーム・メッセージ)を同期
```

## 期間の変更・終了

- 期間変更: 上記の `OPEN_FROM` / `OPEN_UNTIL` を変えて `./deploy.sh` を再実行
- 完全に片付ける: `aws cloudformation delete-stack --stack-name oekaki-box`(受信箱に絵が残っている場合は先に `./fetch.sh` で回収し、バケットを空にしてください)
