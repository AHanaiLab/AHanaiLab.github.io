#!/usr/bin/env python3
"""届いた作品を、Unity(Cluster の美術館ワールド)に飾る用のデータに変換する。手元の Mac で実行する。

手順は2段階。まず「展示する作品を選ぶ表」を作り、直した表から、展示用のファイルを作る。
  1) python3 tools/export_for_unity.py curate
       → unity_export/curation.csv ができる。Excel やスプレッドシートで開いて、次を直す。
           「展示方法」 … 額縁(2Dの絵を額縁に) / 3D(台座の上に3Dを) / 両方 / N(飾らない)
           「額縁の番号」「台座の番号」 … どの壁・台座に飾るか。空欄なら、順番に自動で割り当てる
           「タイトル」「ニックネーム」「コメント」 … 誤字や、不適切な内容を直す
         (もう一度 curate を実行しても、直した内容は消えない。新しく届いた作品だけが、表に足される)
  2) python3 tools/export_for_unity.py build
       → unity_export/ に、展示用の画像(作品・説明板)、3D(OBJ + 画像)、works.json ができる。
         これを、Unity の Assets/OekakiWorks/ に入れる(unity/README.md を参照)。

枠の数は --frames(既定15)、--pedestals(既定10)。超えると、build がエラーで教える。
作品の置き場所は、自動で探す(Google ドライブの「お絵描きボックス」→ なければ ./inbox)。--src で指定もできる。
説明板(タイトル・作者・コメント)は、文字を画像にして作る。Unity 側に、文字の部品やフォントは要らない。
3D は、Tripo の GLB を、Unity にそのまま取り込める OBJ + 画像(JPEG)に変換する(原点=足元の中心、高さ=1)。
Pillow が必要: pip3 install pillow
"""
import argparse
import csv
import glob
import json
import os
import shutil
import struct
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow が必要です: pip3 install pillow")

HEADER = ["id", "展示方法", "額縁の番号", "台座の番号", "タイトル", "ニックネーム", "コメント", "3D", "投稿日時"]
# 「展示方法」の書き方のゆれを、4つにそろえる
MODES = {"額縁": "frame", "2d": "frame", "2D": "frame", "3d": "3d", "3D": "3d", "両方": "both", "both": "both",
         "n": "none", "N": "none", "×": "none", "なし": "none", "しない": "none", "": "none"}
MODE_LABEL = {"frame": "額縁", "3d": "3D", "both": "両方", "none": "N"}
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
        rows = {r["id"]: r for r in csv.DictReader(f) if r.get("id")}
    for r in rows.values():   # 古い表(「展示する」の列)を、新しい形に直す
        if "展示方法" not in r and "展示する" in r:
            r["展示方法"] = ("両方" if r.get("3D") else "額縁") if str(r["展示する"]).strip().lower() in ("y", "yes", "1", "true", "○", "はい") else "N"
    return rows


def mode_of(row):
    key = str(row.get("展示方法", "")).strip()
    return MODES.get(key, MODES.get(key.lower()))


def slot_of(row, col):
    v = str(row.get(col, "")).strip()
    return int(v) if v.isdigit() else 0


def cmd_curate(a):
    works, csv_path = scan(find_src(a.src)), os.path.join(a.out, "curation.csv")
    if not works:
        sys.exit(f"作品が見つかりません: {find_src(a.src)}  (--src で場所を指定してください)")
    rows = read_csv(csv_path)   # 直した内容は残す
    added = 0
    for wid, w in sorted(works.items(), key=lambda kv: kv[1]["meta"].get("submitted_at", "")):
        has3d = "あり" if w["glb"] else ""
        if wid in rows:
            rows[wid]["3D"] = has3d
            continue
        m = w["meta"]
        rows[wid] = {"id": wid, "展示方法": "両方" if has3d else "額縁", "額縁の番号": "", "台座の番号": "",
                     "タイトル": m.get("title", ""), "ニックネーム": m.get("nickname", ""),
                     "コメント": m.get("message", ""), "3D": has3d, "投稿日時": m.get("submitted_at", "")}
        added += 1
    os.makedirs(a.out, exist_ok=True)
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:   # BOM付き: Excel で文字化けしない
        wr = csv.DictWriter(f, fieldnames=HEADER, extrasaction="ignore", restval="")
        wr.writeheader()
        wr.writerows(sorted(rows.values(), key=lambda r: r.get("投稿日時", "")))
    print(f"作品 {len(works)} 件(新しく {added} 件を追加)→ {csv_path}")
    report(rows, a)
    print("「展示方法」などを直したら、保存して、build を実行してください。")


def counts(rows):
    modes = [mode_of(r) for r in rows.values()]
    return sum(m in ("frame", "both") for m in modes), sum(m in ("3d", "both") for m in modes)


