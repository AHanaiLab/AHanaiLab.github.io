# デプロイログ：未来翻訳（icf_future_translator）

## 2026-09-30

- `synthetic_worlds/renderer/icf_future_translator_v6.html` をリポジトリに追加（コミットのみ、CloudFrontへの配信は未実施）。
- CloudFront配信先（`https://d2hbz2sc71bq7r.cloudfront.net/`）へのデプロイは、AWS認証情報がこの実行環境にまだ存在しないため保留中。環境変数 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` はプレースホルダ値（`InvalidClientTokenId`）で、対象アカウント（Hanai_Lab, 439112340401）への実アクセス権を持たない。
- 実認証情報（`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_DEFAULT_REGION`）が環境変数として設定され次第、以下を実施する：
  1. 現在の `index.html`（v5相当）を `v5/index.html` としてコピー（削除しない）。
  2. `icf_future_translator_v6.html` を `index.html` として `Content-Type: text/html; charset=utf-8` を付与してアップロード。
  3. CloudFrontで `/*` のキャッシュ無効化。
  4. `curl -s https://d2hbz2sc71bq7r.cloudfront.net/ | grep -o "schema 6.0.0"` で確認。
  5. 本ログにバケット名・ディストリビューションID・無効化IDを追記。
