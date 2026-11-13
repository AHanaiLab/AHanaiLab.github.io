#!/usr/bin/env python3
"""届いた作品を、Unity(Cluster の美術館ワールド)に飾る用のデータに変換する。手元の Mac で実行する。

手順は2段階。まず「展示する作品を選ぶ表」を作り、直した表から、展示用のファイルを作る。
  1) python3 tools/export_for_unity.py curate
       → unity_export/curation.csv ができる。Excel やスプレッドシートで開いて、
         「展示する」を Y / N で選び、タイトル・ニックネーム・コメントの誤字や不適切な内容を直す。
         (もう一度 curate を実行しても、直した内容は消えない。新しく届いた作品だけが、表に足される)
  2) python3 tools/export_for_unity.py build
       → unity_export/ に、展示用の画像(作品・説明板)と works.json ができる。
         これを、Unity の Assets/OekakiWorks/ に入れる(unity/README.md を参照)。

作品の置き場所は、自動で探す(Google ドライブの「お絵描きボックス」→ なければ ./inbox)。--src で指定もできる。
説明板(タイトル・作者・コメント)は、文字を画像にして作る。Unity 側に、文字の部品やフォントは要らない。
Pillow が必要: pip3 install pillow
"""
import argparse
import csv
import glob
import json
import os
import shutil
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow が必要です: pip3 install pillow")

HEADER = ["id", "展示する", "タイトル", "ニックネーム", "コメント", "3D", "投稿日時"]
YES = {"y", "yes", "1", "true", "○", "はい", "展示"}
FONT_CANDIDATES = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc", "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc", "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf", "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
]


def find_src(arg):
    if arg:
        return os.path.expanduser(arg)
    for pat in ("~/Library/CloudStorage/GoogleDrive-*/マイドライブ/お絵描きボックス", "~/Library/CloudStorage/GoogleDrive-*/My Drive/お絵描きボックス"):
        hits = glob.glob(os.path.expanduser(pat))
        if hits:
            return hits[0]
    return "inbox"


def scan(src):
    """{id: {json, png, glb, meta}} を返す"""
    works = {}
    for jp in glob.glob(os.path.join(src, "**", "*.json"), recursive=True):
        try:
            meta = json.load(open(jp, encoding="utf-8"))
        except (OSError, ValueError):
            continue
        stem = jp[:-5]
        if "id" not in meta or not os.path.exists(stem + ".png"):
            continue
        works[meta["id"]] = {"png": stem + ".png", "glb": stem + ".glb" if os.path.exists(stem + ".glb") else None, "meta": meta}
    return works


def read_csv(path):
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8-sig", newline="") as f:
        return {r["id"]: r for r in csv.DictReader(f) if r.get("id")}


def cmd_curate(a):
    works, csv_path = scan(find_src(a.src)), os.path.join(a.out, "curation.csv")
    if not works:
        sys.exit(f"作品が見つかりません: {find_src(a.src)}  (--src で場所を指定してください)")
    rows = read_csv(csv_path)   # 直した内容は残す
    added = 0
    for wid, w in sorted(works.items(), key=lambda kv: kv[1]["meta"].get("submitted_at", "")):
        if wid in rows:
            rows[wid]["3D"] = "あり" if w["glb"] else ""
            continue
        m = w["meta"]
        rows[wid] = {"id": wid, "展示する": "Y", "タイトル": m.get("title", ""), "ニックネーム": m.get("nickname", ""),
                     "コメント": m.get("message", ""), "3D": "あり" if w["glb"] else "", "投稿日時": m.get("submitted_at", "")}
        added += 1
    os.makedirs(a.out, exist_ok=True)
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:   # BOM付き: Excel で文字化けしない
        wr = csv.DictWriter(f, fieldnames=HEADER, extrasaction="ignore")
        wr.writeheader()
        wr.writerows(sorted(rows.values(), key=lambda r: r.get("投稿日時", "")))
    print(f"作品 {len(works)} 件(新しく {added} 件を追加)→ {csv_path}")
    print("「展示する」を Y / N で選び、タイトルやコメントを直したら、build を実行してください。")


def load_font(path, size):
    for p in ([path] if path else FONT_CANDIDATES):
        if p and os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    sys.exit("日本語のフォントが見つかりません。--font でフォントのファイルを指定してください")


def wrap(text, font, max_w):
    lines = []
    for para in str(text).replace("\r", "").split("\n"):
        cur = ""
        for ch in para:
            if font.getlength(cur + ch) > max_w and cur:
                lines.append(cur)
                cur = ch
            else:
                cur += ch
        lines.append(cur)
    return lines


