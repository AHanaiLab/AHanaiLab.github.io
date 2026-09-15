# SAQRA 研究検索ポータル（AWS デプロイ一式）

S3 + CloudFront（フロントエンド）と Lambda + API Gateway（FastAPI/Mangum バックエンド）で構成される研究検索ポータルです。

```
[ブラウザ]
   ├─ CloudFront ─ S3（frontend/index.html）
   └─ API Gateway (HTTP API) ─ Lambda（FastAPI/Mangum）
                      ├─ PubMed / researchmap プロキシ
                      ├─ AMED（取得・パース）
                      └─ Bedrock（PubMed日本語検索の英訳・「ICFで読む」）
```

## ファイル構成

| パス | 内容 |
|---|---|
| `frontend/index.html` | メイン: 研究開発マップ＋検索ポータル（1ファイル完結、バイブコーディング向けコメント付き） |
| `frontend/icf.html` | サブ: きょうの暮らし（WHOQOL-BREFベースの対話型ePRO、LLM不使用・ブラウザ内完結） |
| `frontend/guide.html` | ハッカソン参加者ガイド（改造手順・プロンプト例・発表フォーマット） |
| `backend/app.py` | FastAPI + Mangum。PubMed/researchmap/AMED・「ICFで読む」（ICF分類）。旧icf.html用の対話型ICF分類・50年後QOL変換も後方互換で残置 |
| `backend/requirements.txt` | fastapi / mangum / httpx / anthropic[bedrock] |
| `template.yaml` | SAM テンプレート（Lambda, HTTP API, S3, CloudFront OAC） |
| `deploy.sh` | build → deploy → API_BASE 差し込み → S3 同期 → invalidation を一括実行 |
| `samconfig.toml` | スタック名 `saqra-portal` / region `ap-northeast-1` のデプロイ設定 |

## 画面構成

| ページ | 役割 |
|---|---|
| `index.html`（メイン） | **全がん連 × J-SUPPORT × SaQRA 研究開発マップ＋検索ポータル**。困りごと30カテゴリ（全がん連調査順）から開発マップ掲載の公的研究費研究（55件）を絞り込み。PubMed と researchmap はページ内で検索（日本語→AIが英語検索語に変換）、AMED・厚労科研・UMIN は公式サイトへ。PubMed結果の「ICFで読む」で研究を生活機能に整理し、関連カテゴリへ戻れる |
| `icf.html`（サブ） | **きょうの暮らし**。WHOQOL-BREFの考え方を参考にした対話型ePRO試作。全体評価・影響した領域・経験・大切なこと・希望の5つの短い質問で振り返りを作成。LLM/バックエンドは使わず、回答はブラウザ内だけで処理（サーバー送信なし）。任意機能から「50年後」の思考実験も可能 |
| `guide.html` | ハッカソン参加者ガイド |

URLで初期状態を指定できます: `index.html?cat=8`（痛みカテゴリ）、`index.html?src=pubmed&q=fatigue`。

**きょうの暮らしの流れ**（icf.html）: この2週間の生活の質を全体評価 → 影響したWHOQOL-BREF領域を選択 → その領域での経験 → 経験の意味・価値 → 今後望む方向、の5回答で振り返りが自動完成。ICFは文脈整理のオントロジーとしてのみ使用し、本人の評価から障害・重症度・ニーズを推定しません。任意機能から対話の継続・50年後の比較・未来の一日の想像・回答の見直しができ、JSONで保存できます。

このページはAPI/LLMを呼び出さず、ローカルに保存してそのまま開いても同じように動きます。`index.html` はローカル保存版でも同じAPIに接続して動きます（`?api=` または画面下部「API設定」で接続先を変更可）。

## API エンドポイント

- `POST /api/icf/translate` — テキスト（論文抄録など）のICF分類のみ。`index.html` の「ICFで読む」から呼ばれます。レスポンス: `{summary, body_functions, body_structures, activities_participation, environmental_factors, personal_factors}`
- `POST /api/icf/dialogue` / `POST /api/icf/future` — 対話型ICF分類・50年後QOL変換（旧 icf.html 用）。現在どのページからも呼ばれていませんが、後方互換のため `backend/app.py` に残しています
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

CloudFront の URL を開き、カテゴリ「8. 痛み」で研究が4件出ること、PubMedタブで日本語検索できること、`icf.html`（きょうの暮らし）で5つの質問に答えて振り返りが完成することを確認してください。

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
- Bedrock: 呼び出し分のみ（PubMed日本語検索の英訳・「ICFで読む」1回あたり数円以下。「きょうの暮らし」はBedrockを呼びません）

## 独自ドメイン

Route 53 + ACM 証明書（**us-east-1** で発行）を CloudFront の `Aliases` / `ViewerCertificate` に追加してください。
