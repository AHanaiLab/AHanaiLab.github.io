"""絵(PNG) → Tripo で3Dモデル(GLB)を作り、受信箱に保存する非同期ワーカー。

ApiFunction から {"token": ..., "png_key": ...} で非同期に呼ばれる。
進捗は S3 の jobs/<token>.json に書き、/api/model/<token> が読む。
Tripo API を呼ぶのは tripo_* の3関数だけ。仕様が変わったらここだけ直す。
"""
import json
import os
import time
import urllib.error
import urllib.request
import uuid

import boto3

BUCKET = os.environ["INBOX_BUCKET"]
API_KEY = os.environ.get("TRIPO_API_KEY", "")
BASE = os.environ.get("TRIPO_API_BASE", "https://api.tripo3d.ai/v2/openapi").rstrip("/")

POLL_SECONDS = 5
DEADLINE_SECONDS = 780   # Lambda の 900 秒より手前で諦める

s3 = boto3.client("s3")


def _request(method, url, body=None, headers=None):
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"Bearer {API_KEY}")
    req.add_header("User-Agent", "oekaki-box/1.0")   # 既定の Python-urllib はWAFに弾かれやすい
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read()
    except urllib.error.HTTPError as e:   # 原因が分かるよう、応答本文をログに残す(キーは含まれない)
        raise RuntimeError(f"{method} {url} -> HTTP {e.code}: {e.read()[:500]!r}") from None


def tripo_upload(png: bytes) -> str:
    """画像を Tripo にアップロードして file_token を返す"""
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="drawing.png"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + png + f"\r\n--{boundary}--\r\n".encode()
    res = json.loads(_request("POST", f"{BASE}/upload", body,
                              {"Content-Type": f"multipart/form-data; boundary={boundary}"}))
    return res["data"]["image_token"]


def tripo_create_task(file_token: str) -> str:
    """image_to_model タスクを作って task_id を返す"""
    payload = json.dumps({"type": "image_to_model", "file": {"type": "png", "file_token": file_token}}).encode()
    res = json.loads(_request("POST", f"{BASE}/task", payload, {"Content-Type": "application/json"}))
    return res["data"]["task_id"]


def tripo_wait(task_id: str) -> bytes:
    """完了まで待って GLB のバイト列を返す。失敗・時間切れは例外"""
    end = time.time() + DEADLINE_SECONDS
    while time.time() < end:
        data = json.loads(_request("GET", f"{BASE}/task/{task_id}"))["data"]
        status = str(data.get("status", "")).lower()
        if status == "success":
            out = data.get("output") or {}
            url = out.get("pbr_model") or out.get("model") or out.get("base_model")
            if not url:
                raise RuntimeError("no model url in output")
            # 配布URLは短時間で失効するので、すぐ取得する
            with urllib.request.urlopen(url, timeout=120) as r:
                return r.read()
        if status in ("failed", "cancelled", "banned", "expired"):
            raise RuntimeError(f"tripo task {status}")
        time.sleep(POLL_SECONDS)
    raise TimeoutError("tripo task timed out")


def _write_job(token, **fields):
    s3.put_object(Bucket=BUCKET, Key=f"jobs/{token}.json",
                  Body=json.dumps(fields, ensure_ascii=False).encode(), ContentType="application/json")


def handler(event, _context):
    token, png_key = event["token"], event["png_key"]
    model_key = png_key.rsplit(".", 1)[0] + ".glb"
    try:
        _write_job(token, state="running")
        png = s3.get_object(Bucket=BUCKET, Key=png_key)["Body"].read()
        glb = tripo_wait(tripo_create_task(tripo_upload(png)))
        s3.put_object(Bucket=BUCKET, Key=model_key, Body=glb, ContentType="model/gltf-binary")
        _write_job(token, state="done", model_key=model_key)
    except Exception as e:  # 絵そのものは保存済み。3Dだけ失敗として記録する
        print("model generation failed:", repr(e))
        _write_job(token, state="failed")
