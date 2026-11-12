"""30分ごとの自己点検。問題があればメール(SNS)で知らせ、直ったときにも知らせる。

点検するもの:
  - Tripo のキーが有効か / クレジットが残っているか (キーを設定しているときだけ)
  - 受付用 API が 5xx を返していないか
同じ問題は、6時間に1回までしか知らせない(メールの連発を防ぐ)。受付終了の1日後からは何もしない。
"""
import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta

import boto3

BUCKET = os.environ["INBOX_BUCKET"]
TOPIC_ARN = os.environ["NOTIFY_TOPIC_ARN"]
API_KEY = os.environ.get("TRIPO_API_KEY", "")
BASE = os.environ.get("TRIPO_API_BASE", "").rstrip("/")
API_URL = os.environ.get("API_URL", "")
MIN_CREDITS = float(os.environ.get("MIN_CREDITS", "500"))
OPEN_UNTIL = datetime.fromisoformat(os.environ["OPEN_UNTIL"])

STATE_KEY = "monitor/last_alert.json"
REPEAT_SECONDS = 6 * 3600

s3 = boto3.client("s3")
sns = boto3.client("sns")


def _get(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": "oekaki-box-monitor/1.0", **(headers or {})})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status, r.read()


def find_problems():
    problems = []
    if API_KEY and BASE:
        try:
            _, raw = _get(f"{BASE}/account/balance", {"Authorization": f"Bearer {API_KEY}"})
            res = json.loads(raw)
            if res.get("code") != 0:
                problems.append(f"Tripoのキーが認められません: {str(res)[:120]}")
            elif float(res["data"]["balance"]) < MIN_CREDITS:
                problems.append(f"Tripoのクレジットが少なくなっています(残り {res['data']['balance']}、基準 {MIN_CREDITS:g})")
        except urllib.error.HTTPError as e:
            problems.append(f"Tripoのキーが認められません(HTTP {e.code})")
        except Exception:
            pass   # 一時的な通信の乱れは、問題にしない
    if API_URL:
        try:
            _get(API_URL)
        except urllib.error.HTTPError as e:
            if e.code >= 500:
                problems.append(f"受付用APIがエラーを返しています(HTTP {e.code})")
        except Exception:
            pass
    return problems


def _load_state():
    try:
        return json.loads(s3.get_object(Bucket=BUCKET, Key=STATE_KEY)["Body"].read())
    except s3.exceptions.NoSuchKey:
        return None


def _notify(subject, lines):
    sns.publish(TopicArn=TOPIC_ARN, Subject=subject[:100], Message="\n".join(lines))


def handler(_event=None, _context=None):
    if datetime.now(OPEN_UNTIL.tzinfo) > OPEN_UNTIL + timedelta(days=1):
        return {"skipped": "受付終了後"}
    problems = find_problems()
    state = _load_state()
    now = time.time()
    if problems:
        signature = "|".join(sorted(problems))
        if state is None or state.get("signature") != signature or now - state.get("at", 0) > REPEAT_SECONDS:
            _notify("【要確認】たからものを描いておくろう: 問題を検知しました", problems + ["", "30分ごとの自己点検で見つかりました。直るまで、6時間おきに知らせます。"])
            s3.put_object(Bucket=BUCKET, Key=STATE_KEY, Body=json.dumps({"signature": signature, "at": now}).encode())
    elif state is not None:
        _notify("【復旧】たからものを描いておくろう: 問題は解消しました", ["自己点検で、問題が見つからなくなりました。"])
        s3.delete_object(Bucket=BUCKET, Key=STATE_KEY)
    return {"problems": problems}
