"""SaQRA 研究開発マップ データ収集 Lambda（Bedrock なし・標準ライブラリ + boto3 のみ）。

役割:
  - 週1回（EventBridge）または管理者ページからの手動実行で、30カテゴリごとに
      * PubMed 最新論文（直近5年、5件）
      * ガイドライン（PubMed の guideline[pt]、直近10年、3件 ＋ Minds 検索結果があれば）
      * AMED 研究開発課題（AMED_SEARCH_URL が設定されていれば取得、未設定なら検索リンクのみ）
    を取得し、S3 の data/*.json に書き出して CloudFront のキャッシュを消す
  - Function URL（POST, X-Admin-Token 必須）で手動実行、GET で最終更新状況を返す

書き出すファイル:
  data/pubmed.json      {"<カテゴリ番号>": [{title, url, source, year, pmid}], ...}
  data/guidelines.json  {"<カテゴリ番号>": {"pubmed": [...], "minds": [...]}, ...}
  data/amed.json        {"<カテゴリ番号>": {"items": [...], "search_url": "..."}, ...}
  data/status.json      {updated_at, duration_sec, counts, errors[]}
"""

import json
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

import boto3

SITE_BUCKET = os.environ.get("SITE_BUCKET", "")
DISTRIBUTION_ID = os.environ.get("DISTRIBUTION_ID", "")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")
NCBI_API_KEY = os.environ.get("NCBI_API_KEY", "")
AMED_SEARCH_URL = os.environ.get("AMED_SEARCH_URL", "")
MINDS_SEARCH_URL = os.environ.get("MINDS_SEARCH_URL", "")

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
AMEDFIND_HOME = "https://amedfind.amed.go.jp/amed/"
MINDS_HOME = "https://minds.jcqhc.or.jp/"
UA = "saqra-map-collector/1.0 (+https://saqra.jp/kaihatsumap)"
PUBMED_RECENT_N, PUBMED_GL_N = 5, 3
PUBMED_RECENT_DAYS, PUBMED_GL_DAYS = 365 * 5, 365 * 10

s3 = boto3.client("s3")


# ---------------------------------------------------------------- HTTP helpers

