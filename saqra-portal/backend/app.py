"""SAQRA 研究検索ポータル バックエンド API (FastAPI + Mangum on AWS Lambda)。

エンドポイント:
  GET  /api/pubmed/search?q=   PubMed 検索（日本語は Bedrock で英語クエリに変換、抄録付き）
  GET  /api/rmap/search?q=     researchmap プロキシ
  GET  /api/amed/search?q=     AMEDfind 取得 (AMED_SEARCH_URL で設定)
  POST /api/icf/future         Bedrock (Claude) による「ICF 50年後翻訳」
  POST /api/icf/translate      Bedrock (Claude) による ICF 分類（コードのみ）
"""

import json
import os
import re
import xml.etree.ElementTree as ET
from functools import lru_cache

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from mangum import Mangum
from pydantic import BaseModel

app = FastAPI(title="SAQRA Research Portal API")

HTTP_TIMEOUT = httpx.Timeout(20.0)

PUBMED_EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
RMAP_BASE_URL = os.environ.get("RMAP_BASE_URL", "https://api.researchmap.jp")
# AMEDfind の実エンドポイントは DevTools の Network タブで確認して環境変数で設定する
AMED_SEARCH_URL = os.environ.get("AMED_SEARCH_URL", "")
AMED_QUERY_PARAM = os.environ.get("AMED_QUERY_PARAM", "keyword")
BEDROCK_MODEL_ID = os.environ.get(
    "BEDROCK_MODEL_ID", "apac.anthropic.claude-sonnet-4-20250514-v1:0"
)
NCBI_API_KEY = os.environ.get("NCBI_API_KEY", "")

JAPANESE_RE = re.compile(r"[぀-ヿ㐀-䶿一-鿿]")


# ---------------------------------------------------------------- 共通ヘルパー

async def _fetch(client: httpx.AsyncClient, url: str, params: dict, upstream: str) -> httpx.Response:
    """上流APIを呼び出し、通信エラー・4xx/5xxを502に変換して返す。"""
    try:
        r = await client.get(url, params=params)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"{upstream} request failed: {e}")
    if r.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"{upstream} error {r.status_code}: {r.text[:500]}")
    return r


@lru_cache(maxsize=1)
def _bedrock_client():
    from anthropic import AnthropicBedrock

    region = os.environ.get("BEDROCK_REGION") or os.environ.get("AWS_REGION", "ap-northeast-1")
    return AnthropicBedrock(aws_region=region)


def _ask_claude(system: str, user: str, max_tokens: int) -> str:
    """Bedrock 上の Claude に1回問い合わせ、テキストを返す。失敗は502。"""
    try:
        response = _bedrock_client().messages.create(
            model=BEDROCK_MODEL_ID,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
    except Exception as e:  # Bedrock側のエラーはAPI利用者へ502で返す
        raise HTTPException(status_code=502, detail=f"Bedrock invocation failed: {e}")
    return "".join(b.text for b in response.content if b.type == "text")


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object in model output")
    return json.loads(text[start : end + 1])


def _ask_claude_json(system: str, user: str, max_tokens: int) -> dict:
    raw = _ask_claude(system, user, max_tokens)
    try:
        return _extract_json(raw)
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail=f"model returned non-JSON output: {raw[:500]}")


# ---------------------------------------------------------------- ヘルスチェック

@app.get("/")
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "saqra-portal-api", "model": BEDROCK_MODEL_ID}


# ---------------------------------------------------------------- PubMed

QUERY_TRANSLATE_SYSTEM = """You convert a Japanese search request from a cancer survivor, family member,
or clinician into a concise English PubMed search query.
Rules: output ONLY the query string, no explanation. Use plain English terms joined with AND / OR,
2 to 6 terms, prefer MeSH-like vocabulary (e.g. "cancer survivors", "return to work", "fatigue").
Do not add quotation marks unless a phrase must stay together."""


def _to_english_query(q: str) -> str:
    return _ask_claude(QUERY_TRANSLATE_SYSTEM, q, max_tokens=80).strip().strip('"')


