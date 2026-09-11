"""SAQRA 研究翻訳ポータル バックエンド API (FastAPI + Mangum on AWS Lambda)。

エンドポイント:
  POST /api/icf/dialogue       対話型ICF分類（ICF-QOL Translator）: 自由記述 → ICF仮分類/マージ → 充足度 → 次の質問
  POST /api/icf/future         Stage 3: 確定したICFプロファイル → 50年後QOL変換
  POST /api/icf/translate      テキスト（論文抄録など）→ ICF分類のみ
  GET  /api/pubmed/search?q=   PubMed 検索（日本語は Bedrock で英語クエリに変換、抄録付き）
  GET  /api/rmap/search?q=     researchmap プロキシ
  GET  /api/amed/search?q=     AMEDfind 取得 (AMED_SEARCH_URL で設定)

設計: 「対話型ICF分類 設計 v0.3」に準拠。
  - 充足度判定は LLM ではなく Python のルールベース（§2）
  - 質問生成はハイブリッド（§3.3）: 分類/マージと同じ LLM 呼び出しで next_question を出させ、
    失敗時はカテゴリ別テンプレート（§7）にフォールバック。1ターン = LLM 1回
  - 打ち切り: 全カテゴリ充足 / ユーザー明示 / 最大5ターン / 確定ボタン（§8）
  - Lambda はステートレス。ICFプロファイルとターン数はクライアントが保持して毎回送る
"""

import json
import os
import re
import xml.etree.ElementTree as ET
from functools import lru_cache
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from mangum import Mangum
from pydantic import BaseModel

app = FastAPI(title="SAQRA Research Portal API")

HTTP_TIMEOUT = httpx.Timeout(20.0)

PUBMED_EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
RMAP_BASE_URL = os.environ.get("RMAP_BASE_URL", "https://api.researchmap.jp")
# AMEDfind の実エンドポイントは DevTools の Network タブで確認して環境変数で設定する
AMED_SEARCH_URL = os.environ.get("AMED_SEARCH_URL", "")
AMED_QUERY_PARAM = os.environ.get("AMED_QUERY_PARAM", "keyword")
# Bedrock のモデル選択:
#   1. 環境変数 BEDROCK_MODEL_ID（カンマ区切りで複数可）を優先順に試す
#   2. 次に DEFAULT_MODEL_CANDIDATES を試す
#   3. それでも駄目なら ListInferenceProfiles / ListFoundationModels で当リージョンの
#      Anthropic モデルを自動検出して試す（Legacy 指定でアクセス不可になったモデルを避けるため）
#   成功したモデルは Lambda の実行環境が生きている間キャッシュされる
BEDROCK_MODEL_IDS = [
    m.strip() for m in os.environ.get("BEDROCK_MODEL_ID", "").split(",") if m.strip() and m.strip().lower() != "auto"
]
# 2026-09 時点で ap-northeast-1 の ListInferenceProfiles に実在したIDから、国内推論(jp.)と新しさを優先
DEFAULT_MODEL_CANDIDATES = [
    "jp.anthropic.claude-sonnet-4-6",
    "global.anthropic.claude-sonnet-5",
    "global.anthropic.claude-sonnet-4-6",
    "jp.anthropic.claude-sonnet-4-5-20250929-v1:0",
    "global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    "jp.anthropic.claude-haiku-4-5-20251001-v1:0",
    "global.anthropic.claude-haiku-4-5-20251001-v1:0",
]
_MODEL_STATE: dict[str, Any] = {"resolved": None, "discovered": None, "attempts": []}
NCBI_API_KEY = os.environ.get("NCBI_API_KEY", "")
MAX_TURNS = 5

JAPANESE_RE = re.compile(r"[぀-ヿ㐀-䶿一-鿿]")
ENOUGH_RE = re.compile(r"(もう(大丈夫|十分|いい|結構)|これで(確定|十分|大丈夫|お願い|OK|ok)|確定して|十分です|以上です)")


# ---------------------------------------------------------------- 共通ヘルパー

async def _fetch(client: httpx.AsyncClient, url: str, params: dict, upstream: str) -> httpx.Response:
    """上流APIを呼び出し、通信エラー・4xx/5xxを502に変換して返す。"""
    try:
        r = await client.get(url, params=params)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"{upstream} request failed: {e}")
    if r.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"{upstream} error {r.status_code}: {r.text[:500]}")
    return r


