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
| `frontend/index.html` | ポータル画面（検索 → ICF 50年後翻訳）。1ファイル完結でバイブコーディング向けにコメント付き |
| `frontend/guide.html` | ハッカソン参加者ガイド（改造手順・プロンプト例・発表フォーマット） |
| `backend/app.py` | FastAPI + Mangum。4エンドポイントを実装 |
| `backend/requirements.txt` | fastapi / mangum / httpx / anthropic[bedrock] |
| `template.yaml` | SAM テンプレート（Lambda, HTTP API, S3, CloudFront OAC） |
| `deploy.sh` | build → deploy → API_BASE 差し込み → S3 同期 → invalidation を一括実行 |
| `samconfig.toml` | スタック名 `saqra-portal` / region `ap-northeast-1` のデプロイ設定 |

## 画面の使い方（患者・家族向け）

1. 日本語で知りたいことを入力して「探す」— AIが英語のPubMed検索語に変換します（`query_en` として表示）
2. 結果カードの「ICF 50年後翻訳」を押す — やさしい要約、ICF各領域の「いま → 50年後」、2076年のある一日の物語、残された課題が表示されます
3. 論文を探さず「自分の言葉から翻訳する」も可能

ハッカソン参加者向けの改造手順は `frontend/guide.html`（デプロイ後は `<CloudFront URL>/guide.html`）にあります。
ローカルに保存した `index.html` はそのまま同じAPIに接続して動きます（`?api=` または画面下部「API設定」で接続先を変更可）。

## AIの内部状況を可視化する2つの仕掛け

「ICF 50年後翻訳」の結果パネルには、AIがブラックボックスのまま答えを返すのではなく、
その途中経過を覗けるようにする2つの可視化機能があります（`frontend/index.html` に実装、追加の依存ライブラリなし）。

| 機能 | 何をするか | 実装 |
|---|---|---|
| 🔎 **Jacobianレンズ** | 各ICF項目の「いま／50年後」の判断が、入力文（抄録・自分の言葉）のどの一節に基づくかをハイライト表示する。項目と原文ハイライトはマウスオーバー／クリックで相互に連動する。入力に対する出力の「感度」を疑似的に可視化する試み | バックエンド `icf_future` のプロンプトに `evidence`（原文からの逐語引用）フィールドを追加し、フロントエンドの `buildLens()` が引用文を原文中から検索してハイライトHTMLを生成する |
| 🧠 **Second Brain** | 「ICF 50年後翻訳」を実行するたびに、AIが見つけたICF項目（概念）どうしのつながりを蓄積し、力学モデル（簡易フォースレイアウト）でノードグラフとして描画する。同じ概念が複数の研究にまたがって出てくるほど、グラフの中心に育っていく | `addToBrain()` が結果を `localStorage`（ブラウザ内のみ、外部送信なし）に蓄積し、`layoutBrain()` / `drawBrain()` が Canvas 2D に描画する |

どちらも既存の `/api/icf/future` レスポンスの拡張（`evidence` フィールド）だけで実現しており、新しい依存関係やAPIエンドポイントは追加していません。

## API エンドポイント

- `GET /api/pubmed/search?q=<クエリ>&retmax=10` — PubMed（esearch + efetch、抄録付き）。日本語クエリは Bedrock で英訳してから検索
- `POST /api/icf/future` — **ICF 50年後翻訳**。リクエスト: `{"text": "...", "title": "..."}`。レスポンス: `{plain_summary, who_benefits, domains{body_functions, activities, participation, environmental_factors, personal_factors}[{code,label,evidence,now,future}], day_in_2076, open_questions}`（`evidence` は入力文からの逐語引用。Jacobianレンズのハイライトに使用）
- `POST /api/icf/translate` — ICF 分類のみ。レスポンス: `{body_functions, activities, participation, environmental_factors, personal_factors, related_categories}`
- `GET /api/rmap/search?q=<クエリ>` — researchmap API プロキシ（`q` 以外のクエリパラメータはそのまま転送）
- `GET /api/amed/search?q=<クエリ>` — AMEDfind 取得。**`AmedSearchUrl` パラメータ設定までは 501 を返します**（後述）

AIへの指示文（プロンプト）は `backend/app.py` の `ICF_FUTURE_SYSTEM` / `QUERY_TRANSLATE_SYSTEM` にあります。
HTTP API 全体に 20 req/s（バースト40）のスロットリングを設定しています。

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
