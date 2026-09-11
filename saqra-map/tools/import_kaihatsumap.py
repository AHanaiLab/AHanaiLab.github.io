#!/usr/bin/env python3
"""saqra.jp/kaihatsumap/index.html の保存HTMLから frontend/data/map.json を生成する管理者用ツール。

使い方（公式ページが更新されたとき）:
  1. ブラウザで https://saqra.jp/kaihatsumap/index.html を開き「ページのソースを保存」→ kaihatsumap.html
  2. python3 tools/import_kaihatsumap.py kaihatsumap.html
     → frontend/data/map.json を上書き（英語検索語 `en` は既存の map.json から引き継ぐ）
  3. ./deploy.sh

map.json の構造:
  meta{title, subtitle, source, created, updated, survey_items, footnotes}
  categories[]: {n, name, nav（ナビ表示名、改行は \n）, en（PubMed 検索語）, blocks[]}
    blocks[] は元ページの並び順のまま:
      {type:"study", intervention, study:{title,url,status,sup}|null（null＝未実施「ー」）, cancer, generation, background, design, funding}
      {type:"guidelines", jp:<html>, overseas:<html>}
      {type:"note", items:[<html>...]}
"""
import json, os, re, sys
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "frontend", "data", "map.json")
if len(sys.argv) < 2:
    sys.exit(__doc__)
SRC = open(sys.argv[1], encoding="utf-8").read()
VOID = {'br','img','source','meta','link','input','hr'}

class Node:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs or []), parent, []
    def cls(self): return (self.attrs.get('class') or '').split()
    def find_all(self, pred, out=None):
        out = [] if out is None else out
        for c in self.children:
            if isinstance(c, Node):
                if pred(c): out.append(c)
                c.find_all(pred, out)
        return out
    def text(self):
        return ''.join(c if isinstance(c, str) else c.text() for c in self.children)
    def inner_html(self):
        return ''.join(esc(c) if isinstance(c, str) else c.outer_html() for c in self.children)
    def outer_html(self):
        a = ''.join(f' {k}="{v}"' for k, v in self.attrs.items())
        if self.tag in VOID: return f'<{self.tag}{a}>'
        return f'<{self.tag}{a}>{self.inner_html()}</{self.tag}>'

def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

class Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root'); self.cur = self.root
    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.cur); self.cur.children.append(n)
        if tag not in VOID: self.cur = n
    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag: n = n.parent
        if n is not self.root: self.cur = n.parent
    def handle_data(self, data): self.cur.children.append(data)

b = Builder(); b.feed(SRC); root = b.root

def norm(s): return re.sub(r'\s+', ' ', s).strip()
def clean_html(html):
    html = re.sub(r'\s*\n\s*', ' ', html)
    html = re.sub(r'\s*<br>\s*', '<br>', html)
    html = re.sub(r'\s+', ' ', html)
    html = re.sub(r'> <', '><', html)
    return html.strip()

nav = root.find_all(lambda n: n.tag=='ol' and n.attrs.get('id')=='developmentMapNav')[0]
nav_labels = {}
for li in nav.find_all(lambda n: n.tag=='li'):
    key = li.cls()[0]
    a = li.find_all(lambda n: n.tag=='a')[0]
    nav_labels[key] = clean_html(a.inner_html()).replace('<i>','').replace('</i>','')

def cell_html(td): return clean_html(td.inner_html())

def parse_table01(t):
    rows = t.find_all(lambda n: n.tag=='tr')
    out = []
    for tr in rows[1:]:
        tds = [c for c in tr.children if isinstance(c, Node) and c.tag=='td']
        if len(tds) < 2: continue
        interv = norm(tds[0].text())
        a = tds[1].find_all(lambda n: n.tag=='a')
        study = {'title': norm(tds[1].text())}
        if a:
            study['url'] = a[0].attrs.get('href','')
            if 'achieved' in a[0].cls(): study['status'] = 'achieved'
            elif 'linkin' in a[0].cls(): study['status'] = 'ongoing'
        sup = tds[1].find_all(lambda n: n.tag=='sup')
        if sup: study['sup'] = norm(sup[0].text())
        if study['title'] in ('ー','―','-','—'): study = None
        out.append({'intervention': interv, 'study': study})
    return out

def parse_table02(t):
    rows = t.find_all(lambda n: n.tag=='tr')
    out = []
    for tr in rows[1:]:
        tds = [norm(c.text()) for c in tr.children if isinstance(c, Node) and c.tag=='td']
        out.append(tds)
    return out

def parse_table03(t):
    rows = t.find_all(lambda n: n.tag=='tr')
    tds = [c for c in rows[1].children if isinstance(c, Node) and c.tag=='td']
    return {'type':'guidelines', 'jp': cell_html(tds[0]), 'overseas': cell_html(tds[1])}