@lru_cache(maxsize=1)
def _bedrock_client():
    from anthropic import AnthropicBedrock

    return AnthropicBedrock(aws_region=_bedrock_region())


def _bedrock_region() -> str:
    return os.environ.get("BEDROCK_REGION") or os.environ.get("AWS_REGION", "ap-northeast-1")


def _model_rank(model_id: str) -> tuple:
    """新しく・賢く・地域が近いものを先に。(日付降順, sonnet>opus>haiku, jp>apac>global>その他)"""
    m = re.search(r"(20\d{6})", model_id)
    date = int(m.group(1)) if m else 0
    family = 0 if "sonnet" in model_id else 1 if "opus" in model_id else 2 if "haiku" in model_id else 3
    scope = 0 if model_id.startswith("jp.") else 1 if model_id.startswith("apac.") else 2 if model_id.startswith("global.") else 3
    return (-date, family, scope)


def _discover_models() -> list[str]:
    """当リージョンで呼べる Anthropic のクロスリージョン推論プロファイル / 基盤モデルを列挙する。"""
    if _MODEL_STATE["discovered"] is not None:
        return _MODEL_STATE["discovered"]
    found: list[str] = []
    try:
        import boto3

        br = boto3.client("bedrock", region_name=_bedrock_region())
        legacy_arns: set[str] = set()
        try:
            for fm in br.list_foundation_models(byProvider="anthropic").get("modelSummaries", []):
                if (fm.get("modelLifecycle") or {}).get("status", "ACTIVE") != "ACTIVE":
                    legacy_arns.add(fm.get("modelArn", ""))
                elif "ON_DEMAND" in (fm.get("inferenceTypesSupported") or []):
                    found.append(fm["modelId"])
        except Exception:
            pass
        try:
            paginator = br.get_paginator("list_inference_profiles")
            for page in paginator.paginate(typeEquals="SYSTEM_DEFINED"):
                for ip in page.get("inferenceProfileSummaries", []):
                    pid = ip.get("inferenceProfileId", "")
                    if "anthropic" not in pid or ip.get("status", "ACTIVE") != "ACTIVE":
                        continue
                    if any(m.get("modelArn", "") in legacy_arns for m in ip.get("models", [])):
                        continue
                    found.append(pid)
        except Exception:
            pass
    except Exception:
        pass
    found = sorted(set(found), key=_model_rank)
    _MODEL_STATE["discovered"] = found
    return found


def _candidate_models() -> list[str]:
    seen: list[str] = []
    for m in ([_MODEL_STATE["resolved"]] if _MODEL_STATE["resolved"] else []) + BEDROCK_MODEL_IDS + DEFAULT_MODEL_CANDIDATES + _discover_models():
        if m and m not in seen:
            seen.append(m)
    return seen


def _ask_claude(system: str, user: str, max_tokens: int) -> str:
    """Bedrock 上の Claude に問い合わせ、テキストを返す。使えないモデルは飛ばして次の候補を試す。失敗は502。"""
    from anthropic import APIStatusError

    errors: list[str] = []
    for model in _candidate_models():
        try:
            response = _bedrock_client().messages.create(
                model=model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
        except APIStatusError as e:
            # 400: 無効なID / 403: アクセス未許可 / 404: Legacy などモデル側の理由は次の候補へ
            if e.status_code in (400, 403, 404):
                errors.append(f"{model}: {str(e)[:160]}")
                _MODEL_STATE["attempts"] = errors[-10:]
                if _MODEL_STATE["resolved"] == model:
                    _MODEL_STATE["resolved"] = None
                continue
            raise HTTPException(status_code=502, detail=f"Bedrock invocation failed ({model}): {e}")
        except Exception as e:  # ネットワーク等
            raise HTTPException(status_code=502, detail=f"Bedrock invocation failed ({model}): {e}")
        _MODEL_STATE["resolved"] = model
        return "".join(b.text for b in response.content if b.type == "text")
    raise HTTPException(
        status_code=502,
        detail="No usable Bedrock model. Tried: " + " | ".join(errors[-6:]) + " — set BEDROCK_MODEL_ID to an active model in this region.",
    )


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object in model output")
    return json.loads(text[start : end + 1])


def _ask_claude_json(system: str, user: str, max_tokens: int) -> dict:
    raw = _ask_claude(system, user, max_tokens)
    try:
        return _extract_json(raw)
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail=f"model returned non-JSON output: {raw[:500]}")


