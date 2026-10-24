#!/usr/bin/env python3
"""同じ絵を、複数の Tripo 設定で一度に3D化して、見た目を比べるためのツール(手元のMacで実行)。

使い方:
  export TRIPO_API_KEY=tsk_...        # シークレットキー
  python3 tools/tripo_try.py ~/絵.png                  # 全パターン
  python3 tools/tripo_try.py ~/絵.png base autofix     # 指定したパターンだけ
  python3 tools/tripo_try.py ~/絵.png --crop           # 被写体を切り抜いて拡大してから送る (要 Pillow: pip3 install pillow)

結果は ./tripo_try_out/<絵の名前>/ に、パターン名.png(完成イメージ)と パターン名.glb で保存されます。
実行の前後でクレジット残高を表示するので、1パターンあたりの消費量も分かります。
"""
import json
import os
import sys
import time
import urllib.request
import uuid

BASE = os.environ.get("TRIPO_API_BASE", "https://openapi.tripo3d.ai/v3").rstrip("/")
KEY = os.environ.get("TRIPO_API_KEY", "")

COMMON = {"model": "v3.1-20260211", "texture": True, "pbr": False, "face_limit": 30000}   # 現在の本番設定
VARIANTS = {
    "base": {},                                                    # 現在の本番設定
    "autofix": {"enable_image_autofix": True},                     # 入力画像を自動で補正
    "align": {"orientation": "align_image"},                       # 絵の向きに合わせる
    "geo_detailed": {"geometry_quality": "detailed"},              # 形状を細かく
    "v30": {"model": "v3.0-20250812"},                             # 1つ前のモデル
    "autofix_align_detailed": {"enable_image_autofix": True, "orientation": "align_image", "geometry_quality": "detailed"},
}


def call(method, url, body=None, headers=None):
    req = urllib.request.Request(url, data=body, method=method, headers={"Authorization": f"Bearer {KEY}", "User-Agent": "oekaki-box-try/1.0", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} {url}: {e.read()[:300]!r}")
    return raw


def api(method, path, body=None, headers=None):
    res = json.loads(call(method, BASE + path, body, headers))
    if res.get("code") != 0:
        sys.exit(f"Tripo error: {res}")
    return res["data"]


def balance():
    return api("GET", "/account/balance")["balance"]


def upload(png):
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="drawing.png"\r\nContent-Type: image/png\r\n\r\n').encode() + png + f"\r\n--{b}--\r\n".encode()
    return api("POST", "/files", body, {"Content-Type": f"multipart/form-data; boundary={b}"})["file_token"]


def crop_square(path):
    """画面と同じ処理: 被写体を切り抜いて、余白24%の白背景の正方形(1024px)にする"""
    try:
        from PIL import Image
    except ImportError:
        sys.exit("--crop には Pillow が必要です: pip3 install pillow")
    im = Image.open(path).convert("RGB")
    box = im.point(lambda v: 255 if v < 245 else 0).convert("L").getbbox()   # いずれかの色が245未満の画素の範囲
    if not box:
        sys.exit("絵が空です")
    x0, y0, x1, y1 = box
    side = max(x1 - x0, y1 - y0)
    S = round(side * 1.24)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    canvas = Image.new("RGB", (S, S), (255, 255, 255))
    canvas.paste(im, (round(S / 2 - cx), round(S / 2 - cy)))
    out = canvas.resize((1024, 1024), Image.LANCZOS)
    tmp = path + ".crop.png"
    out.save(tmp)
    return tmp


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not KEY or not args:
        sys.exit(__doc__)
    path = os.path.expanduser(args[0])
    names = args[1:] or list(VARIANTS)
    unknown = [n for n in names if n not in VARIANTS]
    if unknown:
        sys.exit(f"未知のパターン: {unknown} (使えるもの: {list(VARIANTS)})")
    src = crop_square(path) if "--crop" in sys.argv else path
    outdir = os.path.join("tripo_try_out", os.path.splitext(os.path.basename(path))[0] + ("_crop" if "--crop" in sys.argv else ""))
    os.makedirs(outdir, exist_ok=True)

    before = balance()
    print(f"残高(前): {before}")
    token = upload(open(src, "rb").read())
    tasks = {}
    for n in names:   # 先に全部依頼して、まとめて待つ
        tasks[n] = api("POST", "/generation/image-to-model", json.dumps({"input": token, **COMMON, **VARIANTS[n]}).encode(), {"Content-Type": "application/json"})["task_id"]
        print(f"依頼: {n} -> {tasks[n]}")
    pending = dict(tasks)
    end = time.time() + 900
    while pending and time.time() < end:
        time.sleep(5)
        for n, tid in list(pending.items()):
            d = api("GET", f"/tasks/{tid}")
            if d["status"] == "success":
                out = d.get("output") or {}
                for ext, key in (("glb", "model_url"), ("png", "rendered_image_url")):
                    if out.get(key):
                        with urllib.request.urlopen(urllib.request.Request(out[key], headers={"User-Agent": "oekaki-box-try/1.0"}), timeout=120) as r:
                            open(os.path.join(outdir, f"{n}.{ext}"), "wb").write(r.read())
                print(f"完了: {n} (消費 {d.get('credits_consumed')} クレジット)")
                del pending[n]
            elif d["status"] in ("failed", "cancelled"):
                print(f"失敗: {n} {d.get('error_code')} {d.get('error_message')}")
                del pending[n]
    after = balance()
    print(f"残高(後): {after}  (合計 {before - after} 消費)")
    print(f"結果: {os.path.abspath(outdir)}  ← .png を開いて見比べてください")


if __name__ == "__main__":
    main()