def make_plate(title, nickname, comment, font_path, w=1024, h=512):
    """タイトル・作者・コメントを、1枚の画像(説明板)にする"""
    img = Image.new("RGB", (w, h), (253, 250, 240))
    d = ImageDraw.Draw(img)
    d.rectangle([6, 6, w - 7, h - 7], outline=(110, 80, 55), width=8)
    pad, inner = 44, w - 88
    f_title, f_sub, f_body = load_font(font_path, 60), load_font(font_path, 34), load_font(font_path, 32)
    y, bottom = pad, h - pad
    for ln in wrap(title.strip() or "無題", f_title, inner)[:2]:
        d.text((pad, y), ln, font=f_title, fill=(60, 40, 25)); y += 74
    if nickname.strip():
        y += 6; d.text((pad, y), f"作者: {nickname.strip()}", font=f_sub, fill=(110, 80, 55)); y += 52
    if comment.strip():
        y += 10; d.line([(pad, y), (w - pad, y)], fill=(200, 180, 150), width=3); y += 18
        lines = wrap(comment.strip(), f_body, inner)
        room = max(0, int((bottom - y) // 44))
        if len(lines) > room:   # 入りきらないときは、最後を「…」で切る
            lines = lines[:room]
            if lines:
                while lines[-1] and f_body.getlength(lines[-1] + "…") > inner:
                    lines[-1] = lines[-1][:-1]
                lines[-1] += "…"
        for ln in lines:
            d.text((pad, y), ln, font=f_body, fill=(50, 50, 50)); y += 44
    return img


def cmd_build(a):
    csv_path = os.path.join(a.out, "curation.csv")
    rows = read_csv(csv_path)
    if not rows:
        sys.exit(f"{csv_path} がありません。先に curate を実行してください")
    src = scan(find_src(a.src))
    works_dir = os.path.join(a.out, "Works")
    shutil.rmtree(works_dir, ignore_errors=True)
    out, skipped = [], 0
    for wid, r in sorted(rows.items(), key=lambda kv: kv[1].get("投稿日時", "")):
        if r.get("展示する", "").strip().lower() not in YES:
            skipped += 1
            continue
        if wid not in src:
            print(f"  ! {wid}: 元のファイルが見つかりません(スキップ)")
            continue
        s = src[wid]
        d = os.path.join(works_dir, wid)
        os.makedirs(d, exist_ok=True)
        im = Image.open(s["png"])
        if im.mode in ("RGBA", "LA", "P"):   # 透明な部分は白にする
            im = im.convert("RGBA"); bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im); im = bg
        im = im.convert("RGB")
        im.thumbnail((a.max_size, a.max_size), Image.LANCZOS)
        im.save(os.path.join(d, "art.png"), optimize=True)
        make_plate(r.get("タイトル", ""), r.get("ニックネーム", ""), r.get("コメント", ""), a.font).save(os.path.join(d, "plate.png"), optimize=True)
        item = {"id": wid, "title": (r.get("タイトル") or "").strip() or "無題", "nickname": (r.get("ニックネーム") or "").strip(),
                "comment": (r.get("コメント") or "").strip(), "art": f"Works/{wid}/art.png", "plate": f"Works/{wid}/plate.png",
                "aspect": round(im.width / im.height, 4), "submitted_at": r.get("投稿日時", "")}
        if a.with_3d and s["glb"]:
            shutil.copy(s["glb"], os.path.join(d, "model.glb")); item["model"] = f"Works/{wid}/model.glb"
        out.append(item)
    with open(os.path.join(a.out, "works.json"), "w", encoding="utf-8") as f:
        json.dump({"works": out}, f, ensure_ascii=False, indent=1)
    size = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(works_dir) for fn in fns)
    print(f"展示する作品: {len(out)} 件(展示しない: {skipped} 件)  合計 {size / 1e6:.1f} MB")
    print(f"→ {os.path.abspath(a.out)}  の Works フォルダと works.json を、Unity の Assets/OekakiWorks/ に入れてください")


def main():
    ap = argparse.ArgumentParser(description="作品を Unity 用に変換する")
    ap.add_argument("command", choices=["curate", "build"])
    ap.add_argument("--src", help="作品のフォルダ(既定: Google ドライブの お絵描きボックス)")
    ap.add_argument("--out", default="unity_export", help="出力先(既定: ./unity_export)")
    ap.add_argument("--font", help="説明板に使う日本語フォントのファイル")
    ap.add_argument("--max-size", type=int, default=1024, help="作品の画像の長い辺の最大(既定 1024。ワールドを軽くするなら 768 など)")
    ap.add_argument("--with-3d", action="store_true", help="3D(GLB)も出力に含める")
    a = ap.parse_args()
    {"curate": cmd_curate, "build": cmd_build}[a.command](a)


if __name__ == "__main__":
    main()