# ---------------------------------------------------------------- ヘルスチェック

@app.get("/")
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "saqra-portal-api",
        "model": _MODEL_STATE["resolved"] or "(unresolved: first call will pick one)",
        "region": _bedrock_region(),
    }


@app.get("/api/models")
def models(check: bool = Query(False)):
    """候補モデルと当リージョンで検出したモデルを返す。check=1 で実際に1回呼んで使えるものを確定する。"""
    out = {
        "configured": BEDROCK_MODEL_IDS,
        "defaults": DEFAULT_MODEL_CANDIDATES,
        "discovered_in_region": _discover_models(),
        "resolved": _MODEL_STATE["resolved"],
        "last_errors": _MODEL_STATE["attempts"],
    }
    if check:
        try:
            _ask_claude("Reply with the single word OK.", "ping", max_tokens=5)
            out["resolved"] = _MODEL_STATE["resolved"]
            out["check"] = "ok"
        except HTTPException as e:
            out["check"] = e.detail
        out["last_errors"] = _MODEL_STATE["attempts"]
    return out


# ================================================================ 対話型ICF分類（ICF-QOL Translator）

ICF_SCHEMA = """{
  "health_condition": {"description": "病名・治療状況（不明なら空文字）"},
  "body_functions": [{"code": "b280", "label": "痛みの感覚", "qualifier": 2, "evidence": "根拠"}],
  "body_structures": [{"code": "s540", "label": "腸の構造", "qualifier": 2, "evidence": "根拠"}],
  "activities_participation": [{"code": "d450", "label": "歩行", "qualifier": 3, "evidence": "根拠"}],
  "environmental_factors": [{"code": "e310", "label": "家族", "qualifier": "+3", "evidence": "根拠"}],
  "personal_factors": [{"label": "営業職", "evidence": "根拠"}]
}"""

ICF_RULES = """ICFの規則:
- code は ICF 第2レベル以上の公式コード。label は日本語の公式名称に近い短い名称。
- qualifier: b/s/d は 0(問題なし)〜4(完全な問題) の整数。e は促進因子なら "+1"〜"+4"、阻害因子なら "-1"〜"-4" の文字列。
- 個人因子は code なし。
- 本人の記述にある情報だけを分類し、推測で増やさない。ただし身体構造(s)は健康状態から自然に推定できる範囲で1〜2件まで可。
- 各カテゴリは最大5件。"""

ICF_PARSE_SYSTEM = f"""あなたはICF（国際生活機能分類, WHO 2001）に詳しい作業療法士で、対象者に優しく質問するインタビュアーです。
本人（がんを経験した人やその家族など）の自由記述を読み、ICFに仮分類してください。

{ICF_RULES}

出力は次のJSONのみ（前後に説明やコードフェンスを付けない）:
{{
  "icf": {ICF_SCHEMA},
  "ack": "分類の前に添える、共感を含む一言（1文、やさしい日本語）",
  "next_question": "まだ情報がないカテゴリのうち優先度の高いもの（活動・参加 > 心身機能 > 環境因子 > 個人因子 > 健康状態）について、日常会話のような自然な日本語で、専門用語（ICFコードなど）を使わず、具体例を添えて2〜3文以内で質問。既に得ている情報と重複しない。すべて揃っていれば空文字"
}}"""

ICF_MERGE_SYSTEM = f"""あなたはICF（国際生活機能分類）の専門家で、対象者に優しく質問するインタビュアーです。
【既存のICF分類結果】に【ユーザーの追加回答】の内容を統合してください。
- 新しい情報は適切なカテゴリに追加する
- 既存の情報と矛盾する場合は追加回答を優先する
- 変更のないカテゴリはそのまま維持する（削除しない）
- 必ず完全なICF構造を出力する（省略不可）

{ICF_RULES}

出力は次のJSONのみ（前後に説明やコードフェンスを付けない）:
{{
  "icf": {ICF_SCHEMA},
  "ack": "追加回答への短い応答（1文、やさしい日本語）",
  "next_question": "まだ情報がないカテゴリのうち優先度の高いもの（活動・参加 > 心身機能 > 環境因子 > 個人因子 > 健康状態）について、自然な日本語で専門用語を使わず具体例を添えて2〜3文以内で質問。既に得ている情報と重複しない。すべて揃っていれば空文字"
}}"""

