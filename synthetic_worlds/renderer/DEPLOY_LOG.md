# デプロイログ：未来翻訳（icf_future_translator）

## 2026-09-30

- `synthetic_worlds/renderer/icf_future_translator_v6.html` をリポジトリに追加（コミットのみ、CloudFrontへの配信は未実施）。
- CloudFront配信先（`https://d2hbz2sc71bq7r.cloudfront.net/`）へのデプロイは、AWS認証情報がこの実行環境にまだ存在しないため保留中。環境変数 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` はプレースホルダ値（`InvalidClientTokenId`）で、対象アカウント（Hanai_Lab, 439112340401）への実アクセス権を持たない。
## 2026-09-30 08:37 UTC — v6 デプロイ実施

AWS認証情報（IAMユーザー `Hanai`, アカウント 439112340401 / Hanai_Lab）が環境に設定されたため、以下を実施し完了した。

- **バケット名**: `hanai-lab-icf-future-sitebucket-siyomnyepbre`（リージョン `ap-northeast-1`）
- **CloudFrontディストリビューションID**: `E1O4W2K7QXVY8W`（ドメイン `d2hbz2sc71bq7r.cloudfront.net`、コメント "ICF Future Translator - static research prototype"）
- **手順**:
  1. デプロイ前の `index.html`（15,146バイト、`schema_version:'5.0.0'`）を `v5/index.html` へサーバーサイドコピーで退避（削除せず）。コピー後 `HeadObject` でサイズ・Content-Type一致を確認済み。
  2. `synthetic_worlds/renderer/icf_future_translator_v6.html`（20,285バイト、`schema_version:'6.0.0'`）を `index.html` として `Content-Type: text/html; charset=utf-8` を明示してアップロード。
  3. CloudFrontで `/*` のキャッシュ無効化を実行。**無効化ID**: `I16FF7UAU72L4OMDI80I2LJVXC`。ステータス `Completed` まで待機して確認。
- **確認結果**:
  - `curl -s https://d2hbz2sc71bq7r.cloudfront.net/ | grep -o "schema 6.0.0"` による配信後の確認は、**この実行環境（サンドボックス）のネットワークegressポリシーが `d2hbz2sc71bq7r.cloudfront.net` へのアウトバウンド接続をブロックしているため実施不可**（curl・WebFetchともに `EGRESS_BLOCKED` / プロキシ403）。組織ポリシーによる拒否のため回避策は取らず、代わりにS3側のオブジェクト本文を直接取得して同じ文字列の有無を確認した：
    - `index.html`（新規アップロード後）に `"schema 6.0.0"` が含まれることを確認 ✅
    - `v5/index.html` に `"schema_version:'5.0.0"` が含まれることを確認 ✅
  - CloudFront経由での実際の公開URLアクセスは、ユーザー側の環境から `curl -s https://d2hbz2sc71bq7r.cloudfront.net/ | grep -o "schema 6.0.0"` を実行して最終確認いただきたい。
  - v6のクライアントサイド動作（8ステップ完走、JSON schema、4回同点時の推定0＋member checking表示、375px幅でのカード縦積み）は、同一HTMLをローカルでオフライン起動しPlaywrightで自動操作して検証済み（結果は次項）。CloudFront配信そのものへの到達はブロックされているため、配信後の実URLでの動作確認はユーザー側でお願いしたい。

### ローカルオフライン動作確認（Playwrightによる自動操作、`icf_future_translator_v6.html` を直接ローカルサーバーで起動）

- 8ステップを最後まで通し、`st` オブジェクトに `schema_version:"6.0.0"`, `formative_evaluation:true`, `research_data:false`, `personal_data_collected:false` を確認 ✅
- 4回の比較すべてで「どちらも同じくらい」を選択 → `inferred_profile.attribute_weights` が全属性で0になることを確認 ✅、かつその後も member checking（「当てはまる／一部当てはまる／当てはまらない」）の質問が表示され回答できることを確認 ✅
- モバイル幅（375px）で `#worlds` の `grid-template-columns` が単一カラムになり、2枚の世界カードが縦に積まれる（2枚目のY座標が1枚目の下端以降）ことを確認 ✅
