#!/usr/bin/env bash
# SaQRA 研究開発マップ（叩き台）一括デプロイ:
#   sam build && sam deploy → HTML と map.json を S3 へ → 収集Lambdaを1回実行 → CloudFront invalidation → URL表示
# 使い方:
#   ./deploy.sh
#   NCBI_API_KEY=... ./deploy.sh                       # PubMed のレート上限を上げる
#   AMED_SEARCH_URL='https://.../search?keyword={q}' ./deploy.sh   # AMEDfind のエンドポイント判明後
#   MINDS_SEARCH_URL='https://minds.jcqhc.or.jp/...{q}' ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

for _py in /opt/homebrew/opt/python@3.12/bin /usr/local/opt/python@3.12/bin; do
  [ -d "${_py}" ] && PATH="${_py}:${PATH}"
done
export PATH

MISSING=0
command -v sam >/dev/null 2>&1 || { echo "エラー: sam が見つかりません (brew install aws-sam-cli)" >&2; MISSING=1; }
command -v aws >/dev/null 2>&1 || { echo "エラー: aws が見つかりません (brew install awscli)" >&2; MISSING=1; }
command -v python3.12 >/dev/null 2>&1 || { echo "エラー: python3.12 が見つかりません (brew install python@3.12)" >&2; MISSING=1; }
[ "${MISSING}" -eq 1 ] && exit 1
aws sts get-caller-identity >/dev/null 2>&1 || { echo "エラー: AWS 認証情報が未設定です ('aws configure')" >&2; exit 1; }

STACK_NAME="${STACK_NAME:-saqra-map}"
REGION="${AWS_REGION:-ap-northeast-1}"

# 管理者トークン: 初回に生成して .admin_token に保存（git には入れない）
if [ -z "${ADMIN_TOKEN:-}" ]; then
  if [ -f .admin_token ]; then ADMIN_TOKEN="$(cat .admin_token)"; else ADMIN_TOKEN="$(openssl rand -hex 16)"; printf '%s' "${ADMIN_TOKEN}" > .admin_token; fi
fi

PARAM_OVERRIDES=("AdminToken=${ADMIN_TOKEN}")
[ -n "${NCBI_API_KEY:-}" ] && PARAM_OVERRIDES+=("NcbiApiKey=${NCBI_API_KEY}")
[ -n "${AMED_SEARCH_URL:-}" ] && PARAM_OVERRIDES+=("AmedSearchUrl=${AMED_SEARCH_URL}")
[ -n "${MINDS_SEARCH_URL:-}" ] && PARAM_OVERRIDES+=("MindsSearchUrl=${MINDS_SEARCH_URL}")

echo "==> sam build"
sam build
echo "==> sam deploy (stack: ${STACK_NAME}, region: ${REGION})"
sam deploy --stack-name "${STACK_NAME}" --region "${REGION}" --parameter-overrides "${PARAM_OVERRIDES[@]}"

outputs() {
  aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
BUCKET="$(outputs SiteBucketName)"; DIST_ID="$(outputs DistributionId)"
FRONTEND_URL="$(outputs FrontendUrl)"; COLLECTOR_URL="$(outputs CollectorUrl)"

echo "==> HTML を S3 へ（data/ は収集Lambdaが書くので削除対象から除外）"
BUILD_DIR="$(mktemp -d)"; trap 'rm -rf "${BUILD_DIR}"' EXIT
cp -r frontend/. "${BUILD_DIR}/"
for f in frontend/*.html; do
  sed "s|__COLLECTOR_URL__|${COLLECTOR_URL}|g" "$f" > "${BUILD_DIR}/$(basename "$f")"
done
aws s3 sync "${BUILD_DIR}/" "s3://${BUCKET}/" --delete --exclude "data/*" --region "${REGION}"
aws s3 cp frontend/data/map.json "s3://${BUCKET}/data/map.json" --content-type "application/json; charset=utf-8" --cache-control no-cache --region "${REGION}"

echo "==> 収集Lambdaを1回実行（PubMed 30カテゴリ、1〜2分）"
FN="$(aws cloudformation describe-stack-resource --stack-name "${STACK_NAME}" --region "${REGION}" --logical-resource-id CollectorFunction --query StackResourceDetail.PhysicalResourceId --output text)"
aws lambda invoke --function-name "${FN}" --region "${REGION}" --cli-read-timeout 330 --payload '{"source":"deploy"}' --cli-binary-format raw-in-base64-out "${BUILD_DIR}/collect.json" >/dev/null && head -c 400 "${BUILD_DIR}/collect.json"; echo

echo "==> CloudFront キャッシュ削除"
aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*" >/dev/null

echo ""
echo "================ デプロイ完了 ================"
echo "研究開発マップ : ${FRONTEND_URL}"
echo "管理者ページ   : ${FRONTEND_URL}/admin.html"
echo "管理者トークン : ${ADMIN_TOKEN}   （.admin_token に保存。管理者ページで入力）"
echo "=============================================="
