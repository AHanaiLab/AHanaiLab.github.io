# SaQRA 研究開発マップ（叩き台・静的サイト）

https://saqra.jp/kaihatsumap/index.html の構成（イントロ・用語説明・ご注意・30項目ナビ・項目ごとの
「介入・調査の内容／公的研究費による研究」「がん種／世代／背景／研究種類／研究費」「日本／海外のガイドライン」表）に
準拠した1枚の静的ページです。各項目の末尾に「最新の研究動向（自動収集）」として PubMed・Minds・AMED の検索結果を
**バックエンド（収集Lambda）が事前に取得したJSON**から表示します。Bedrock/AI は使いません。

```
[ブラウザ] ─ CloudFront ─ S3
                           ├─ index.html / admin.html（静的、外部ライブラリなし）
                           └─ data/map.json（マップ本体・管理者が更新）
                              data/pubmed.json, guidelines.json, amed.json, status.json（収集Lambdaが更新）
[EventBridge 週1回] ─ 収集Lambda ─ PubMed E-utilities / Minds / AMEDfind ─→ S3 data/*.json ─→ CloudFront invalidation
[管理者ページ] ─ Function URL（X-Admin-Token）─ 同じLambdaを手動実行
```

`saqra-portal`（ハッカソン用ポータル）とは**別スタック**（`saqra-map`）で、別のURLになります。

## ファイル

| パス | 内容 |
|---|---|
| `frontend/index.html` | 研究開発マップ本体（元ページ準拠の表、ナビ、キーワード絞り込み、未実施のみ表示） |
| `frontend/admin.html` | 管理者ページ（外部データの手動更新・最終更新確認） |
| `frontend/data/map.json` | マップ本体。`categories[]`（30項目、ナビ表示名 `nav`、PubMed検索語 `en`、元ページ順の `blocks[]`＝研究行／ガイドライン表／注） |
| `tools/import_kaihatsumap.py` | 公式ページの保存HTMLから `map.json` を再生成する管理者用ツール |
| `collector/app.py` | 収集Lambda（標準ライブラリ＋boto3のみ） |
| `template.yaml` / `deploy.sh` / `samconfig.toml` | SAM 一式（スタック名 `saqra-map`） |

## デプロイ

```bash
cd saqra-map
./deploy.sh
```

初回はCloudFront作成で5〜10分。完了時に **マップURL・管理者ページURL・管理者トークン** が表示されます
（トークンは `.admin_token` に保存され、git には入りません）。

推奨: NCBI APIキー（無料）を設定すると PubMed 収集が速く安定します。

```bash
NCBI_API_KEY=xxxx ./deploy.sh
```

## データの更新

- **外部データ（PubMed／ガイドライン／AMED）**: 週1回自動。すぐ更新したいときは管理者ページでトークンを入力して「今すぐ更新」。
- **マップ本体（掲載研究・カテゴリ）**: 次のどちらか。
  - 公式ページ https://saqra.jp/kaihatsumap/index.html が更新されたら、ブラウザで「ページのソースを保存」し
    `python3 tools/import_kaihatsumap.py 保存したファイル.html` → `./deploy.sh`（`en` は引き継がれます）
  - 個別に直すときは `frontend/data/map.json` を編集して `./deploy.sh`
    （`blocks[]` の `study: null` が「ー」＝未実施の行。研究が始まったら `{title,url}` を入れる）
  - ブラウザ上で編集できる管理画面は次の段階で追加予定。

## AMEDfind / Minds のエンドポイント設定

どちらも公開APIが確認できていないため、既定では検索リンクのみ表示します。
ブラウザの DevTools → Network で検索時のリクエストURLを確認し、`{q}` をキーワードの位置に置いて渡すと取得を試みます。

```bash
AMED_SEARCH_URL='https://amedfind.amed.go.jp/…?keyword={q}' MINDS_SEARCH_URL='https://minds.jcqhc.or.jp/…?q={q}' ./deploy.sh
```

- AMED: JSON が返る想定（`title`/`url` 相当のキーを自動で拾います）
- Minds: HTML 検索結果ページから `/docs/gl/` へのリンクを抽出します

## 費用

S3・CloudFront・Lambda（週1回、1〜2分）はほぼ無料枠内。AI は使わないためモデル費用はかかりません。