def report(rows, a):
    nf, np_ = counts(rows)
    print(f"今の選択: 額縁 {nf} 件(枠 {a.frames})、3D {np_} 件(台座 {a.pedestals})")
    if nf > a.frames:
        print(f"  ! 額縁が {nf - a.frames} 件、多すぎます。「展示方法」を直してください")
    if np_ > a.pedestals:
        print(f"  ! 3D が {np_ - a.pedestals} 件、多すぎます。「展示方法」を直してください")


def assign_slots(rows, a):
    """番号の指定を確かめて、空欄を順番に埋める。(額縁の番号, 台座の番号) の dict と、エラーの一覧を返す"""
    errors, frame_no, ped_no = [], {}, {}
    for kind, col, total, out in (("frame", "額縁の番号", a.frames, frame_no), ("3d", "台座の番号", a.pedestals, ped_no)):
        want = [(wid, r) for wid, r in rows.items() if mode_of(r) in (kind, "both")]
        used = {}
        for wid, r in want:
            n = slot_of(r, col)
            if n:
                if not 1 <= n <= total:
                    errors.append(f"{wid}: {col} は 1〜{total} で指定してください(今: {n})")
                elif n in used:
                    errors.append(f"{col} {n} が、{used[n][-8:]} と {wid[-8:]} で、重なっています")
                else:
                    used[n] = wid; out[wid] = n
        free = (n for n in range(1, total + 1) if n not in used)
        for wid, r in sorted(want, key=lambda kv: kv[1].get("投稿日時", "")):
            if wid not in out:
                n = next(free, None)
                if n is None:
                    errors.append(f"{'額縁' if kind == 'frame' else '3D'} が、枠({total})より多いです")
                    break
                out[wid] = n
    return frame_no, ped_no, errors


