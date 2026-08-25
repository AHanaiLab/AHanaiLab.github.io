# SAQRA 研究検索ポータル（AWS デプロイ一式）

S3 + CloudFront（フロントエンド）と Lambda + API Gateway（FastAPI/Mangum バックエンド）で構成される研究検索ポータルです。

```
[ブラウザ]
   ├─ CloudFront ─ S3（frontend/index.html）
   └─ API Gateway (HTTP API) ─ Lambda（FastAPI/Mangum）
                      ├─ PubMed / researchmap プロキシ
                      ├─ AMED（取得・パース）
                      └─ Bedrock（ICF翻訳）
```

## ファイル構成

| パス | 内容 |
|---|---|
| `frontend/index.html` | ポータル画面（PubMed / researchmap / AMED / ICF翻訳タブ）。既存のHTMLがあればこのファイルを差し替え可（`__API_BASE__` プレースホルダを含めること） |
| `backend/app.py` | FastAPI + Mangum。4エンドポイントを実装 |
| `backend/requirements.txt` | fastapi / mangum / httpx / anthropic[bedrock] |
| `template.yaml` | SAM テンプレート（Lambda, HTTP API, S3, CloudFront OAC） |
| `deploy.sh` | build → deploy → API_BASE 差し込み → S3 同期 → invalidation を一括実行 |
| `samconfig.toml` | スタック名 `saqra-portal` / region `ap-northeast-1` のデプロイ設定 |

## API エンドポイント

- `GET /api/pubmed/search?q=<クエリ>&retmax=20` — PubMed E-utilities（esearch + esummary）
- `GET /api/rmap/search?q=<クエリ>` — researchmap API プロキシ（`q` 以外のクエリパラメータはそのまま転送）
- `GET /api/amed/search?q=<クエリ>` — AMEDfind 取得。**`AmedSearchUrl` パラメータ設定までは 501 を返します**（後述）
- `POST /api/icf/translate` — Bedrock (Claude) による ICF 分類。リクエスト: `{"text": "..."}`、レスポンス: `{body_functions, activities, participation, environmental_factors, personal_factors, related_categories}`

## 前提

```bash
aws configure          # Access Key / Secret / region: ap-northeast-1
brew install aws-sam-cli   # Windows: winget install Amazon.SAM-CLI
```

- Python 3.12 がローカルにない場合は `sam build --use-container` を使ってください（Docker が必要）。
- **Bedrock モデルアクセス**: AWSコンソール → Bedrock → Model access で Claude を有効化しておくこと。
  既定モデルは `apac.anthropic.claude-sonnet-4-20250514-v1:0`（APAC クロスリージョン推論プロファイル）。
  変更する場合は `BEDROCK_MODEL_ID=... ./deploy.sh` または `template.yaml` の `BedrockModelId` を編集。

## デプロイ

```bash
cd saqra-portal
chmod +x deploy.sh
./deploy.sh
```

初回は CloudFront 作成に数分かかります。完了するとフロントエンドURL・APIベースURLが表示されます。

### 動作確認

```bash
curl "https://<api-id>.execute-api.ap-northeast-1.amazonaws.com/api/pubmed/search?q=cancer+survivorship"
```

CloudFront の URL をブラウザで開き、PubMed タブで検索結果が出れば成功です。

## AMEDfind エンドポイントの設定

1. ブラウザで AMEDfind を開き、DevTools → Network で検索時の XHR を確認
2. その URL とクエリパラメータ名を使って再デプロイ:

```bash
AMED_SEARCH_URL="https://..." AMED_QUERY_PARAM="keyword" ./deploy.sh
```

レスポンスの構造が特殊な場合は `backend/app.py` の `amed_search` にパース処理を追加してください。

## 既存 HTML の差し替え

既存のポータル HTML を使う場合は `frontend/index.html` を置き換え、API 接続部分を以下のようにしてください（`deploy.sh` がデプロイ時に実URLへ置換します）:

```javascript
const API_BASE_RAW = '__API_BASE__';
const API_BASE = API_BASE_RAW.startsWith('__') ? '/api' : API_BASE_RAW;
```

その後 `./deploy.sh` を再実行すれば S3 同期と CloudFront invalidation まで自動で行われます。

## 費用感

- Lambda / API Gateway / S3 / CloudFront: この規模ならほぼ無料枠内
- Bedrock: 呼び出し分のみ（ICF翻訳1回あたり数円以下）

## 独自ドメイン

Route 53 + ACM 証明書（**us-east-1** で発行）を CloudFront の `Aliases` / `ViewerCertificate` に追加してください。
