import hashlib
import json
import logging
import os

import boto3
from botocore.config import Config

logger = logging.getLogger()
logger.setLevel(logging.INFO)

SYSTEM_PROMPT = (
    "あなたは文章の言い換え係です。与えられた「テンプレート文」を、意味を一切変えずに、"
    "自然で読みやすい日本語の1段落（120字以内）に言い換えてください。\n"
    "守ること：\n"
    "- 「目的は同じように達成される」という趣旨の文は必ず残す。\n"
    "- 誰が・何がその活動を担うか（人／ロボット／AIエージェント／本人）を変えない。\n"
    "- 良い・悪い・理想的・望ましいなどの評価語を加えない。\n"
    "- 未来を予測・断定する表現（「〜になります」「〜が普及します」）を加えない。"
    "「〜とします」「〜だとしたら」の仮定の形を保つ。\n"
    "- 健康状態や病名に触れない。\n"
    "- 出力は言い換え後の本文のみ。説明・前置き・引用符は不要。"
)

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "")
_MODEL_ID_HASH = hashlib.sha256(MODEL_ID.encode("utf-8")).hexdigest()[:8] if MODEL_ID else ""

_bedrock = boto3.client(
    "bedrock-runtime",
    config=Config(connect_timeout=3, read_timeout=3, retries={"max_attempts": 0}),
)

_RESPONSE_HEADERS = {"Content-Type": "application/json; charset=utf-8"}


def _fallback(status=200):
    return {
        "statusCode": status,
        "headers": _RESPONSE_HEADERS,
        "body": json.dumps({"text": None}),
    }


def handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except (TypeError, ValueError):
        logger.info("renderer request: invalid JSON body")
        return _fallback()

    activity = body.get("activity")
    archetype = body.get("archetype")
    template_text = body.get("template_text")

    if not isinstance(activity, str) or not isinstance(archetype, str) or not isinstance(template_text, str):
        logger.info("renderer request: missing/invalid fields")
        return _fallback()

    activity = activity[:200]
    archetype = archetype[:10]
    template_text = template_text[:600]

    if not MODEL_ID:
        logger.info("renderer request activity=%r archetype=%r: BEDROCK_MODEL_ID not set", activity, archetype)
        return _fallback()

    user_message = f"テンプレート文：{template_text}"

    try:
        resp = _bedrock.converse(
            modelId=MODEL_ID,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": [{"text": user_message}]}],
            inferenceConfig={"maxTokens": 200, "temperature": 0.3},
        )
    except Exception as exc:  # noqa: BLE001 - any Bedrock/timeout failure falls back silently
        logger.info(
            "renderer request activity=%r archetype=%r: bedrock call failed (%s)",
            activity, archetype, type(exc).__name__,
        )
        return _fallback()

    try:
        parts = resp["output"]["message"]["content"]
        text = "".join(p.get("text", "") for p in parts).strip()
    except (KeyError, IndexError, AttributeError):
        text = ""

    if not text:
        logger.info("renderer request activity=%r archetype=%r: empty response", activity, archetype)
        return _fallback()

    text = text[:400]
    logger.info(
        "renderer request activity=%r archetype=%r: response_len=%d",
        activity, archetype, len(text),
    )
    return {
        "statusCode": 200,
        "headers": _RESPONSE_HEADERS,
        "body": json.dumps({"text": text, "model_id_hash": _MODEL_ID_HASH}, ensure_ascii=False),
    }
