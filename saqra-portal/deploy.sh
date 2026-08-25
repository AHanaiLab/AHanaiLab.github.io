#!/usr/bin/env bash
# SAQRA ポータル一括デプロイ:
#   sam build && sam deploy → フロントの API_BASE 差し込み → S3 同期 → CloudFront invalidation
# 使い方:
#   ./deploy.sh                        # 通常デプロイ
#   AMED_SEARCH_URL=... ./deploy.sh    # AMEDエンドポイントを指定してデプロイ
set -euo pipefail
cd "$(dirname "$0")"

STACK_NAME="${STACK_NAME:-saqra-portal}"
REGION="${AWS_REGION:-ap-northeast-1}"

PARAM_OVERRIDES=()
[ -n "${BEDROCK_MODEL_ID:-}" ] && PARAM_OVERRIDES+=("BedrockModelId=${BEDROCK_MODEL_ID}")
[ -n "${AMED_SEARCH_URL:-}" ] && PARAM_OVERRIDES+=("AmedSearchUrl=${AMED_SEARCH_URL}")
[ -n "${AMED_QUERY_PARAM:-}" ] && PARAM_OVERRIDES+=("AmedQueryParam=${AMED_QUERY_PARAM}")

echo "==> sam build"
sam build

echo "==> sam deploy (stack: ${STACK_NAME}, region: ${REGION})"
DEPLOY_ARGS=(--stack-name "${STACK_NAME}" --region "${REGION}")
if [ "${#PARAM_OVERRIDES[@]}" -gt 0 ]; then
  DEPLOY_ARGS+=(--parameter-overrides "${PARAM_OVERRIDES[@]}")
fi
sam deploy "${DEPLOY_ARGS[@]}"

echo "==> スタック出力を取得"
outputs() {
  aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
API_URL="$(outputs ApiUrl)"
BUCKET="$(outputs FrontendBucketName)"
DIST_ID="$(outputs DistributionId)"
FRONTEND_URL="$(outputs FrontendUrl)"

echo "==> フロントエンドに API_BASE を差し込み (${API_URL}/api)"
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "${BUILD_DIR}"' EXIT
cp -r frontend/. "${BUILD_DIR}/"
sed "s|__API_BASE__|${API_URL}/api|g" frontend/index.html > "${BUILD_DIR}/index.html"

echo "==> S3 へ同期 (s3://${BUCKET})"
aws s3 sync "${BUILD_DIR}/" "s3://${BUCKET}/" --delete --region "${REGION}"

echo "==> CloudFront キャッシュ削除 (${DIST_ID})"
aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*" >/dev/null

echo ""
echo "================ デプロイ完了 ================"
echo "フロントエンド : ${FRONTEND_URL}"
echo "API ベースURL  : ${API_URL}/api"
echo ""
echo "動作確認:"
echo "  curl \"${API_URL}/api/pubmed/search?q=cancer+survivorship\""
echo "=============================================="