def _get(url: str, timeout: int = 20) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json, text/html;q=0.9, */*;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _get_json(url: str):
    return json.loads(_get(url).decode("utf-8", "replace"))


_last_ncbi = [0.0]


def _ncbi(endpoint: str, params: dict):
    """E-utilities 呼び出し。API キー無しは 3 req/s、ありは 10 req/s を守る。"""
    params = {**params, "tool": "saqra-map", "retmode": "json"}
    if NCBI_API_KEY:
        params["api_key"] = NCBI_API_KEY
    gap = 0.11 if NCBI_API_KEY else 0.35
    wait = _last_ncbi[0] + gap - time.time()
    if wait > 0:
        time.sleep(wait)
    _last_ncbi[0] = time.time()
    return _get_json(f"{EUTILS}/{endpoint}.fcgi?{urllib.parse.urlencode(params)}")


# ---------------------------------------------------------------- PubMed

def pubmed_search(term: str, retmax: int, reldate_days: int, sort: str = "date") -> list[dict]:
    es = _ncbi("esearch", {"db": "pubmed", "term": term, "retmax": retmax, "sort": sort, "datetype": "pdat", "reldate": reldate_days})
    ids = es.get("esearchresult", {}).get("idlist", [])
    if not ids:
        return []
    sm = _ncbi("esummary", {"db": "pubmed", "id": ",".join(ids)})
    result = sm.get("result", {})
    out = []
    for pmid in ids:
        it = result.get(pmid)
        if not it:
            continue
        doi = next((a.get("value") for a in it.get("articleids", []) if a.get("idtype") == "doi"), None)
        out.append({
            "pmid": pmid,
            "title": it.get("title", "").rstrip("."),
            "source": it.get("source", ""),
            "year": (it.get("pubdate") or "")[:4],
            "doi": doi,
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
        })
    return out


def category_terms(cat: dict) -> str:
    return f"({cat['en']}) AND (neoplasms[MeSH] OR cancer) AND (survivors OR survivorship OR supportive care OR palliative)"


# ---------------------------------------------------------------- Minds（HTML から /docs/gl/ へのリンクを拾う）

class _LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href = None
        self._text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href", "")
            if "/docs/gl/" in href:
                self._href, self._text = href, []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href is not None:
            text = re.sub(r"\s+", " ", "".join(self._text)).strip()
            if text:
                self.links.append((self._href, text))
            self._href = None


def minds_search(q: str) -> list[dict]:
    if not MINDS_SEARCH_URL:
        return []
    html = _get(MINDS_SEARCH_URL.replace("{q}", urllib.parse.quote(q))).decode("utf-8", "replace")
    p = _LinkParser()
    p.feed(html)
    seen, out = set(), []
    for href, text in p.links:
        url = urllib.parse.urljoin(MINDS_HOME, href)
        if url in seen:
            continue
        seen.add(url)
        out.append({"title": text[:200], "url": url})
        if len(out) >= 5:
            break
    return out


# ---------------------------------------------------------------- AMED（エンドポイント判明後に AMED_SEARCH_URL を設定）

def amed_search(q: str) -> dict:
    search_url = f"{AMEDFIND_HOME}"
    if not AMED_SEARCH_URL:
        return {"items": [], "search_url": search_url, "note": "AMED_SEARCH_URL 未設定（AMEDfind の検索XHRを確認して設定してください）"}
    url = AMED_SEARCH_URL.replace("{q}", urllib.parse.quote(q))
    raw = _get(url).decode("utf-8", "replace")
    items = []
    try:
        data = json.loads(raw)
        rows = data if isinstance(data, list) else next((v for v in data.values() if isinstance(v, list)), [])
        for r in rows[:10]:
            if not isinstance(r, dict):
                continue
            title = r.get("title") or r.get("projectTitle") or r.get("課題名") or r.get("name") or ""
            link = r.get("url") or r.get("link") or r.get("detailUrl") or ""
            if title:
                items.append({"title": str(title)[:200], "url": link, "raw": {k: str(v)[:120] for k, v in list(r.items())[:8]}})
    except ValueError:
        pass
    return {"items": items, "search_url": url}


# ---------------------------------------------------------------- S3 / CloudFront

def _read_json(key: str, default):
    try:
        return json.loads(s3.get_object(Bucket=SITE_BUCKET, Key=key)["Body"].read().decode("utf-8"))
    except Exception:
        return default


def _write_json(key: str, obj) -> None:
    s3.put_object(Bucket=SITE_BUCKET, Key=key, Body=json.dumps(obj, ensure_ascii=False, indent=1).encode("utf-8"),
                  ContentType="application/json; charset=utf-8", CacheControl="no-cache")


def _invalidate() -> None:
    if not DISTRIBUTION_ID:
        return
    boto3.client("cloudfront").create_invalidation(
        DistributionId=DISTRIBUTION_ID,
        InvalidationBatch={"Paths": {"Quantity": 1, "Items": ["/data/*"]}, "CallerReference": str(time.time())},
    )


# ---------------------------------------------------------------- 収集本体

def collect(source: str = "manual") -> dict:
    t0 = time.time()
    mapdata = _read_json("data/map.json", {})
    cats = mapdata.get("categories") or []
    pubmed, guidelines, amed, errors = {}, {}, {}, []
    for cat in cats:
        n = str(cat["n"])
        try:
            pubmed[n] = pubmed_search(category_terms(cat), PUBMED_RECENT_N, PUBMED_RECENT_DAYS)
        except Exception as e:
            errors.append(f"pubmed cat{n}: {e}"); pubmed[n] = []
        try:
            gl = pubmed_search(f"({cat['en']}) AND (neoplasms[MeSH] OR cancer) AND (guideline[pt] OR practice guideline[pt] OR consensus development conference[pt])",
                               PUBMED_GL_N, PUBMED_GL_DAYS)
        except Exception as e:
            errors.append(f"guideline cat{n}: {e}"); gl = []
        try:
            minds = minds_search(cat["name"])
        except Exception as e:
            errors.append(f"minds cat{n}: {e}"); minds = []
        guidelines[n] = {"pubmed": gl, "minds": minds, "minds_home": MINDS_HOME}
        try:
            amed[n] = amed_search(cat["name"])
        except Exception as e:
            errors.append(f"amed cat{n}: {e}"); amed[n] = {"items": [], "search_url": AMEDFIND_HOME}

    status = {
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": source,
        "duration_sec": round(time.time() - t0, 1),
        "counts": {
            "categories": len(cats),
            "pubmed": sum(len(v) for v in pubmed.values()),
            "guidelines_pubmed": sum(len(v["pubmed"]) for v in guidelines.values()),
            "guidelines_minds": sum(len(v["minds"]) for v in guidelines.values()),
            "amed": sum(len(v["items"]) for v in amed.values()),
        },
        "errors": errors[:50],
        "config": {"amed_configured": bool(AMED_SEARCH_URL), "minds_configured": bool(MINDS_SEARCH_URL), "ncbi_api_key": bool(NCBI_API_KEY)},
    }
    _write_json("data/pubmed.json", pubmed)
    _write_json("data/guidelines.json", guidelines)
    _write_json("data/amed.json", amed)
    _write_json("data/status.json", status)
    _invalidate()
    return status


# ---------------------------------------------------------------- Lambda エントリ

def _resp(code: int, body) -> dict:
    return {"statusCode": code, "headers": {"Content-Type": "application/json; charset=utf-8"}, "body": json.dumps(body, ensure_ascii=False)}


def handler(event, context):
    # Function URL 経由（管理者ページ）
    if isinstance(event, dict) and "requestContext" in event:
        method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
        if method == "GET":
            return _resp(200, _read_json("data/status.json", {"updated_at": None, "note": "まだ収集されていません"}))
        headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
        if not ADMIN_TOKEN or headers.get("x-admin-token") != ADMIN_TOKEN:
            return _resp(401, {"error": "invalid admin token"})
        return _resp(200, collect("admin"))
    # EventBridge スケジュール / aws lambda invoke
    src = (event or {}).get("source", "manual") if isinstance(event, dict) else "manual"
    return collect(src)
