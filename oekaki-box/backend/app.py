"""お絵描き投稿 API: 受付期間の判定と、事務局用の非公開S3への保存のみ。

POST /api/preview -> {"image": "data:image/png;base64,..."}  => {"token"}  (3Dプレビュー。事務局には送られない)
GET  /api/model/{token} -> {"state": "pending|running|done|failed", "url": "(done時のみ GLB の一時URL)"}
GET  /api/status  -> {"state": "before|open|closed", "open_from", "open_until", "now"}
POST /api/submit  -> {"image": "data:image/png;base64,...", "nickname": "", "message": "", "website": "", "preview_token": "(任意)"}
"""
import base64
import json
import re
import os
import uuid
from datetime import datetime, timedelta, timezone

import boto3
from botocore.config import Config

BUCKET = os.environ["INBOX_BUCKET"]
TOPIC_ARN = os.environ.get("NOTIFY_TOPIC_ARN", "")
OPEN_FROM = datetime.fromisoformat(os.environ["OPEN_FROM"])
OPEN_UNTIL = datetime.fromisoformat(os.environ["OPEN_UNTIL"])

MAX_PNG_BYTES = 3 * 1024 * 1024
MAX_NICKNAME = 40
MAX_MESSAGE = 500
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"

MODELS_ENABLED = os.environ.get("MODELS_ENABLED") == "1"
DAILY_MODEL_LIMIT = int(os.environ.get("DAILY_MODEL_LIMIT", "0"))
WORKER_FUNCTION = os.environ.get("WORKER_FUNCTION", "")
JST = timezone(timedelta(hours=9))
TOKEN_RE = re.compile(r"^[0-9a-f]{32}$")

s3 = boto3.client("s3", config=Config(signature_version="s3v4"))
sns = boto3.client("sns")
lam = boto3.client("lambda")


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


def _parse_png(body):
    """リクエストの data URL を検証して (png bytes, None) か (None, エラー応答) を返す"""
    image = body.get("image") or ""
    prefix = "data:image/png;base64,"
    if not image.startswith(prefix):
        return None, _resp(400, {"error": "PNG画像が必要です"})
    try:
        png = base64.b64decode(image[len(prefix):], validate=True)
    except ValueError:
        return None, _resp(400, {"error": "画像を読み取れませんでした"})
    if not png.startswith(PNG_MAGIC):
        return None, _resp(400, {"error": "PNG画像が必要です"})
    if len(png) > MAX_PNG_BYTES:
        return None, _resp(413, {"error": "画像が大きすぎます(3MBまで)"})
    return png, None


def _start_model_job(png, now):
    """3D生成を依頼する。戻り値は (状態, token)。上限超過・無効時は token=None"""
    if not MODELS_ENABLED:
        return "disabled", None
    day = now.astimezone(JST).strftime("%Y-%m-%d")
    used = s3.list_objects_v2(Bucket=BUCKET, Prefix=f"quota/{day}/", MaxKeys=DAILY_MODEL_LIMIT + 1)["KeyCount"]
    if used >= DAILY_MODEL_LIMIT:
        return "limit", None
    token = uuid.uuid4().hex   # 投稿者だけが知る閲覧用の鍵
    png_key = f"previews/{token}.png"
    s3.put_object(Bucket=BUCKET, Key=png_key, Body=png, ContentType="image/png")
    s3.put_object(Bucket=BUCKET, Key=f"quota/{day}/{token}", Body=b"")
    s3.put_object(Bucket=BUCKET, Key=f"jobs/{token}.json", Body=json.dumps({"state": "pending"}).encode())
    lam.invoke(FunctionName=WORKER_FUNCTION, InvocationType="Event",
               Payload=json.dumps({"token": token, "png_key": png_key}).encode())
    return "pending", token


def _preview(event):
    """3Dプレビュー用。事務局には送られず、Tripo にだけ送る。1回ごとに1日の上限を消費する"""
    now = datetime.now(timezone.utc)
    if _state(now) != "open":
        return _resp(403, {"error": "現在は受付期間外です"})
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _resp(400, {"error": "不正なリクエストです"})
    png, err = _parse_png(body)
    if err:
        return err
    state, token = _start_model_job(png, now)
    if state == "disabled":
        return _resp(503, {"error": "3Dプレビューは現在使えません"})
    if state == "limit":
        return _resp(429, {"error": "本日の3D生成は上限に達しました。絵だけ送ることはできます"})
    return _resp(200, {"ok": True, "token": token})


def _attach_model(token, png, key):
    """プレビューで確認済みの3Dを、同じ絵のときだけ投稿に添付する。添付したら True"""
    if not TOKEN_RE.match(token or ""):
        return False
    try:
        job = json.loads(s3.get_object(Bucket=BUCKET, Key=f"jobs/{token}.json")["Body"].read())
        if job.get("state") != "done":
            return False
        prev = s3.get_object(Bucket=BUCKET, Key=f"previews/{token}.png")["Body"].read()
    except s3.exceptions.NoSuchKey:
        return False
    if prev != png:   # プレビュー後に絵を変えていたら添付しない
        return False
    s3.copy_object(Bucket=BUCKET, Key=f"{key}.glb", CopySource={"Bucket": BUCKET, "Key": job["model_key"]},
                   ContentType="model/gltf-binary", MetadataDirective="REPLACE")
    return True


def _model(token):
    if not TOKEN_RE.match(token or ""):
        return _resp(404, {"error": "not found"})
    try:
        job = json.loads(s3.get_object(Bucket=BUCKET, Key=f"jobs/{token}.json")["Body"].read())
    except s3.exceptions.NoSuchKey:
        return _resp(404, {"error": "not found"})
    out = {"state": job.get("state", "pending")}
    if out["state"] == "done":
        out["url"] = s3.generate_presigned_url(
            "get_object", Params={"Bucket": BUCKET, "Key": job["model_key"]}, ExpiresIn=900)
    return _resp(200, out)


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

    png, err = _parse_png(body)
    if err:
        return err

    nickname = str(body.get("nickname") or "").strip()[:MAX_NICKNAME]
    message = str(body.get("message") or "").strip()[:MAX_MESSAGE]

    sid = f"{now.strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    key = f"drawings/{now.strftime('%Y-%m-%d')}/{sid}"
    s3.put_object(Bucket=BUCKET, Key=f"{key}.png", Body=png, ContentType="image/png")
    has_model = _attach_model(body.get("preview_token"), png, key)
    s3.put_object(
        Bucket=BUCKET,
        Key=f"{key}.json",
        Body=json.dumps(
            {"id": sid, "submitted_at": now.isoformat(), "nickname": nickname, "message": message,
             "has_3d_model": has_model},
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

    return _resp(200, {"ok": True, "model": has_model})


def handler(event, _context):
    route = event.get("routeKey", "")
    if route == "GET /api/status":
        return _status()
    if route == "POST /api/submit":
        return _submit(event)
    if route == "POST /api/preview":
        return _preview(event)
    if route == "GET /api/model/{token}":
        return _model((event.get("pathParameters") or {}).get("token"))
    return _resp(404, {"error": "not found"})
