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
BASE = "https://openapi.tripo3d.com/v3"   # https://developers.tripo3d.com/en/docs/introduction

# image-to-model の指定(Unity/メタバース向け)。費用と重さを抑える設定
GEN_PARAMS = {
    "model": "v3.1-20260211",
    "texture": True,
    "pbr": False,          # 色テクスチャのみ(PBR 材質マップは作らない=消費クレジットを抑える)
    "face_limit": 30000,   # ポリゴン数の上限。メタバース向けに軽量化
}
FAILED_STATES = ("failed", "cancelled")   # 状態は queued / running / success / failed / cancelled

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


def _data(raw):
    """Tripo の共通応答 {"code": 0, "data": {...}} を検査して data を返す"""
    res = json.loads(raw)
    if res.get("code") != 0:
        raise RuntimeError(f"tripo error: {str(res)[:300]}")
    return res["data"]


def tripo_upload(png: bytes) -> str:
    """POST /files (multipart) で画像をアップロードして file_token を返す"""
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="drawing.png"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + png + f"\r\n--{boundary}--\r\n".encode()
    raw = _request("POST", f"{BASE}/files", body, {"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return _data(raw)["file_token"]


def tripo_create_task(file_token: str) -> str:
    """POST /generation/image-to-model でタスクを作って task_id を返す"""
    payload = json.dumps({"input": file_token, **GEN_PARAMS}).encode()
    raw = _request("POST", f"{BASE}/generation/image-to-model", payload, {"Content-Type": "application/json"})
    return _data(raw)["task_id"]


def tripo_wait(task_id: str) -> bytes:
    """完了まで待って GLB のバイト列を返す。失敗・時間切れは例外"""
    end = time.time() + DEADLINE_SECONDS
    while time.time() < end:
        data = _data(_request("GET", f"{BASE}/tasks/{task_id}"))   # GET /tasks/{task_id}
        status = str(data.get("status", "")).lower()
        if status == "success":
            url = (data.get("output") or {}).get("model_url")
            if not url:
                raise RuntimeError(f"no model_url in output: {str(data)[:300]}")
            # 配布URLは短時間で失効することがあるので、すぐ取得する
            req = urllib.request.Request(url, headers={"User-Agent": "oekaki-box/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        if status in FAILED_STATES:
            raise RuntimeError(f"tripo task {status}: code={data.get('error_code')} {data.get('error_message')}")
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
