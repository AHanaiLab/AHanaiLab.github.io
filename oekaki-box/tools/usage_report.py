#!/usr/bin/env python3
"""3D生成の「試した回数・成功・失敗」を、日本時間の日付ごとに集計する(手元のMacで実行)。

使い方:
  python3 tools/usage_report.py          # 直近30日
  python3 tools/usage_report.py 60       # 直近60日

3D生成のログ(CloudWatch Logs)を読みます。数えられるのは「3D生成の処理まで届いた試行」だけです。
画面で「3Dにしてみる」を押す前や、1日の上限・機能オフで断られた分は、ここには出ません。
"""
import collections
import datetime as dt
import json
import re
import subprocess
import sys

REGION, STACK = "ap-northeast-1", "oekaki-box"
JST = dt.timezone(dt.timedelta(hours=9))


def aws(*args):
    r = subprocess.run(["aws", *args, "--region", REGION], capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"aws コマンドが失敗しました: {r.stderr.strip()[:300]}")
    return r.stdout


def load_events(days):
    fn = aws("cloudformation", "describe-stack-resource", "--stack-name", STACK, "--logical-resource-id",
             "ModelWorkerFunction", "--query", "StackResourceDetail.PhysicalResourceId", "--output", "text").strip()
    start = int((dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)).timestamp() * 1000)
    return json.loads(aws("logs", "filter-log-events", "--log-group-name", f"/aws/lambda/{fn}",
                          "--start-time", str(start), "--output", "json")).get("events", [])


def summarize(events):
    per_day = collections.defaultdict(lambda: [0, 0])   # 日付 -> [試した回数, 失敗]
    fails = []
    for e in events:
        t = dt.datetime.fromtimestamp(e["timestamp"] / 1000, JST)
        msg = e["message"]
        if msg.startswith("START RequestId"):
            per_day[t.date()][0] += 1
        elif "model generation failed" in msg:
            per_day[t.date()][1] += 1
            code = re.search(r"HTTP (\d+)", msg)
            why = re.search(r'"message":"([^"]+)"', msg)
            fails.append((t, f"HTTP {code.group(1)} " if code else "") + (why.group(1) if why else msg[:80]))
    return per_day, sorted(fails)


def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    per_day, fails = summarize(load_events(days))
    print(f"3D生成の集計(日本時間・直近{days}日)\n")
    print(f"{'日付':<12}{'試した':>6}{'成功':>6}{'失敗':>6}")
    tot = [0, 0]
    for d in sorted(per_day):
        a, f = per_day[d]
        print(f"{d.isoformat():<12}{a:>6}{a - f:>6}{f:>6}")
        tot[0] += a; tot[1] += f
    print(f"{'合計':<12}{tot[0]:>6}{tot[0] - tot[1]:>6}{tot[1]:>6}")
    if fails:
        print(f"\n失敗した日時({len(fails)}件)")
        for t, why in fails:
            print(f"  {t:%Y-%m-%d %H:%M:%S}  {why}")
        print(f"\n最初の失敗: {fails[0][0]:%Y-%m-%d %H:%M}   最後の失敗: {fails[-1][0]:%Y-%m-%d %H:%M}")


if __name__ == "__main__":
    main()
