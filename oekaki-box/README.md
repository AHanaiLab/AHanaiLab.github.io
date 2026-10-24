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

## 3Dモデル化(任意・Unity 用 GLB)

`TRIPO_API_KEY` を指定すると、描いたあとに「🧊 3Dプレビューを作る」を押せます。
絵を [Tripo](https://www.tripo3d.ai/) に送って GLB を作り、回転表示で確認できます。**この時点では事務局に送られません。**

- 気に入らなければ描き直して、もう一度プレビューできます(絵を変えるとプレビューは無効になります)
- 3Dにしない人は、プレビューを押さずにそのまま「事務局に送る」
- 3Dを確認して送ると、GLB が絵と同じ受信箱に保存されます(`./fetch.sh` で Drive へ)。投稿JSONの `has_3d_model` で有無が分かります
- 送信時にサーバーが「プレビューで見た絵と同じか」を照合し、違う絵には3Dを添付しません
- プレビュー1回ごとに1日の上限(`DAILY_MODEL_LIMIT`、既定100、JST)を消費します。超えると絵だけ送れます
- プレビュー用の絵・3Dは、送られなかった分を7日で自動削除します
- 処理は非同期の Lambda(`worker.py`)。Tripo を呼ぶのは `tripo_*` の3関数だけ。仕様やURLが違う場合はここと `TRIPO_API_BASE` を直します
- キー未指定なら3D機能は無効(ボタンを押すとその旨が出て、絵だけ送れます)

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
./fetch.sh     # PNG と JSON(ニックネーム・メッセージ)を同期
```

保存先は、Google ドライブ for desktop があれば自動で「マイドライブ/お絵描きボックス」になり、
Drive に同期されます。なければ `./inbox/` です。`DEST=/保存先 ./fetch.sh` で指定もできます。
取得済みのファイルは再ダウンロードされません。

## 期間の変更・終了

- 期間変更: 上記の `OPEN_FROM` / `OPEN_UNTIL` を変えて `./deploy.sh` を再実行
- 完全に片付ける: `aws cloudformation delete-stack --stack-name oekaki-box`(受信箱に絵が残っている場合は先に `./fetch.sh` で回収し、バケットを空にしてください)