# §7 カテゴリ別質問テンプレート（方式A・フォールバック）
QUESTION_TEMPLATES = {
    "activities_participation": "日常生活で以前より難しくなったことはありますか？（例: 歩く、料理、買い物、仕事、趣味、人との交流など）",
    "body_functions": "身体や心の機能で困っていることはありますか？（例: 痛み、疲れ、気分の落ち込み、眠れない、集中できないなど）",
    "environmental_factors": "助けになっている人やサービス、逆に不便に感じている環境はありますか？（例: 家族の支え、医療費の制度、家の段差、職場の理解など）",
    "personal_factors": "ご自身のことを教えてください。（例: お仕事、趣味、性格、大切にしていること、病気への向き合い方）",
    "health_condition": "どのような病気や障害をお持ちですか？ 診断名や現在の治療があれば教えてください。",
}

CATEGORY_LABELS = {
    "health_condition": "健康状態",
    "body_functions": "心身機能 (b)",
    "body_structures": "身体構造 (s)",
    "activities_participation": "活動・参加 (d)",
    "environmental_factors": "環境因子 (e)",
    "personal_factors": "個人因子",
}
LIST_CATEGORIES = ["body_functions", "body_structures", "activities_participation", "environmental_factors", "personal_factors"]


def normalize_icf(icf: Any) -> dict:
    """LLM出力/クライアント送信のICFを安全な形に整える。"""
    icf = icf if isinstance(icf, dict) else {}
    hc = icf.get("health_condition")
    out: dict[str, Any] = {
        "health_condition": {"description": str((hc or {}).get("description", "") if isinstance(hc, dict) else (hc or "")).strip()}
    }
    for key in LIST_CATEGORIES:
        items = icf.get(key) or []
        clean = []
        for it in items if isinstance(items, list) else []:
            if not isinstance(it, dict):
                continue
            label = str(it.get("label", "")).strip()
            if not label:
                continue
            entry = {"label": label}
            if it.get("code"):
                entry["code"] = str(it["code"]).strip()
            if it.get("qualifier") not in (None, ""):
                entry["qualifier"] = it["qualifier"]
            if it.get("evidence"):
                entry["evidence"] = str(it["evidence"])[:200]
            clean.append(entry)
        out[key] = clean[:5]
    return out


def assess_completeness(icf: dict) -> dict:
    """§2 ICFプロファイルの充足度をルールベースで評価する。"""
    categories = {
        "health_condition": {"filled": bool(icf.get("health_condition", {}).get("description")), "askable": True, "priority": 5},
        "body_functions": {"filled": len(icf.get("body_functions", [])) > 0, "askable": True, "priority": 2},
        "body_structures": {"filled": len(icf.get("body_structures", [])) > 0, "askable": False, "priority": 6},
        "activities_participation": {"filled": len(icf.get("activities_participation", [])) > 0, "askable": True, "priority": 1},
        "environmental_factors": {"filled": len(icf.get("environmental_factors", [])) > 0, "askable": True, "priority": 3},
        "personal_factors": {"filled": len(icf.get("personal_factors", [])) > 0, "askable": True, "priority": 4},
    }
    missing = sorted(
        (k for k, v in categories.items() if not v["filled"] and v["askable"]),
        key=lambda k: categories[k]["priority"],
    )
    return {
        "categories": {k: {"label": CATEGORY_LABELS[k], "filled": v["filled"], "askable": v["askable"]} for k, v in categories.items()},
        "missing": missing,
        "all_filled": len(missing) == 0,
        "completeness_pct": round(sum(1 for v in categories.values() if v["filled"]) / 6 * 100),
    }


def _diff_updates(before: dict, after: dict) -> list[dict]:
    """マージ前後の差分（チャットに「環境因子 +2件」と表示するため）。"""
    updates = []
    if after["health_condition"]["description"] and after["health_condition"]["description"] != before.get("health_condition", {}).get("description", ""):
        updates.append({"category": "health_condition", "label": CATEGORY_LABELS["health_condition"], "items": [{"label": after["health_condition"]["description"]}]})
    for key in LIST_CATEGORIES:
        seen = {(it.get("code"), it["label"]) for it in before.get(key, [])}
        new = [it for it in after.get(key, []) if (it.get("code"), it["label"]) not in seen]
        if new:
            updates.append({"category": key, "label": CATEGORY_LABELS[key], "items": new})
    return updates


