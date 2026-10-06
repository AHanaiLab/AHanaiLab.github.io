"""お絵描き投稿 API: 受付期間の判定と、事務局用の非公開S3への保存のみ。

GET  /api/status  -> {"state": "before|open|closed", "open_from", "open_until", "now"}
POST /api/submit  -> {"image": "data:image/png;base64,...", "nickname": "", "message": "", "website": ""}
"""
import base64
import json
import os
import uuid
from datetime import datetime, timezone

import boto3

BUCKET = os.environ["INBOX_BUCKET"]
TOPIC_ARN = os.environ.get("NOTIFY_TOPIC_ARN", "")
OPEN_FROM = datetime.fromisoformat(os.environ["OPEN_FROM"])
OPEN_UNTIL = datetime.fromisoformat(os.environ["OPEN_UNTIL"])

MAX_PNG_BYTES = 3 * 1024 * 1024
MAX_NICKNAME = 40
MAX_MESSAGE = 500
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"

s3 = boto3.client("s3")
sns = boto3.client("sns")


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Cache-Control": "no-store"},
        "body": json.dumps(body, ensure_ascii=False),
    }


def _state(now):
    if now < OPEN_FROM:
        return "before"
    if now > OPEN_UNTIL:
        return "closed"
    return "open"


def _status():
    now = datetime.now(timezone.utc)
    return _resp(200, {
        "state": _state(now),
        "open_from": OPEN_FROM.isoformat(),
        "open_until": OPEN_UNTIL.isoformat(),
        "now": now.isoformat(),
    })


def _submit(event):
    now = datetime.now(timezone.utc)
    if _state(now) != "open":
        return _resp(403, {"error": "現在は受付期間外です"})

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _resp(400, {"error": "不正なリクエストです"})

    # ボット対策のハニーポット(人間には見えない入力欄)。埋まっていたら成功を装って捨てる
    if body.get("website"):
        return _resp(200, {"ok": True})

    image = body.get("image") or ""
    prefix = "data:image/png;base64,"
    if not image.startswith(prefix):
        return _resp(400, {"error": "PNG画像が必要です"})
    try:
        png = base64.b64decode(image[len(prefix):], validate=True)
    except ValueError:
        return _resp(400, {"error": "画像を読み取れませんでした"})
    if not png.startswith(PNG_MAGIC):
        return _resp(400, {"error": "PNG画像が必要です"})
    if len(png) > MAX_PNG_BYTES:
        return _resp(413, {"error": "画像が大きすぎます(3MBまで)"})

    nickname = str(body.get("nickname") or "").strip()[:MAX_NICKNAME]
    message = str(body.get("message") or "").strip()[:MAX_MESSAGE]

    sid = f"{now.strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    key = f"drawings/{now.strftime('%Y-%m-%d')}/{sid}"
    s3.put_object(Bucket=BUCKET, Key=f"{key}.png", Body=png, ContentType="image/png")
    s3.put_object(
        Bucket=BUCKET,
        Key=f"{key}.json",
        Body=json.dumps(
            {"id": sid, "submitted_at": now.isoformat(), "nickname": nickname, "message": message},
            ensure_ascii=False,
        ).encode("utf-8"),
        ContentType="application/json",
    )

    if TOPIC_ARN:
        try:
            sns.publish(
                TopicArn=TOPIC_ARN,
                Subject="お絵描きが届きました",
                Message=f"ID: {sid}\nニックネーム: {nickname or '(なし)'}\nメッセージ: {message or '(なし)'}\n\n"
                        f"s3://{BUCKET}/{key}.png",
            )
        except Exception:  # 通知失敗で投稿自体は失敗させない
            pass

    return _resp(200, {"ok": True})


def handler(event, _context):
    route = event.get("routeKey", "")
    if route == "GET /api/status":
        return _status()
    if route == "POST /api/submit":
        return _submit(event)
    return _resp(404, {"error": "not found"})
