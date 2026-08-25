"""SAQRA 研究検索ポータル バックエンド API (FastAPI + Mangum on AWS Lambda)。

エンドポイント:
  GET  /api/pubmed/search?q=   PubMed E-utilities 検索
  GET  /api/rmap/search?q=     researchmap プロキシ
  GET  /api/amed/search?q=     AMEDfind 取得 (AMED_SEARCH_URL で設定)
  POST /api/icf/translate      Bedrock (Claude) による ICF 分類
"""

import json
import os
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


async def _fetch(client: httpx.AsyncClient, url: str, params: dict, upstream: str) -> httpx.Response:
    """上流APIを呼び出し、通信エラー・4xx/5xxを502に変換して返す。"""
    try:
        r = await client.get(url, params=params)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"{upstream} request failed: {e}")
    if r.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"{upstream} error {r.status_code}: {r.text[:500]}")
    return r


@app.get("/")
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "saqra-portal-api"}


@app.get("/api/pubmed/search")
async def pubmed_search(
    q: str = Query(..., min_length=1),
    retmax: int = Query(20, ge=1, le=100),
):
    common = {"db": "pubmed", "retmode": "json", "tool": "saqra-portal"}
    if os.environ.get("NCBI_API_KEY"):
        common["api_key"] = os.environ["NCBI_API_KEY"]

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        es = await _fetch(
            client,
            f"{PUBMED_EUTILS}/esearch.fcgi",
            {**common, "term": q, "retmax": retmax, "sort": "relevance"},
            "PubMed esearch",
        )
        esearch = es.json().get("esearchresult", {})
        ids = esearch.get("idlist", [])
        total = int(esearch.get("count", 0))
        if not ids:
            return {"query": q, "total": 0, "results": []}

        sm = await _fetch(
            client,
            f"{PUBMED_EUTILS}/esummary.fcgi",
            {**common, "id": ",".join(ids)},
            "PubMed esummary",
        )
        summaries = sm.json().get("result", {})

    results = []
    for pmid in ids:
        item = summaries.get(pmid)
        if not item:
            continue
        doi = next(
            (a.get("value") for a in item.get("articleids", []) if a.get("idtype") == "doi"),
            None,
        )
        results.append(
            {
                "pmid": pmid,
                "title": item.get("title"),
                "authors": [a.get("name") for a in item.get("authors", [])],
                "source": item.get("source"),
                "pubdate": item.get("pubdate"),
                "doi": doi,
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            }
        )
    return {"query": q, "total": total, "results": results}


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


class ICFRequest(BaseModel):
    text: str


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


@lru_cache(maxsize=1)
def _bedrock_client():
    from anthropic import AnthropicBedrock

    region = os.environ.get("BEDROCK_REGION") or os.environ.get("AWS_REGION", "ap-northeast-1")
    return AnthropicBedrock(aws_region=region)


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


@app.post("/api/icf/translate")
def icf_translate(req: ICFRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    try:
        response = _bedrock_client().messages.create(
            model=BEDROCK_MODEL_ID,
            max_tokens=2048,
            system=ICF_SYSTEM,
            messages=[{"role": "user", "content": req.text}],
        )
    except Exception as e:  # Bedrock側のエラーはAPI利用者へ502で返す
        raise HTTPException(status_code=502, detail=f"Bedrock invocation failed: {e}")

    raw = "".join(b.text for b in response.content if b.type == "text")
    try:
        parsed = _extract_json(raw)
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail=f"model returned non-JSON output: {raw[:500]}")

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