class DialogueRequest(BaseModel):
    message: str
    icf: dict | None = None
    turn: int = 0


@app.post("/api/icf/dialogue")
def icf_dialogue(req: DialogueRequest):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    before = normalize_icf(req.icf)
    has_profile = any(before[k] for k in LIST_CATEGORIES) or bool(before["health_condition"]["description"])
    turn = req.turn + 1

    # §8 ユーザー明示の打ち切り（LLMを呼ばずに確定へ）
    if has_profile and ENOUGH_RE.search(message):
        assessment = assess_completeness(before)
        return {
            "icf": before, "assessment": assessment, "updates": [], "turn": turn, "phase": "confirming",
            "reply": "承知しました。ここまでの内容でICFプロファイルをまとめます。「50年後のQOLを表示」を押すと、テクノロジーの進化に応じた2076年の暮らしを描きます。",
        }

    if not has_profile:
        out = _ask_claude_json(ICF_PARSE_SYSTEM, message[:6000], max_tokens=1800)
    else:
        user = f"【既存のICF分類結果】\n{json.dumps(before, ensure_ascii=False)}\n\n【ユーザーの追加回答】\n{message[:4000]}"
        out = _ask_claude_json(ICF_MERGE_SYSTEM, user, max_tokens=1800)

    after = normalize_icf(out.get("icf"))
    assessment = assess_completeness(after)
    updates = _diff_updates(before, after)
    ack = str(out.get("ack", "")).strip()

    if assessment["all_filled"] or turn >= MAX_TURNS:
        phase = "confirming"
        tail = "ICFプロファイルが揃いました。「50年後のQOLを表示」を押すと、テクノロジーの進化に応じた2076年の暮らしを描きます。" if assessment["all_filled"] \
            else "ここまでで一度まとめましょう。「50年後のQOLを表示」を押すか、「もう少し追加する」で続けることもできます。"
        question = ""
    else:
        phase = "collecting"
        question = str(out.get("next_question", "")).strip() or QUESTION_TEMPLATES[assessment["missing"][0]]
        tail = question

    return {
        "icf": after, "assessment": assessment, "updates": updates, "turn": turn, "phase": phase,
        "reply": (ack + "\n\n" if ack else "") + tail, "question": question,
    }


# ================================================================ Stage 3: 50年後QOL変換

FUTURE_TRANSFORM_SYSTEM = """あなたは、がんサバイバーシップ研究・医療技術・社会デザインに詳しい専門家です。
ICFプロファイル（本人の現在の生活機能）を受け取り、「テクノロジーの進化に応じた50年後（2076年）、この人と同じ状況にある人のQOL（生活の質）はどうなっているか」を描いてください。
テクノロジーの進化とは: 診断・治療技術（低侵襲治療、副作用の少ない薬、個別化医療）、体調のモニタリングと予測（ウェアラブル、AI）、
移動・仕事・家事を支える機器やロボット、遠隔医療・オンラインの相談、制度や職場のデジタル化などを指します。各カテゴリの future では、どの進化が効いているかを具体的に含めてください。

方針:
- 中学生にも分かるやさしい日本語。専門用語やICFコードは本文に出さない。
- 断定や誇張はしない。「〜かもしれない」「〜が当たり前になっている」など、希望の方向を示す書き方。
- 医療上の判断を促す表現はしない。
- ICFプロファイルの「いま」を具体的に踏まえ、各カテゴリで「いま → 50年後」を対にする。
- 環境因子は、制度・道具・まわりの人の変化として描く。個人因子は、その人らしさが活きる形で描く（性格を変えない）。
- research_needed は、この未来に近づくために必要な研究テーマ（研究開発マップへの入力になる）。
- search_keywords_en は、関連する研究を PubMed で探すための英語キーワード（3〜6語句）。
- 【長さの上限・厳守】headline 20字以内 / qol_now・qol_2076 各1〜2文（80字以内）/ categories の now・future 各50字以内、
  enabled_by 40字以内 / day_in_2076 は3文（150字以内）/ research_needed 各20字以内。全体で簡潔に。

出力は次のJSONのみ（前後に説明やコードフェンスを付けない）:
{
  "headline": "50年後の暮らしを一言で（20字程度）",
  "qol_now": "いまのQOLを2文で",
  "qol_2076": "50年後のQOLを2文で",
  "categories": [
    {"key": "health_condition", "label": "健康状態", "now": "…", "future": "…", "enabled_by": "そうなる技術・変化（研究・医療技術・機器・制度）"},
    {"key": "body_functions", "label": "心身機能", "now": "…", "future": "…", "enabled_by": "…"},
    {"key": "activities_participation", "label": "活動・参加", "now": "…", "future": "…", "enabled_by": "…"},
    {"key": "environmental_factors", "label": "環境因子", "now": "…", "future": "…", "enabled_by": "…"},
    {"key": "personal_factors", "label": "個人因子", "now": "…", "future": "…", "enabled_by": "…"}
  ],
  "day_in_2076": "2076年のある一日を、本人の目線で3文の物語として（進化したテクノロジーが暮らしに溶け込んでいる様子を含める）",
  "research_needed": ["必要な研究テーマ（短く、1〜4個）"],
  "search_keywords_en": ["cancer survivors", "..."]
}
情報が無いカテゴリは now を「（情報なし）」とし、future は一般的な見通しを短く書く。"""