def glb_to_obj(glb_path, obj_path, tex_path, height=1.0, tex_max=1024):
    """Tripo の GLB を、Unity に直接取り込める OBJ + JPEG に変換する。足元の中心が原点、高さが height。"""
    data = open(glb_path, "rb").read()
    if data[:4] != b"glTF":
        raise ValueError("GLB ではありません")
    off, js, binc = 12, None, b""
    while off < len(data):
        clen, ctype = struct.unpack_from("<I4s", data, off); off += 8
        chunk = data[off:off + clen]; off += clen
        if ctype == b"JSON":
            js = json.loads(chunk)
        elif ctype[:3] == b"BIN":
            binc = chunk
    bad = {"EXT_meshopt_compression", "KHR_draco_mesh_compression"} & set(js.get("extensionsRequired", []))
    if bad:
        raise ValueError(f"圧縮された GLB は未対応です: {sorted(bad)}")
    comp = {5120: ("b", 127.0), 5121: ("B", 255.0), 5122: ("h", 32767.0), 5123: ("H", 65535.0), 5125: ("I", 1.0), 5126: ("f", 1.0)}
    ncomp = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}

    def accessor(idx):
        acc = js["accessors"][idx]; bv = js["bufferViews"][acc["bufferView"]]
        fmt, norm = comp[acc["componentType"]]; n = ncomp[acc["type"]]
        size = struct.calcsize("<" + fmt)
        stride = bv.get("byteStride") or size * n
        base = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
        rows_ = [struct.unpack_from("<" + fmt * n, binc, base + i * stride) for i in range(acc["count"])]
        if acc.get("normalized") and norm != 1.0:
            rows_ = [tuple(v / norm for v in r) for r in rows_]
        return rows_

    pos, uv, nor, idx = [], [], [], []
    tex_index = None
    for mesh in js.get("meshes", []):
        for prim in mesh["primitives"]:
            if prim.get("mode", 4) != 4:
                continue
            at = prim["attributes"]
            base = len(pos)
            p = accessor(at["POSITION"]); pos += p
            uv += accessor(at["TEXCOORD_0"]) if "TEXCOORD_0" in at else [(0.0, 0.0)] * len(p)
            nor += accessor(at["NORMAL"]) if "NORMAL" in at else [(0.0, 1.0, 0.0)] * len(p)
            ind = [i[0] for i in accessor(prim["indices"])] if "indices" in prim else list(range(len(p)))
            idx += [base + i for i in ind]
            if tex_index is None and "material" in prim:
                t = js["materials"][prim["material"]].get("pbrMetallicRoughness", {}).get("baseColorTexture")
                if t:
                    tex_index = t["index"]
    if not pos or not idx:
        raise ValueError("形(三角形)が見つかりません")

    # 足元の中心を原点にして、高さをそろえる
    xs, ys, zs = zip(*pos)
    cx, cz, miny = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2, min(ys)
    k = height / ((max(ys) - miny) or 1.0)
    with open(obj_path, "w") as f:
        f.write("# from Tripo GLB\n")
        for x, y, z in pos:
            f.write(f"v {(x - cx) * k:.6f} {(y - miny) * k:.6f} {(z - cz) * k:.6f}\n")
        for u, v in uv:
            f.write(f"vt {u:.6f} {1.0 - v:.6f}\n")   # glTF は左上が原点、OBJ は左下
        for x, y, z in nor:
            f.write(f"vn {x:.5f} {y:.5f} {z:.5f}\n")
        for i in range(0, len(idx) - 2, 3):
            a_, b_, c_ = (idx[i] + 1, idx[i + 1] + 1, idx[i + 2] + 1)
            f.write(f"f {a_}/{a_}/{a_} {b_}/{b_}/{b_} {c_}/{c_}/{c_}\n")

    # 色(ベースカラー)の画像を、JPEG にする
    if tex_index is None:
        raise ValueError("色の画像(ベースカラー)が見つかりません")
    img_def = js["images"][js["textures"][tex_index]["source"]]
    if "bufferView" in img_def:
        bv = js["bufferViews"][img_def["bufferView"]]; raw = binc[bv.get("byteOffset", 0):bv.get("byteOffset", 0) + bv["byteLength"]]
    else:
        import base64
        raw = base64.b64decode(img_def["uri"].split(",", 1)[1])
    import io
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    im.thumbnail((tex_max, tex_max), Image.LANCZOS)
    im.save(tex_path, "JPEG", quality=88)
    return len(idx) // 3


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
    errors = []
    for wid, r in rows.items():
        if mode_of(r) is None:
            errors.append(f"{wid}: 「展示方法」は 額縁 / 3D / 両方 / N のどれかにしてください(今: {r.get('展示方法')})")
        elif mode_of(r) in ("3d", "both") and (wid not in src or not src[wid]["glb"]):
            errors.append(f"{wid}: 3D が選ばれていますが、3Dのファイルがありません。「展示方法」を 額縁 に直してください")
    frame_no, ped_no, slot_errors = assign_slots({k: v for k, v in rows.items() if mode_of(v)}, a)
    errors += slot_errors
    if errors:
        print("直してほしいところがあります:")
        for e in errors:
            print("  ! " + e)
        sys.exit(1)

    works_dir = os.path.join(a.out, "Works")
    shutil.rmtree(works_dir, ignore_errors=True)
    out, skipped, tris = [], 0, 0
    for wid, r in sorted(rows.items(), key=lambda kv: kv[1].get("投稿日時", "")):
        mode = mode_of(r)
        if mode == "none":
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
        item = {"id": wid, "display": mode, "title": (r.get("タイトル") or "").strip() or "無題", "nickname": (r.get("ニックネーム") or "").strip(),
                "comment": (r.get("コメント") or "").strip(), "art": f"Works/{wid}/art.png", "plate": f"Works/{wid}/plate.png",
                "aspect": round(im.width / im.height, 4), "frame_slot": frame_no.get(wid, 0), "pedestal_slot": ped_no.get(wid, 0),
                "submitted_at": r.get("投稿日時", "")}
        if mode in ("3d", "both"):
            try:
                tris += glb_to_obj(s["glb"], os.path.join(d, "model.obj"), os.path.join(d, "model_tex.jpg"), 1.0, a.model_tex_size)
            except (ValueError, KeyError, struct.error) as e:
                sys.exit(f"  ! {wid}: 3Dを変換できませんでした: {e}")
            item["model"] = f"Works/{wid}/model.obj"; item["model_texture"] = f"Works/{wid}/model_tex.jpg"
        out.append(item)
    with open(os.path.join(a.out, "works.json"), "w", encoding="utf-8") as f:
        json.dump({"works": out}, f, ensure_ascii=False, indent=1)
    size = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(works_dir) for fn in fns)
    nf, np_ = sum(i["frame_slot"] > 0 for i in out), sum(i["pedestal_slot"] > 0 for i in out)
    print(f"展示: 額縁 {nf} 件 / 3D {np_} 件(飾らない: {skipped} 件)  合計 {size / 1e6:.1f} MB  3Dの三角形 合計 {tris:,}")
    print(f"→ {os.path.abspath(a.out)}  の Works フォルダと works.json を、Unity の Assets/OekakiWorks/ に入れてください")


def main():
    ap = argparse.ArgumentParser(description="作品を Unity 用に変換する")
    ap.add_argument("command", choices=["curate", "build"])
    ap.add_argument("--src", help="作品のフォルダ(既定: Google ドライブの お絵描きボックス)")
    ap.add_argument("--out", default="unity_export", help="出力先(既定: ./unity_export)")
    ap.add_argument("--font", help="説明板に使う日本語フォントのファイル")
    ap.add_argument("--max-size", type=int, default=1024, help="作品の画像の長い辺の最大(既定 1024。ワールドを軽くするなら 768 など)")
    ap.add_argument("--frames", type=int, default=15, help="額縁を置く壁の数(既定 15)")
    ap.add_argument("--pedestals", type=int, default=10, help="3Dを置く台座の数(既定 10)")
    ap.add_argument("--model-tex-size", type=int, default=1024, help="3Dの色の画像の最大サイズ(既定 1024)")
    a = ap.parse_args()
    {"curate": cmd_curate, "build": cmd_build}[a.command](a)


if __name__ == "__main__":
    main()
