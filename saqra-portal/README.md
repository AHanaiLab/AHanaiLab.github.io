# SAQRA 研究検索ポータル（AWS デプロイ一式）

S3 + CloudFront（フロントエンド）と Lambda + API Gateway（FastAPI/Mangum バックエンド）で構成される研究検索ポータルです。

```
[ブラウザ]
   ├─ CloudFront ─ S3（frontend/index.html）
   └─ API Gateway (HTTP API) ─ Lambda（FastAPI/Mangum）
                      ├─ PubMed / researchmap プロキシ
                      ├─ AMED（取得・パース）
                      └─ Bedrock（対話型ICF分類・50年後QOL変換）
```

## ファイル構成

| パス | 内容 |
|---|---|
| `frontend/index.html` | ポータル画面（ICF 50年後翻訳のチャット + 研究検索）。1ファイル完結でバイブコーディング向けにコメント付き |
| `frontend/guide.html` | ハッカソン参加者ガイド（改造手順・プロンプト例・発表フォーマット） |
| `backend/app.py` | FastAPI + Mangum。対話型ICF分類・50年後QOL変換・PubMed/researchmap/AMED |
| `backend/requirements.txt` | fastapi / mangum / httpx / anthropic[bedrock] |
| `template.yaml` | SAM テンプレート（Lambda, HTTP API, S3, CloudFront OAC） |
| `deploy.sh` | build → deploy → API_BASE 差し込み → S3 同期 → invalidation を一括実行 |
| `samconfig.toml` | スタック名 `saqra-portal` / region `ap-northeast-1` のデプロイ設定 |

## 画面の使い方（患者・家族向け）

**ICF 50年後翻訳（ICF-QOL Translator, 対話型）** — 「対話型ICF分類 設計 v0.3」に準拠

1. 生活の状況や困りごとを自分のことばで入力（例文あり）
2. AIがICF（健康状態／心身機能b／身体構造s／活動・参加d／環境因子e／個人因子）に仮分類し、右の「ICF充足度」メーターが更新される
3. 足りないカテゴリについてAIが質問（2〜4ターン、最大5）。答えるたびにマージされる
4. 揃ったら「確定して50年後QOLへ」→ 50年後（2076年）のQOLを、いま／2076年の対比・物語・必要な研究として表示
5. 「関連する研究を探す」で、その未来に関わる論文検索へ

**研究を探す** — 日本語で入力するとAIが英語の検索語に変換してPubMedを検索。結果の「ICFで読む」で研究が生活機能のどこに関わるかを整理。

ハッカソン参加者向けの改造手順は `frontend/guide.html`（デプロイ後は `<CloudFront URL>/guide.html`）にあります。
ローカルに保存した `index.html` はそのまま同じAPIに接続して動きます（`?api=` または画面下部「API設定」で接続先を変更可）。

## API エンドポイント

- `POST /api/icf/dialogue` — 対話型ICF分類。リクエスト: `{"message": "...", "icf": <前回のICF or null>, "turn": <前回のturn>}`。レスポンス: `{icf, assessment{categories, missing, all_filled, completeness_pct}, updates[], turn, phase: "collecting"|"confirming", reply, question}`。Lambdaはステートレスなので ICF と turn はクライアントが保持して毎回送る。1ターン = LLM 1回（分類/マージと次の質問を同時生成、充足判定はPythonのルール）
- `POST /api/icf/future` — Stage 3: 50年後QOL変換。リクエスト: `{"icf": {...}}`。レスポンス: `{headline, qol_now, qol_2076, categories[{label, now, future, enabled_by}], day_in_2076, research_needed[], search_keywords_en[]}`
- `POST /api/icf/translate` — テキスト（論文抄録など）のICF分類のみ。レスポンス: `{summary, body_functions, body_structures, activities_participation, environmental_factors, personal_factors}`
- `GET /api/pubmed/search?q=<クエリ>&retmax=10` — PubMed（esearch + efetch、抄録付き）。日本語クエリは Bedrock で英訳してから検索
- `GET /api/rmap/search?q=<クエリ>` — researchmap API プロキシ
- `GET /api/amed/search?q=<クエリ>` — AMEDfind 取得。**`AmedSearchUrl` パラメータ設定までは 501 を返します**（後述）

AIへの指示文（プロンプト）は `backend/app.py` の `ICF_PARSE_SYSTEM` / `ICF_MERGE_SYSTEM` / `FUTURE_TRANSFORM_SYSTEM` / `QUERY_TRANSLATE_SYSTEM`。
不足カテゴリのフォールバック質問は `QUESTION_TEMPLATES`。HTTP API 全体に 20 req/s（バースト40）のスロットリングを設定しています。

## 前提

```bash
# 1. 必要なCLIをインストール（macOS / Homebrew）
brew install awscli aws-sam-cli
# Windows: winget install Amazon.AWSCLI Amazon.SAM-CLI
# Homebrew を使わない場合は公式インストーラ:
#   https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# 2. インストール確認
aws --version && sam --version

# 3. AWS 認証設定
aws configure          # Access Key / Secret / region: ap-northeast-1
```

`deploy.sh` は実行前に `aws` / `sam` の有無と認証情報を自動チェックし、不足していれば
インストール方法を表示して停止します。

- **Python 3.12 が必要です**（Lambda ランタイムに合わせてビルドするため）: `brew install python@3.12`
  Docker がある場合は代わりに `sam build --use-container` でも可。
- **Bedrock モデル**: Lambda が起動時に「`BEDROCK_MODEL_ID`（カンマ区切り、任意）→ 組み込み候補 → 東京リージョンで検出した
  Anthropic モデル」の順に試し、使えたものを使います（Legacy 指定でアクセス不可になったモデルを自動で避けるため）。
  デプロイ後に `curl "$API/api/models?check=1"` を実行すると、実際に使えるモデル（`resolved`）と検出結果が分かります。
  特定のモデルに固定したい場合は `BEDROCK_MODEL_ID=<id> ./deploy.sh`（例: `jp.anthropic.claude-sonnet-4-6` は日本国内推論、
  `global.anthropic.claude-sonnet-5` は最新世代。未指定は `auto`）。

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

CloudFront の URL をブラウザで開き、例文を送ってAIの質問が返り、「研究を探す」で検索結果が出れば成功です。

## AMEDfind エンドポイントの設定

1. ブラウザで AMEDfind を開き、DevTools → Network で検索時の XHR を確認
2. その URL とクエリパラメータ名を使って再デプロイ:

```bash
AMED_SEARCH_URL="https://..." AMED_QUERY_PARAM="keyword" ./deploy.sh
```

## ハッカソン前の推奨設定

- **NCBI API キー**（無料、PubMed のレート上限が 3→10 req/s に上がります。30名同時利用時に有効）:
  https://www.ncbi.nlm.nih.gov/account/ で取得し `NCBI_API_KEY=... ./deploy.sh`
- **Bedrock のクォータ確認**: 東京リージョンの Claude Sonnet 4 の「1分あたりリクエスト数」がイベント人数に足りるか Service Quotas で確認
- 当日は `curl "$API/api/health"` と検索・翻訳を各1回、開始前に実行して疎通確認

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