class FutureRequest(BaseModel):
    icf: dict


@app.post("/api/icf/future")
def icf_future(req: FutureRequest):
    icf = normalize_icf(req.icf)
    if not any(icf[k] for k in LIST_CATEGORIES) and not icf["health_condition"]["description"]:
        raise HTTPException(status_code=400, detail="icf profile is empty")
    parsed = _ask_claude_json(FUTURE_TRANSFORM_SYSTEM, json.dumps(icf, ensure_ascii=False), max_tokens=1400)
    cats = parsed.get("categories") or []
    return {
        "headline": str(parsed.get("headline", "")),
        "qol_now": str(parsed.get("qol_now", "")),
        "qol_2076": str(parsed.get("qol_2076", "")),
        "categories": [c for c in cats if isinstance(c, dict) and c.get("label")],
        "day_in_2076": str(parsed.get("day_in_2076", "")),
        "research_needed": [str(x) for x in (parsed.get("research_needed") or [])][:4],
        "search_keywords_en": [str(x) for x in (parsed.get("search_keywords_en") or [])][:6],
        "icf": icf,
    }


# ================================================================ ICF 分類のみ（論文抄録など）

class ICFRequest(BaseModel):
    text: str
    title: str | None = None


ICF_SYSTEM = """あなたはICF（国際生活機能分類, WHO 2001）の分類専門家です。
入力された日本語または英語のテキスト（研究論文の抄録、症状・生活状況の記述など）を読み、
関連するICFカテゴリへ分類してください。出力は日本語。

必ず次のJSONオブジェクトのみを出力してください（前後に説明文やコードフェンスを付けない）:
{
  "summary": "このテキストが扱っている生活機能の問題を1〜2文で（やさしい日本語）",
  "body_functions": [{"code": "b***", "label": "名称", "evidence": "根拠となる記述"}],
  "body_structures": [{"code": "s***", "label": "名称", "evidence": "根拠となる記述"}],
  "activities_participation": [{"code": "d***", "label": "名称", "evidence": "根拠となる記述"}],
  "environmental_factors": [{"code": "e***", "label": "名称", "evidence": "根拠となる記述"}],
  "personal_factors": [{"label": "内容", "evidence": "根拠となる記述"}]
}
該当がないカテゴリは空配列。codeはICF公式コード（第2レベル以上）。各カテゴリ最大4件。"""