def walk_blocks(container, blocks):
    for c in container.children:
        if not isinstance(c, Node): continue
        if c.tag=='section' and 'tableContainer' in c.cls():
            t1 = [x for x in c.children if isinstance(x, Node) and 'developmentTable01' in x.cls()]
            t2 = [x for x in c.children if isinstance(x, Node) and 'developmentTable02' in x.cls()]
            t3 = [x for x in c.children if isinstance(x, Node) and 'developmentTable03' in x.cls()]
            if t1:
                rows = parse_table01(t1[0]); meta = parse_table02(t2[0]) if t2 else []
                for i, r in enumerate(rows):
                    m = meta[i] if i < len(meta) else (meta[0] if meta else ['ー']*5)
                    blocks.append({'type':'study', **r, 'cancer': m[0] if len(m)>0 else '', 'generation': m[1] if len(m)>1 else '',
                                   'background': m[2] if len(m)>2 else '', 'design': m[3] if len(m)>3 else '', 'funding': m[4] if len(m)>4 else ''})
            for t in t3: blocks.append(parse_table03(t))
            # nested notes
            for x in c.children:
                if isinstance(x, Node) and x.tag=='ul' and 'indent' in x.cls():
                    blocks.append({'type':'note', 'items':[clean_html(li.inner_html()) for li in x.find_all(lambda n: n.tag=='li')]})
        elif c.tag=='table' and 'developmentTable03' in c.cls():
            blocks.append(parse_table03(c))
        elif c.tag=='ul' and 'indent' in c.cls():
            blocks.append({'type':'note', 'items':[clean_html(li.inner_html()) for li in c.find_all(lambda n: n.tag=='li')]})
        elif c.tag in ('h2',):
            pass
        else:
            walk_blocks(c, blocks)

lst = root.find_all(lambda n: n.tag=='ol' and 'developmentList' in n.cls())[0]
cats = []
for li in [c for c in lst.children if isinstance(c, Node) and c.tag=='li']:
    key = li.attrs['id']
    h2 = li.find_all(lambda n: n.tag=='h2')[0]
    blocks = []
    walk_blocks(li, blocks)
    cats.append({'id': key, 'n': int(key[1:]), 'name': norm(h2.text()), 'nav': nav_labels.get(key, ''), 'blocks': blocks})

# stats
tot_study = sum(1 for c in cats for b in c['blocks'] if b['type']=='study')
tot_gap = sum(1 for c in cats for b in c['blocks'] if b['type']=='study' and not b['study'])
tot_gl = sum(1 for c in cats for b in c['blocks'] if b['type']=='guidelines')
tot_note = sum(1 for c in cats for b in c['blocks'] if b['type']=='note')
print(len(cats), 'cats', tot_study, 'study rows', tot_gap, 'gaps', tot_gl, 'guideline tables', tot_note, 'notes', file=sys.stderr)
for c in cats: print(c['n'], c['name'], '|', c['nav'], '|', sum(1 for b in c['blocks'] if b['type']=='study'), file=sys.stderr)

# ---- map.json を書き出し（既存の en を引き継ぐ）
try:
    old = json.load(open(OUT, encoding="utf-8"))
except Exception:
    old = {"meta": {}, "categories": []}
en = {c["n"]: c.get("en", "") for c in old.get("categories", [])}
m = re.search(r'class="update">\s*([\d.]+)作成<br>\s*([\d.]+)更新', SRC)
items = re.search(r'全がん連調査<b>(\d+)</b>項目', SRC)
out = {
    "meta": {
        "title": "全がん連 × J-SUPPORT × SaQRA 研究開発マップ",
        "subtitle": "〜がんサバイバーシップのアンメットニーズに応える〜",
        "source": "https://saqra.jp/kaihatsumap/index.html",
        "created": m.group(1) if m else old.get("meta", {}).get("created", ""),
        "updated": m.group(2) if m else old.get("meta", {}).get("updated", ""),
        "survey_items": int(items.group(1)) if items else old.get("meta", {}).get("survey_items", 29),
        "footnotes": old.get("meta", {}).get("footnotes") or {
            "1": "全がん連サバイバーシップ委員会によるサバイバーシップに関するアンケート調査",
            "2": "NCCN Survivorship Guidelines 2022 目次",
            "3": "NCCN Clinical Oncology Guidelines（Survivorshipのほか）",
            "4": "NCCN Clinical Oncology Guidelines for Patients",
        },
    },
    "categories": [],
}
for c in cats:
    blocks = []
    for b in c["blocks"]:
        if b["type"] == "study":
            s = b["study"]
            blocks.append({"type": "study", "intervention": b["intervention"],
                           "study": None if s is None else {k: v for k, v in s.items() if v},
                           "cancer": b["cancer"], "generation": b["generation"], "background": b["background"],
                           "design": b["design"], "funding": b["funding"]})
        elif b["type"] == "guidelines":
            blocks.append({"type": "guidelines", "jp": b["jp"], "overseas": b["overseas"]})
        else:
            blocks.append({"type": "note", "items": b["items"]})
    out["categories"].append({"n": c["n"], "name": c["name"], "nav": c["nav"].replace("<br>", "\n"),
                              "en": en.get(c["n"], c["name"]), "blocks": blocks})
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("wrote", os.path.relpath(OUT), file=sys.stderr)