def _parse_efetch(xml_text: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    results = []
    for art in root.findall(".//PubmedArticle"):
        pmid = (art.findtext("./MedlineCitation/PMID") or "").strip()
        article = art.find("./MedlineCitation/Article")
        if article is None:
            continue
        title_el = article.find("./ArticleTitle")
        title = "".join(title_el.itertext()).strip() if title_el is not None else ""
        abstract_parts = []
        for ab in article.findall("./Abstract/AbstractText"):
            label = ab.get("Label")
            text = "".join(ab.itertext()).strip()
            if text:
                abstract_parts.append(f"{label}: {text}" if label else text)
        authors = []
        for au in article.findall("./AuthorList/Author"):
            last, initials, collective = au.findtext("LastName"), au.findtext("Initials"), au.findtext("CollectiveName")
            if last:
                authors.append(f"{last} {initials or ''}".strip())
            elif collective:
                authors.append(collective)
        journal = article.findtext("./Journal/Title") or article.findtext("./Journal/ISOAbbreviation") or ""
        pubdate = article.findtext("./Journal/JournalIssue/PubDate/Year") or article.findtext(
            "./Journal/JournalIssue/PubDate/MedlineDate"
        ) or ""
        doi = None
        for aid in art.findall("./PubmedData/ArticleIdList/ArticleId"):
            if aid.get("IdType") == "doi":
                doi = (aid.text or "").strip()
        results.append(
            {
                "pmid": pmid,
                "title": title,
                "abstract": "\n".join(abstract_parts),
                "authors": authors,
                "source": journal,
                "pubdate": pubdate,
                "doi": doi,
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            }
        )
    return results


@app.get("/api/pubmed/search")
async def pubmed_search(
    q: str = Query(..., min_length=1),
    retmax: int = Query(10, ge=1, le=50),
):
    query_en = _to_english_query(q) if JAPANESE_RE.search(q) else q

    common = {"db": "pubmed", "tool": "saqra-portal"}
    if NCBI_API_KEY:
        common["api_key"] = NCBI_API_KEY

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        es = await _fetch(
            client,
            f"{PUBMED_EUTILS}/esearch.fcgi",
            {**common, "retmode": "json", "term": query_en, "retmax": retmax, "sort": "relevance"},
            "PubMed esearch",
        )
        esearch = es.json().get("esearchresult", {})
        ids = esearch.get("idlist", [])
        total = int(esearch.get("count", 0))
        if not ids:
            return {"query": q, "query_en": query_en, "total": 0, "results": []}

        ef = await _fetch(
            client,
            f"{PUBMED_EUTILS}/efetch.fcgi",
            {**common, "retmode": "xml", "id": ",".join(ids)},
            "PubMed efetch",
        )

    try:
        results = _parse_efetch(ef.text)
    except ET.ParseError as e:
        raise HTTPException(status_code=502, detail=f"PubMed efetch returned invalid XML: {e}")
    order = {pmid: i for i, pmid in enumerate(ids)}
    results.sort(key=lambda r: order.get(r["pmid"], 999))
    return {"query": q, "query_en": query_en, "total": total, "results": results}


# ---------------------------------------------------------------- researchmap / AMED

@app.get("/api/rmap/search")
async def rmap_search(request: Request, q: str = Query(..., min_length=1)):
    # researchmap API v2 の研究者検索をプロキシする。q 以外のクエリはそのまま転送。
    params = {k: v for k, v in request.query_params.items() if k != "q"}
    params["query"] = q
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        r = await _fetch(client, f"{RMAP_BASE_URL}/researchers", params, "researchmap")
    return r.json()


@app.get("/api/amed/search")
async def amed_search(request: Request, q: str = Query(..., min_length=1)):
    if not AMED_SEARCH_URL:
        raise HTTPException(
            status_code=501,
            detail=(
                "AMED_SEARCH_URL が未設定です。AMEDfind の検索XHRを DevTools で確認し、"
                "template.yaml の AmedSearchUrl パラメータに設定して再デプロイしてください。"
            ),
        )
    params = {k: v for k, v in request.query_params.items() if k != "q"}
    params[AMED_QUERY_PARAM] = q
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        r = await _fetch(client, AMED_SEARCH_URL, params, "AMED")
    try:
        return r.json()
    except ValueError:
        return {"raw": r.text}


# ---------------------------------------------------------------- ICF 50年後翻訳

class ICFRequest(BaseModel):
    text: str
    title: str | None = None


ICF_FUTURE_SYSTEM = """あなたは、がん研究の成果を「がんを経験した人とその家族の暮らし」の言葉に翻訳する専門家です。
ICF（国際生活機能分類, WHO 2001）の枠組みを使い、入力された研究（論文の題名・抄録、または自由記述）について、
「この研究の成果が社会に広まった50年後、暮らしはどう変わるか」を、中学生にも分かる日本語で描いてください。

方針:
- 専門用語は避け、やさしい日本語で。英語の入力でも出力は日本語。
- 断定や誇張はしない。「〜かもしれない」「〜が期待される」という書き方。研究にない効果を作らない。
- 医療上の判断を促す表現（治療の推奨など）はしない。
- 各ICF領域は最大3項目。該当なしは空配列。
- 全体で簡潔に（各テキストは1〜2文）。

必ず次のJSONのみを出力（前後の説明・コードフェンス禁止）:
{
  "plain_summary": "この研究が何を調べ、何が分かったかを2文で（やさしい日本語）",
  "who_benefits": "この研究で暮らしが変わりうる人（例: 治療後に仕事に戻る人、家族）",
  "domains": {
    "body_functions":       [{"code": "b***", "label": "ICF名称", "now": "いまの困りごと", "future": "50年後の暮らし"}],
    "activities":           [{"code": "d***", "label": "ICF名称", "now": "…", "future": "…"}],
    "participation":        [{"code": "d***", "label": "ICF名称", "now": "…", "future": "…"}],
    "environmental_factors":[{"code": "e***", "label": "ICF名称", "now": "…", "future": "…"}],
    "personal_factors":     [{"label": "内容", "now": "…", "future": "…"}]
  },
  "day_in_2076": "50年後のある一日の情景を、当事者の目線で3〜4文の物語として",
  "open_questions": ["この未来に近づくために、まだ研究が必要なこと（1〜3個、短く）"]
}
codeはICF公式コード（第2レベル以上）。"""


@app.post("/api/icf/future")
def icf_future(req: ICFRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    user = f"題名: {req.title}\n\n{req.text}" if req.title else req.text
    parsed = _ask_claude_json(ICF_FUTURE_SYSTEM, user[:12000], max_tokens=2000)
    domains = parsed.get("domains", {}) or {}
    return {
        "plain_summary": parsed.get("plain_summary", ""),
        "who_benefits": parsed.get("who_benefits", ""),
        "domains": {
            k: domains.get(k, [])
            for k in ["body_functions", "activities", "participation", "environmental_factors", "personal_factors"]
        },
        "day_in_2076": parsed.get("day_in_2076", ""),
        "open_questions": parsed.get("open_questions", []),
    }


# ---------------------------------------------------------------- ICF 分類（コードのみ）

ICF_SYSTEM = """あなたはICF（国際生活機能分類, WHO 2001）の分類専門家です。
入力された日本語または英語のテキスト（症状・生活状況・研究アブストラクト等）を読み、
関連するICFカテゴリへ分類してください。

必ず次のJSONオブジェクトのみを出力してください（前後に説明文やコードフェンスを付けない）:
{
  "body_functions": [{"code": "b***", "label": "名称", "evidence": "根拠となる記述"}],
  "activities": [{"code": "d***", "label": "名称", "evidence": "根拠となる記述"}],
  "participation": [{"code": "d***", "label": "名称", "evidence": "根拠となる記述"}],
  "environmental_factors": [{"code": "e***", "label": "名称", "evidence": "根拠となる記述"}],
  "personal_factors": [{"label": "内容", "evidence": "根拠となる記述"}],
  "related_categories": [{"code": "s*** など", "label": "名称"}]
}
該当がないカテゴリは空配列にしてください。codeはICF公式コード（第2レベル以上）を使ってください。"""


@app.post("/api/icf/translate")
def icf_translate(req: ICFRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    parsed = _ask_claude_json(ICF_SYSTEM, req.text[:12000], max_tokens=2048)
    keys = [
        "body_functions",
        "activities",
        "participation",
        "environmental_factors",
        "personal_factors",
        "related_categories",
    ]
    return {k: parsed.get(k, []) for k in keys}


handler = Mangum(app)