@app.post("/api/icf/translate")
def icf_translate(req: ICFRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    user = f"題名: {req.title}\n\n{req.text}" if req.title else req.text
    parsed = _ask_claude_json(ICF_SYSTEM, user[:12000], max_tokens=1600)
    keys = ["body_functions", "body_structures", "activities_participation", "environmental_factors", "personal_factors"]
    return {"summary": str(parsed.get("summary", "")), **{k: parsed.get(k, []) or [] for k in keys}}


# ================================================================ PubMed

QUERY_TRANSLATE_SYSTEM = """You convert a Japanese search request from a cancer survivor, family member,
or clinician into a concise English PubMed search query.
Rules: output ONLY the query string, no explanation. Use plain English terms joined with AND / OR,
2 to 6 terms, prefer MeSH-like vocabulary (e.g. "cancer survivors", "return to work", "fatigue").
Do not add quotation marks unless a phrase must stay together."""


def _to_english_query(q: str) -> str:
    return _ask_claude(QUERY_TRANSLATE_SYSTEM, q, max_tokens=80).strip().strip('"')


def _parse_efetch(xml_text: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    results = []
    for art in root.findall(".//PubmedArticle"):
        pmid = (art.findtext("./MedlineCitation/PMID") or "").strip()
        article = art.find("./MedlineCitation/Article")
        if article is None:
            continue
        title_el = article.find("./ArticleTitle")
        title = "".join(title_el.itertext()).strip() if title_el is not None else ""
        abstract_parts = []
        for ab in article.findall("./Abstract/AbstractText"):
            label = ab.get("Label")
            text = "".join(ab.itertext()).strip()
            if text:
                abstract_parts.append(f"{label}: {text}" if label else text)
        authors = []
        for au in article.findall("./AuthorList/Author"):
            last, initials, collective = au.findtext("LastName"), au.findtext("Initials"), au.findtext("CollectiveName")
            if last:
                authors.append(f"{last} {initials or ''}".strip())
            elif collective:
                authors.append(collective)
        journal = article.findtext("./Journal/Title") or article.findtext("./Journal/ISOAbbreviation") or ""
        pubdate = article.findtext("./Journal/JournalIssue/PubDate/Year") or article.findtext(
            "./Journal/JournalIssue/PubDate/MedlineDate"
        ) or ""
        doi = None
        for aid in art.findall("./PubmedData/ArticleIdList/ArticleId"):
            if aid.get("IdType") == "doi":
                doi = (aid.text or "").strip()
        results.append(
            {
                "pmid": pmid,
                "title": title,
                "abstract": "\n".join(abstract_parts),
                "authors": authors,
                "source": journal,
                "pubdate": pubdate,
                "doi": doi,
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            }
        )
    return results


@app.get("/api/pubmed/search")
async def pubmed_search(
    q: str = Query(..., min_length=1),
    retmax: int = Query(10, ge=1, le=50),
):
    query_en = _to_english_query(q) if JAPANESE_RE.search(q) else q

    common = {"db": "pubmed", "tool": "saqra-portal"}
    if NCBI_API_KEY:
        common["api_key"] = NCBI_API_KEY

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        es = await _fetch(
            client,
            f"{PUBMED_EUTILS}/esearch.fcgi",
            {**common, "retmode": "json", "term": query_en, "retmax": retmax, "sort": "relevance"},
            "PubMed esearch",
        )
        esearch = es.json().get("esearchresult", {})
        ids = esearch.get("idlist", [])
        total = int(esearch.get("count", 0))
        if not ids:
            return {"query": q, "query_en": query_en, "total": 0, "results": []}

        ef = await _fetch(
            client,
            f"{PUBMED_EUTILS}/efetch.fcgi",
            {**common, "retmode": "xml", "id": ",".join(ids)},
            "PubMed efetch",
        )

    try:
        results = _parse_efetch(ef.text)
    except ET.ParseError as e:
        raise HTTPException(status_code=502, detail=f"PubMed efetch returned invalid XML: {e}")
    order = {pmid: i for i, pmid in enumerate(ids)}
    results.sort(key=lambda r: order.get(r["pmid"], 999))
    return {"query": q, "query_en": query_en, "total": total, "results": results}


# ================================================================ researchmap / AMED

@app.get("/api/rmap/search")
async def rmap_search(request: Request, q: str = Query(..., min_length=1)):
    # researchmap API v2 の研究者検索をプロキシする。q 以外のクエリはそのまま転送。
    params = {k: v for k, v in request.query_params.items() if k != "q"}
    params["query"] = q
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        r = await _fetch(client, f"{RMAP_BASE_URL}/researchers", params, "researchmap")
    return r.json()


@app.get("/api/amed/search")
async def amed_search(request: Request, q: str = Query(..., min_length=1)):
    if not AMED_SEARCH_URL:
        raise HTTPException(
            status_code=501,
            detail=(
                "AMED_SEARCH_URL が未設定です。AMEDfind の検索XHRを DevTools で確認し、"
                "template.yaml の AmedSearchUrl パラメータに設定して再デプロイしてください。"
            ),
        )
    params = {k: v for k, v in request.query_params.items() if k != "q"}
    params[AMED_QUERY_PARAM] = q
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        r = await _fetch(client, AMED_SEARCH_URL, params, "AMED")
    try:
        return r.json()
    except ValueError:
        return {"raw": r.text}


handler = Mangum(app)
